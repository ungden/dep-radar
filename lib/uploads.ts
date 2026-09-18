"use client"

import { supabaseBrowser } from "./supabase/client"

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

export type Bucket = "avatars" | "works" | "reviews"

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

/** Returns the public URL of the stored image. */
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

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function removeImage(bucket: Bucket, publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = publicUrl.indexOf(marker)
  if (index === -1) return // A seeded image that lives in the repo, not in storage.
  const path = publicUrl.slice(index + marker.length)
  await supabaseBrowser().storage.from(bucket).remove([path])
}
