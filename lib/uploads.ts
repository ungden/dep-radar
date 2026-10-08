"use client"

import { Upload } from "tus-js-client"
import { SUPABASE_URL } from "./supabase/env"
import { supabaseBrowser } from "./supabase/client"
import { VIDEO_MAX_BYTES, VIDEO_MAX_MB, VIDEO_MAX_SECONDS, stripVideoLocation } from "./video-meta"

/**
 * Uploading a photo.
 *
 * Every image is redrawn onto a canvas and re-encoded as JPEG before it leaves
 * the device. That resizes it, and it also drops the EXIF block -- which on a
 * phone photo carries the GPS coordinates of where it was taken, i.e. usually
 * the freelancer's or a customer's home. Nothing here should ever publish that.
 */

const MAX_EDGE = 1600
const QUALITY = 0.85

export type Bucket = "avatars" | "works" | "reviews" | "chat" | "payout"

async function reencode(file: File, maxEdge = MAX_EDGE): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Trình duyệt không xử lý được ảnh này.")
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY))
  if (!blob) throw new Error("Không nén được ảnh, thử ảnh khác nhé.")
  return blob
}

/** Returns a public URL, except private buckets (chat media, payout QR codes) which return the storage path. */
export async function uploadImage(bucket: Bucket, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Chỉ nhận tệp ảnh.")
  const supabase = supabaseBrowser()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("Cần đăng nhập.")

  const blob = await reencode(file, bucket === "avatars" ? 600 : MAX_EDGE)
  // The first path segment is the owner: storage policies check it.
  const path = `${auth.user.id}/${crypto.randomUUID()}.jpg`

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  })
  if (error) throw new Error("Tải ảnh lên không thành công, thử lại nhé.")

  return bucket === "chat" || bucket === "payout" ? path : supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function removeImage(bucket: Bucket, publicUrl: string): Promise<void> {
  if (bucket === "chat" || bucket === "payout") return
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = publicUrl.indexOf(marker)
  if (index === -1) return // A seeded image that lives in the repo, not in storage.
  const path = publicUrl.slice(index + marker.length)
  await supabaseBrowser().storage.from(bucket).remove([path])
}

// ---------------------------------------------------------------------------
// Clips

export { VIDEO_MAX_BYTES, VIDEO_MAX_MB, VIDEO_MAX_SECONDS }
/** Clips kept per account; the same number as video_quota_ok() in the database. */
export const VIDEO_MAX_COUNT = 30
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"]

/** Loads just enough of the clip to know its length and to grab a poster frame. */
async function probeVideo(file: File): Promise<{ seconds: number; poster: Blob }> {
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.preload = "auto"
    video.src = url
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error("Trình duyệt không đọc được clip này. Thử xuất lại dạng MP4 nhé."))
    })
    const seconds = video.duration
    // A frame a little in, so the poster is not the black first frame.
    video.currentTime = Math.min(0.5, seconds / 2)
    await new Promise<void>((resolve) => (video.onseeked = () => resolve()))
    const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height)
    const poster = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY))
    if (!poster) throw new Error("Không lấy được ảnh bìa cho clip.")
    return { seconds, poster }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * A clip goes up in 6 MB pieces over Supabase's resumable (TUS) endpoint: a
 * phone that drops off the network for a moment carries on from the last piece
 * instead of starting 200 MB again. Storage policies apply as with any upload.
 */
async function uploadResumable(
  bucket: "videos",
  path: string,
  body: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const { data } = await supabaseBrowser().auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Cần đăng nhập.")
  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(body, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 2000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: bucket, objectName: path, contentType, cacheControl: "31536000" },
      // Supabase requires exactly 6 MB pieces.
      chunkSize: 6 * 1024 * 1024,
      onProgress: (sent, total) => onProgress?.(total ? sent / total : 0),
      onSuccess: () => resolve(),
      onError: (err) => reject(err),
    })
    upload.start()
  })
}

/**
 * Uploads a clip of at most 60 seconds and 200 MB to the `videos` bucket, with
 * the place it was filmed removed (lib/video-meta.ts), plus a poster frame to
 * `works`. The post stores the poster as images[0], so every card has a still.
 */
export async function uploadVideo(file: File, onProgress?: (fraction: number) => void): Promise<{ video: string; poster: string }> {
  if (!VIDEO_TYPES.includes(file.type)) throw new Error("Chỉ nhận clip MP4, MOV hoặc WebM.")
  if (file.size > VIDEO_MAX_BYTES) {
    throw new Error(`Clip quá ${VIDEO_MAX_MB} MB. Quay hoặc xuất lại ở 1080p (không dùng 4K) nhé.`)
  }
  const supabase = supabaseBrowser()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("Cần đăng nhập.")

  // The database refuses the 31st clip (20260924101100); asking first saves
  // uploading a big file to be told no, and says so in words.
  const { data: existing } = await supabase.storage.from("videos").list(auth.user.id, { limit: 100 })
  if ((existing?.length ?? 0) >= VIDEO_MAX_COUNT) {
    throw new Error(`Mỗi tài khoản lưu tối đa ${VIDEO_MAX_COUNT} clip. Xoá bớt clip cũ rồi tải lên tiếp nhé.`)
  }

  const { seconds, poster } = await probeVideo(file)
  if (!Number.isFinite(seconds) || seconds > VIDEO_MAX_SECONDS + 0.5) {
    throw new Error(`Clip dài tối đa ${VIDEO_MAX_SECONDS} giây.`)
  }

  const clean = file.type === "video/webm" ? await file.arrayBuffer() : stripVideoLocation(await file.arrayBuffer()).buffer
  const extension = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4"
  const id = crypto.randomUUID()
  const videoPath = `${auth.user.id}/${id}.${extension}`
  const posterPath = `${auth.user.id}/${id}.jpg`

  const posterUpload = await supabase.storage
    .from("works")
    .upload(posterPath, poster, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false })
  if (posterUpload.error) throw new Error("Tải clip lên không thành công, thử lại nhé.")
  try {
    await uploadResumable("videos", videoPath, new Blob([clean], { type: file.type }), file.type, onProgress)
  } catch (err) {
    console.error("clip upload failed:", err)
    await supabase.storage.from("works").remove([posterPath])
    throw new Error("Tải clip lên không thành công. Kiểm tra mạng rồi thử lại nhé.")
  }

  return {
    video: supabase.storage.from("videos").getPublicUrl(videoPath).data.publicUrl,
    poster: supabase.storage.from("works").getPublicUrl(posterPath).data.publicUrl,
  }
}
