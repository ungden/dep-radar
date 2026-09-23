import * as Crypto from "expo-crypto"
import { imageUrl } from "./links"
import { one, rpc, supabase, type Row } from "./supabase"

/** Same reads and RPCs as lib/api/chat.ts. */
export interface ThreadSummary {
  id: string
  otherName: string
  otherAvatar?: string
  proSlug: string
  bookingId: string | null
  lastMessage: string
  lastMessageAt: string
  unread: number
  iAmPro: boolean
  /** The other person's account id, for blocking. */
  otherId: string
}

export interface ChatMessage {
  id: string
  mine: boolean
  body: string
  /** Signed URLs; empty when the private image could not be signed. */
  images: string[]
  hasImages: boolean
  createdAt: string
}

export async function listThreads(uid: string): Promise<ThreadSummary[]> {
  const { data, error } = await supabase
    .from("threads")
    .select(`
      id, customer_id, pro_id, booking_id, customer_name, last_message_at,
      pro:pros!threads_pro_id_fkey (slug, display_name, avatar_path),
      messages (id, sender_id, body, image_paths, read_at, created_at)
    `)
    .order("last_message_at", { ascending: false })
  if (error) throw new Error("Không tải được tin nhắn.")
  return ((data ?? []) as Row[])
    .map((t) => {
      const iAmPro = t.pro_id === uid
      const pro = one(t.pro)
      const messages = [...((t.messages ?? []) as Row[])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      const last = messages.at(-1)
      return {
        id: t.id,
        otherName: String((iAmPro ? t.customer_name : pro.display_name) || "Người dùng"),
        otherAvatar: iAmPro ? undefined : imageUrl(pro.avatar_path, "avatars"),
        proSlug: String(pro.slug ?? ""),
        bookingId: t.booking_id ?? null,
        lastMessage: last ? String(last.body || "") || ((last.image_paths ?? []).length ? "Đã gửi ảnh" : "") : "",
        lastMessageAt: t.last_message_at,
        unread: messages.filter((m) => m.sender_id !== uid && !m.read_at).length,
        iAmPro,
        otherId: String(iAmPro ? t.customer_id : t.pro_id),
      }
    })
    .filter((t) => t.lastMessage !== "")
}

export interface ThreadHeader {
  name: string
  proSlug: string
  /** The freelancer's account id, for booking them again. */
  proId: string
  bookingId: string | null
  /** The booked service, for "Đặt lại". */
  templateId: string | null
  iAmPro: boolean
  otherId: string
  /** When the conversation stops taking messages; null while it is open for good. */
  closesAt: string | null
}

export async function threadHeader(threadId: string, uid: string): Promise<ThreadHeader | null> {
  const base = "pro_id, customer_id, booking_id, customer_name, pro:pros!threads_pro_id_fkey (slug, display_name)"
  // closes_at is a computed field (20260925100000_chat_lifecycle.sql). If the
  // server does not have it yet, the chat reads as open, as it did before.
  let { data, error } = await supabase
    .from("threads")
    .select(`${base}, closes_at, booking:bookings!threads_booking_id_fkey (template_id)`)
    .eq("id", threadId)
    .maybeSingle()
  if (error) ({ data } = await supabase.from("threads").select(base).eq("id", threadId).maybeSingle())
  const row = data as Row | null
  if (!row) return null
  const iAmPro = row.pro_id === uid
  const pro = one(row.pro)
  return {
    name: String((iAmPro ? row.customer_name : pro.display_name) || "Người dùng"),
    proSlug: String(pro.slug ?? ""),
    proId: String(row.pro_id),
    bookingId: (row.booking_id ?? null) as string | null,
    templateId: (one(row.booking).template_id ?? null) as string | null,
    iAmPro,
    otherId: String(iAmPro ? row.customer_id : row.pro_id),
    closesAt: (row.closes_at ?? null) as string | null,
  }
}

async function sign(paths: string[]): Promise<Map<string, string>> {
  if (!paths.length) return new Map()
  // Chat media is private. The user's own session signs it: storage lets the
  // two people in a thread read its photos ("thread parties read chat media").
  const { data } = await supabase.storage.from("chat").createSignedUrls(paths, 60 * 60)
  return new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path ?? "", d.signedUrl as string]))
}

const privatePaths = (m: Row) => ((m.image_paths ?? []) as string[]).filter((p) => !p.startsWith("http"))

export async function listMessages(threadId: string, uid: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, image_paths, created_at")
    .eq("thread_id", threadId)
    .order("created_at")
  if (error) throw new Error("Không tải được tin nhắn.")
  const rows = (data ?? []) as Row[]
  const urls = await sign(rows.flatMap(privatePaths)).catch(() => new Map<string, string>())
  return rows.map((m) => toMessage(m, uid, urls))
}

/** A message pushed by Realtime, with its photos signed. */
export async function messageFromRow(m: Row, uid: string): Promise<ChatMessage> {
  const urls = await sign(privatePaths(m)).catch(() => new Map<string, string>())
  return toMessage(m, uid, urls)
}

export function toMessage(m: Row, uid: string, urls: Map<string, string> = new Map()): ChatMessage {
  const paths = (m.image_paths ?? []) as string[]
  return {
    id: m.id,
    mine: m.sender_id === uid,
    body: m.body ?? "",
    images: paths.map((p) => (p.startsWith("http") ? p : urls.get(p))).filter((u): u is string => Boolean(u)),
    hasImages: paths.length > 0,
    createdAt: m.created_at,
  }
}

/** Photos per message and bytes per photo, as send_message and the `chat` bucket allow. */
export const CHAT_MAX_PHOTOS = 6
const CHAT_MAX_BYTES = 5 * 1024 * 1024

/**
 * A photo for a message, already re-encoded to JPEG by reencodePhoto() (no
 * EXIF, so no GPS). Private bucket, under the sender's own folder:
 * send_message accepts only `<uid>/<uuid>.jpg`. Returns the storage path.
 */
export async function uploadChatPhoto(uid: string, jpegUri: string): Promise<string> {
  const body = await (await fetch(jpegUri)).arrayBuffer()
  if (body.byteLength > CHAT_MAX_BYTES) throw new Error("Ảnh quá lớn (tối đa 5 MB).")
  const path = `${uid}/${Crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from("chat").upload(path, body, { contentType: "image/jpeg", upsert: false })
  if (error) throw new Error("Tải ảnh lên không thành công, thử lại nhé.")
  return path
}

/**
 * send_message. `masked` is true when the database hid a phone number, link or
 * e-mail ("[đã ẩn]") because the two have no confirmed booking yet. Its
 * refusals (chat closed, three questions already sent) are written for people.
 */
export async function sendMessage(
  threadId: string,
  body: string,
  imagePaths: string[] = [],
): Promise<{ ok: true; masked: boolean } | { ok: false; error: string }> {
  const text = body.trim().slice(0, 2000)
  if (!text && !imagePaths.length) return { ok: false, error: "Nhập tin nhắn." }
  const res = await rpc<boolean | null>("send_message", { p_thread: threadId, p_body: text, p_image_paths: imagePaths.slice(0, CHAT_MAX_PHOTOS) })
  return res.ok ? { ok: true, masked: res.data === true } : { ok: false, error: res.error === "Có lỗi xảy ra, vui lòng thử lại." ? "Không gửi được tin nhắn." : res.error }
}

export const markThreadRead = (threadId: string) => rpc("mark_thread_read", { p_thread: threadId })

export const openThread = (proUuid: string, bookingId?: string | null) =>
  rpc<string>("open_thread", { p_pro: proUuid, p_booking: bookingId ?? undefined })

/** Ids of the caller's threads (row level security limits the read), for a filtered Realtime listener. */
export async function myThreadIds(): Promise<string[]> {
  const { data } = await supabase.from("threads").select("id").limit(500)
  return ((data ?? []) as Row[]).map((t) => String(t.id))
}

/** New messages in one thread, pushed by Supabase Realtime (the web's chat uses the same publication). */
export function subscribeThread(threadId: string, onInsert: (row: Row) => void) {
  const channel = supabase
    .channel(`thread:${threadId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` }, (payload) =>
      onInsert(payload.new as Row),
    )
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}

/**
 * The conversation open on screen, so a push about it is not shown on top of
 * it (data/push.ts reads this).
 */
let openThreadId: string | null = null
export const setOpenThread = (id: string | null) => {
  openThreadId = id
}
export const isThreadOpen = (id: string) => openThreadId === id
