import * as Crypto from "expo-crypto"
import { rpc, supabase, type Row } from "./supabase"

export interface MyReview {
  rating: number
  tags: string[]
  body: string
  /** Public URLs in the `reviews` bucket. */
  photos: string[]
  /** Null while blind: the author can still change it. */
  publishedAt: string | null
}

/** The customer's own review of a booking; row level security shows it to its author, blind or not. */
export async function getMyReview(bookingId: string): Promise<MyReview | null> {
  const { data, error } = await supabase.from("reviews").select("rating, tags, body, photo_paths, published_at").eq("booking_id", bookingId).maybeSingle()
  if (error) {
    // Before 20260925100200 there is no published_at: everything written was public.
    const { data: old } = await supabase.from("reviews").select("rating, tags, body, photo_paths, created_at").eq("booking_id", bookingId).maybeSingle()
    const r = old as Row | null
    return r ? { rating: r.rating, tags: r.tags ?? [], body: r.body ?? "", photos: r.photo_paths ?? [], publishedAt: r.created_at } : null
  }
  const r = data as Row | null
  return r ? { rating: r.rating, tags: r.tags ?? [], body: r.body ?? "", photos: r.photo_paths ?? [], publishedAt: r.published_at ?? null } : null
}

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
