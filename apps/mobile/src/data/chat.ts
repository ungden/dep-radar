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
}

export interface ChatMessage {
  id: string
  mine: boolean
  body: string
  /** Signed URLs; empty when the private image could not be signed for this device. */
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
      }
    })
    .filter((t) => t.lastMessage !== "")
}

export async function threadHeader(threadId: string, uid: string) {
  const { data } = await supabase
    .from("threads")
    .select("pro_id, booking_id, customer_name, pro:pros!threads_pro_id_fkey (slug, display_name)")
    .eq("id", threadId)
    .maybeSingle()
  const row = data as Row | null
  if (!row) return null
  const iAmPro = row.pro_id === uid
  const pro = one(row.pro)
  return {
    name: String((iAmPro ? row.customer_name : pro.display_name) || "Người dùng"),
    proSlug: String(pro.slug ?? ""),
    bookingId: (row.booking_id ?? null) as string | null,
    iAmPro,
  }
}

async function sign(paths: string[]): Promise<Map<string, string>> {
  if (!paths.length) return new Map()
  // Chat media is private. The web signs it on the server; here the user's own
  // session asks, which storage only allows where its policies do.
  const { data } = await supabase.storage.from("chat").createSignedUrls(paths, 5 * 60)
  return new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path ?? "", d.signedUrl as string]))
}

export async function listMessages(threadId: string, uid: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, image_paths, created_at")
    .eq("thread_id", threadId)
    .order("created_at")
  if (error) throw new Error("Không tải được tin nhắn.")
  const rows = (data ?? []) as Row[]
  const urls = await sign(rows.flatMap((m) => ((m.image_paths ?? []) as string[]).filter((p) => !p.startsWith("http"))))
  return rows.map((m) => toMessage(m, uid, urls))
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

export async function sendMessage(threadId: string, body: string) {
  const text = body.trim().slice(0, 2000)
  if (!text) return { ok: false as const, error: "Nhập tin nhắn." }
  const res = await rpc("send_message", { p_thread: threadId, p_body: text, p_image_paths: [] })
  return res.ok ? res : { ok: false as const, error: "Không gửi được tin nhắn." }
}

export const markThreadRead = (threadId: string) => rpc("mark_thread_read", { p_thread: threadId })

export const openThread = (proUuid: string, bookingId?: string | null) =>
  rpc<string>("open_thread", { p_pro: proUuid, p_booking: bookingId ?? undefined })

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
