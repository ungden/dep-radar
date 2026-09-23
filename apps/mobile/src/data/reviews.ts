import * as Crypto from "expo-crypto"
import { rpc, supabase } from "./supabase"

/** Same RPC and arguments as writeReview() in lib/api/actions.ts. */
export const writeReview = (input: { bookingId: string; rating: number; tags: string[]; body: string; photos: string[] }) =>
  rpc("write_review", {
    p_booking: input.bookingId,
    p_rating: input.rating,
    p_tags: input.tags,
    p_body: input.body,
    p_photo_paths: input.photos,
  })

/**
 * A result photo, already re-encoded by reencodePhoto() (which drops the EXIF
 * block and its GPS position). Goes to the public `reviews` bucket under the
 * author's own folder, like uploadImage("reviews") on the web.
 */
export async function uploadReviewPhoto(uid: string, jpegUri: string): Promise<string> {
  const body = await (await fetch(jpegUri)).arrayBuffer()
  const path = `${uid}/${Crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from("reviews").upload(path, body, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false })
  if (error) throw new Error("Tải ảnh lên không thành công, thử lại nhé.")
  return supabase.storage.from("reviews").getPublicUrl(path).data.publicUrl
}
