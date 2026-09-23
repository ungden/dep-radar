"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server"
import { bookingChatOpen, type ChatStatus } from "@/lib/connection"
import type { ActionResult } from "./actions"
import { GENERIC, messageFor, orLegacy } from "./errors"

/**
 * Messaging between a customer and a freelancer who are matched: a booking the
 * freelancer accepted (or a request they took), or an accepted casting call.
 * There is no conversation before that, from a profile or anywhere else.
 *
 * The conversation ends with the job (threads.chat_status, see
 * supabase/migrations/20260926100000_match_then_chat.sql): the history stays,
 * the box to write in goes.
 */

export interface ThreadSummary {
  id: string
  /** Account id of the other person, for blocking. */
  otherId: string
  otherName: string
  otherAvatar: string | null
  /** The freelancer's slug, for linking to their profile. */
  proSlug: string
  bookingId: string | null
  lastMessage: string
  lastMessageAt: string
  unread: number
  iAmPro: boolean
  /** Whether messages can still be written. */
  chatStatus: ChatStatus
}

export interface ChatMessage {
  id: string
  mine: boolean
  body: string
  images: string[]
  createdAt: string
}

const one = (v: unknown) => (Array.isArray(v) ? ((v[0] ?? {}) as Record<string, unknown>) : ((v ?? {}) as Record<string, unknown>))

export async function listThreads(): Promise<ThreadSummary[]> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const me = auth.user.id

  const [{ data, error }, { data: blocks }] = await Promise.all([
    orLegacy((legacy) =>
      supabase
        .from("threads")
        // The customer's name is on the thread, not joined from `accounts`: that
        // row carries their phone number and a thread does not entitle anyone to it.
        .select(`
          id, customer_id, pro_id, booking_id, customer_name, last_message_at,${legacy ? "" : " chat_status,"}
          pro:pros!threads_pro_id_fkey (slug, display_name, avatar_path),
          messages (id, sender_id, body, image_paths, read_at, created_at)
        `)
        .order("last_message_at", { ascending: false }),
    ),
    supabase.from("user_blocks").select("blocked").eq("blocker", me),
  ])
  if (error) {
    console.error("listThreads failed:", error.message)
    return []
  }
  // Someone you blocked is out of your inbox; unblocking brings them back.
  const blocked = new Set((blocks ?? []).map((b) => b.blocked))

  const rows = (data ?? []) as unknown as Row[]
  const legacyStatus = await legacyChatStatus(supabase, rows)
  return rows
    .map((t) => {
      const iAmPro = t.pro_id === me
      const pro = one(t.pro)
      const messages = [...((t.messages ?? []) as Record<string, unknown>[])].sort((a, b) =>
        String(a.created_at).localeCompare(String(b.created_at)),
      )
      const last = messages.at(-1)
      return {
        id: t.id,
        otherId: iAmPro ? t.customer_id : t.pro_id,
        otherName: String((iAmPro ? t.customer_name : pro.display_name) ?? "Người dùng"),
        otherAvatar: (iAmPro ? null : pro.avatar_path) as string | null,
        proSlug: String(pro.slug ?? ""),
        bookingId: t.booking_id,
        lastMessage: last
          ? String(last.body || "") || (Array.isArray(last.image_paths) && last.image_paths.length ? "Đã gửi ảnh" : "")
          : "",
        lastMessageAt: t.last_message_at,
        unread: messages.filter((m) => m.sender_id !== me && !m.read_at).length,
        iAmPro,
        chatStatus: statusOf(t, legacyStatus),
      }
    })
    // A thread nobody has written in yet is noise in the inbox.
    .filter((t) => t.lastMessage !== "" && !blocked.has(t.otherId))
}

export async function listMessages(threadId: string): Promise<ChatMessage[]> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, image_paths, created_at")
    .eq("thread_id", threadId)
    .order("created_at")
  if (error) {
    console.error("listMessages failed:", error.message)
    return []
  }
  const paths = (data ?? []).flatMap((m) => (m.image_paths ?? []).filter((path) => !path.startsWith("http")))
  const { data: signed } = paths.length
    ? await supabaseAdmin().storage.from("chat").createSignedUrls(paths, 5 * 60)
    : { data: [] }
  const urls = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]))

  return (data ?? []).map((m) => ({
    id: m.id,
    mine: m.sender_id === auth.user.id,
    body: m.body ?? "",
    images: (m.image_paths ?? []).map((path) => (path.startsWith("http") ? path : urls.get(path))).filter(Boolean) as string[],
    createdAt: m.created_at,
  }))
}

export interface ThreadHeader {
  name: string
  /** Account id of the other person, for blocking and reporting. */
  otherId: string
  proSlug: string
  bookingId: string | null
  iAmPro: boolean
  /** 'waiting' until the freelancer accepts, 'open' while matched, then 'closed'. */
  chatStatus: ChatStatus
}

type Row = Record<string, any>
type Supabase = Awaited<ReturnType<typeof supabaseServer>>

const CHAT_STATUSES: ChatStatus[] = ["waiting", "open", "closed"]

/**
 * Before the match-then-chat migration the database has no chat_status: read
 * the bookings' own status instead, by the same rule (lib/connection.ts). A
 * thread without a booking was a question before booking, which is closed now.
 */
async function legacyChatStatus(supabase: Supabase, rows: Row[]): Promise<Map<string, ChatStatus> | null> {
  if (!rows.length || rows.some((r) => "chat_status" in r)) return null
  const ids = [...new Set(rows.map((r) => r.booking_id).filter(Boolean))] as string[]
  const status = new Map<string, ChatStatus>()
  if (!ids.length) return status
  const { data } = await supabase.from("bookings").select("id, status").in("id", ids)
  for (const b of data ?? []) {
    status.set(b.id, bookingChatOpen(b.status) ? "open" : b.status === "pending" ? "waiting" : "closed")
  }
  return status
}

function statusOf(row: Row, legacy: Map<string, ChatStatus> | null): ChatStatus {
  if (!legacy) return CHAT_STATUSES.includes(row.chat_status) ? row.chat_status : "closed"
  return (row.booking_id && legacy.get(row.booking_id)) || "closed"
}

/** Who the caller is talking to, and until when, for the conversation header. */
export async function threadHeader(threadId: string): Promise<ThreadHeader | null> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  // chat_status is computed by the database (a PostgREST computed field), and
  // missing until the match-then-chat migration is in.
  const { data } = await orLegacy((legacy) =>
    supabase
      .from("threads")
      .select(`
        customer_id, pro_id, booking_id, customer_name,${legacy ? "" : " chat_status,"}
        pro:pros!threads_pro_id_fkey (slug, display_name)
      `)
      .eq("id", threadId)
      .maybeSingle(),
  )
  if (!data) return null
  const row = data as unknown as Row
  const iAmPro = row.pro_id === auth.user.id
  const pro = one(row.pro)
  return {
    name: String((iAmPro ? row.customer_name : pro.display_name) ?? "Người dùng"),
    otherId: String(iAmPro ? row.customer_id : row.pro_id),
    proSlug: String(pro.slug ?? ""),
    bookingId: (row.booking_id as string | null) ?? null,
    iAmPro,
    chatStatus: statusOf(row, await legacyChatStatus(supabase, [row])),
  }
}

export async function openThread(proId: string, bookingId?: string | null): Promise<ActionResult<string>> {
  const supabase = await supabaseServer()
  // URLs carry a slug; the RPC needs the row id.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proId)
  let pro = proId
  if (!isUuid) {
    const { data } = await supabase.from("pros").select("id").eq("slug", proId).maybeSingle()
    if (!data) return { ok: false, error: "Không tìm thấy chuyên viên." }
    pro = data.id
  }
  const { data, error } = await supabase.rpc("open_thread", { p_pro: pro, p_booking: bookingId ?? undefined })
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: data as unknown as string }
}

/**
 * Sends one message. A refusal (not accepted yet, the job has ended, a block)
 * comes back as the database's own sentence.
 */
export async function sendMessage(threadId: string, body: string, images: string[] = []): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  if (!body.trim() && images.length === 0) return { ok: false, error: "Nhập tin nhắn." }
  const { error } = await supabase.rpc("send_message", {
    p_thread: threadId,
    p_body: body.trim().slice(0, 2000),
    p_image_paths: images,
  })
  if (error) {
    const message = messageFor(error)
    return { ok: false, error: message === GENERIC ? "Không gửi được tin nhắn." : message }
  }
  revalidatePath(`/tin-nhan/${threadId}`)
  revalidatePath("/tin-nhan")
  return { ok: true, data: undefined }
}

/**
 * Stamp the other side's messages as read. This goes through an RPC rather than
 * an update, because the row belongs to the other person: the function touches
 * read_at and nothing else, which a row-level policy could not guarantee.
 */
export async function markThreadRead(threadId: string): Promise<void> {
  const supabase = await supabaseServer()
  await supabase.rpc("mark_thread_read", { p_thread: threadId })
}
