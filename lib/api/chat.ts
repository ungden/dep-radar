"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server"
import type { ActionResult } from "./actions"
import { GENERIC, messageFor, orLegacy } from "./errors"

/**
 * Messaging between a customer and a freelancer. A thread needs a reason to
 * exist — a booking they share, or a question about a published profile — so the
 * inbox cannot become a channel for messaging any freelancer about anything.
 *
 * A booking's conversation also ends (threads.closes_at, see
 * supabase/migrations/20260925100000_chat_lifecycle.sql): the history stays,
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
    supabase
      .from("threads")
      // The customer's name is on the thread, not joined from `accounts`: that
      // row carries their phone number and a thread does not entitle anyone to it.
      .select(`
        id, customer_id, pro_id, booking_id, customer_name, last_message_at,
        pro:pros!threads_pro_id_fkey (slug, display_name, avatar_path),
        messages (id, sender_id, body, image_paths, read_at, created_at)
      `)
      .order("last_message_at", { ascending: false }),
    supabase.from("user_blocks").select("blocked").eq("blocker", me),
  ])
  if (error) {
    console.error("listThreads failed:", error.message)
    return []
  }
  // Someone you blocked is out of your inbox; unblocking brings them back.
  const blocked = new Set((blocks ?? []).map((b) => b.blocked))

  return (data ?? [])
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
  /** When the conversation stops taking messages; null while it is open for good. */
  closesAt: string | null
}

/** Who the caller is talking to, and until when, for the conversation header. */
export async function threadHeader(threadId: string): Promise<ThreadHeader | null> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  // closes_at is computed by the database (a PostgREST computed field), and
  // missing until the chat lifecycle migration is in: then it is open for good.
  const { data } = await orLegacy((legacy) =>
    supabase
      .from("threads")
      .select(`
        customer_id, pro_id, booking_id, customer_name,${legacy ? "" : " closes_at,"}
        pro:pros!threads_pro_id_fkey (slug, display_name)
      `)
      .eq("id", threadId)
      .maybeSingle(),
  )
  if (!data) return null
  const row = data as unknown as Record<string, unknown>
  const iAmPro = row.pro_id === auth.user.id
  const pro = one(row.pro)
  return {
    name: String((iAmPro ? row.customer_name : pro.display_name) ?? "Người dùng"),
    otherId: String(iAmPro ? row.customer_id : row.pro_id),
    proSlug: String(pro.slug ?? ""),
    bookingId: (row.booking_id as string | null) ?? null,
    iAmPro,
    closesAt: (row.closes_at as string | null | undefined) ?? null,
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
 * Sends one message. `data` is true when the database hid contact details in
 * it ("[đã ẩn]"), so the screen can say why. A refusal (the chat has ended,
 * three questions without an answer, a block) comes back as the database's
 * own sentence.
 */
export async function sendMessage(threadId: string, body: string, images: string[] = []): Promise<ActionResult<boolean>> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  if (!body.trim() && images.length === 0) return { ok: false, error: "Nhập tin nhắn." }
  const { data, error } = await supabase.rpc("send_message", {
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
  // Before the lifecycle migration the function returned nothing: nothing hidden.
  return { ok: true, data: data === true }
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
