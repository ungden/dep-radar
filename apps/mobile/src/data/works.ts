import * as Crypto from "expo-crypto"
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import { messageFor, supabase, type Result } from "./supabase"

/**
 * Posting a work, the way lib/uploads.ts + saveWork() do it on the web.
 *
 * Every photo is redrawn and re-encoded as JPEG on the phone before it leaves:
 * that resizes it and drops the EXIF block, which on a phone photo carries the
 * GPS position where it was taken -- usually someone's home.
 */
const MAX_EDGE = 1600
const QUALITY = 0.85

export async function reencodePhoto(uri: string, width: number, height: number): Promise<string> {
  const scale = Math.min(1, MAX_EDGE / Math.max(width || MAX_EDGE, height || MAX_EDGE))
  const context = ImageManipulator.manipulate(uri)
  if (scale < 1) context.resize({ width: Math.round((width || MAX_EDGE) * scale) })
  const image = await context.renderAsync()
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: QUALITY })
  return saved.uri
}

async function upload(uid: string, localUri: string, ext: "jpg" | "mp4"): Promise<string> {
  const body = await (await fetch(localUri)).arrayBuffer()
  // The first path segment is the owner: the storage policies check it.
  const path = `${uid}/${Crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from("works").upload(path, body, {
    contentType: ext === "jpg" ? "image/jpeg" : "video/mp4",
    cacheControl: "31536000",
    upsert: false,
  })
  if (error) {
    if (ext === "mp4") throw new Error("Máy chủ chưa nhận video. Bạn đăng ảnh trước nhé.")
    throw new Error("Tải ảnh lên không thành công, thử lại nhé.")
  }
  return supabase.storage.from("works").getPublicUrl(path).data.publicUrl
}

export const uploadPhoto = (uid: string, jpegUri: string) => upload(uid, jpegUri, "jpg")
export const uploadVideo = (uid: string, uri: string) => upload(uid, uri, "mp4")

/** Whether the database has the columns for clips yet (being added in parallel). */
export async function worksSupportVideo(): Promise<boolean> {
  const { error } = await supabase.from("works").select("video_path").limit(1)
  return !error
}

async function uniqueWorkSlug(title: string): Promise<string> {
  const { data } = await supabase.rpc("slugify", { input: title })
  const base = (data as string | null) || "tac-pham"
  const { data: taken } = await supabase.from("works").select("slug").like("slug", `${base}%`)
  const used = new Set(((taken ?? []) as { slug: string }[]).map((w) => w.slug))
  if (!used.has(base)) return base
  for (let i = 2; i < 200; i++) if (!used.has(`${base}-${i}`)) return `${base}-${i}`
  return `${base}-${Date.now().toString(36)}`
}

export async function saveWork(
  uid: string,
  input: { templateId: string; title: string; description: string; images: string[]; video?: string },
): Promise<Result<string>> {
  if (!input.images.length) return { ok: false, error: "Cần ít nhất một ảnh." }
  const slug = await uniqueWorkSlug(input.title)
  const row: Record<string, unknown> = {
    pro_id: uid,
    template_id: input.templateId,
    title: input.title.trim(),
    description: input.description.trim(),
    image_paths: input.images,
    slug,
  }
  if (input.video) row.video_path = input.video
  const { data, error } = await supabase.from("works").insert(row).select("id").single()
  if (error) return { ok: false, error: messageFor(error) }
  return { ok: true, data: (data as { id: string }).id }
}
