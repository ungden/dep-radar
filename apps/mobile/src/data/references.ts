import * as Crypto from "expo-crypto"
import { reencodePhoto } from "./works"
import { rpc, supabase, type Result } from "./supabase"

/**
 * Reference photos ("ảnh mẫu"): the look a customer wants, 1 to 3, in the
 * private `references` bucket under their own folder. A booking carries them
 * (set_booking_references, as the web) and so does a request
 * (set_job_references, 20261016100000_job_references.sql); a partner sees them
 * before taking the job.
 */
export const MAX_REFERENCES = 3
const MAX_BYTES = 5 * 1024 * 1024

/** Re-encoded first (no EXIF, so no GPS), then uploaded. Returns the storage path. */
export async function uploadReference(uid: string, photo: { uri: string; width: number; height: number }): Promise<string> {
  const jpeg = await reencodePhoto(photo.uri, photo.width, photo.height)
  const body = await (await fetch(jpeg)).arrayBuffer()
  if (body.byteLength > MAX_BYTES) throw new Error("Ảnh quá lớn (tối đa 5 MB).")
  const path = `${uid}/${Crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from("references").upload(path, body, { contentType: "image/jpeg", upsert: false })
  if (error) throw new Error("Tải ảnh mẫu lên không thành công, thử lại nhé.")
  return path
}

/** Signed URLs for paths the reader may see (the storage policies decide), in the same order; missing ones dropped. */
export async function signReferences(paths: string[]): Promise<string[]> {
  if (!paths.length) return []
  const { data } = await supabase.storage.from("references").createSignedUrls(paths, 60 * 60)
  const urls = new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path ?? "", d.signedUrl as string]))
  return paths.map((p) => urls.get(p)).filter((u): u is string => Boolean(u))
}

export const setJobReferences = (jobId: string, paths: string[]): Promise<Result> =>
  rpc("set_job_references", { p_job: jobId, p_paths: paths.slice(0, MAX_REFERENCES) })

export const setBookingReferences = (bookingId: string, paths: string[]): Promise<Result> =>
  rpc("set_booking_references", { p_booking: bookingId, p_paths: paths.slice(0, MAX_REFERENCES) })
