"use server"

import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase/server"
import type { ActionResult } from "./actions"

/**
 * Messaging between a customer and a freelancer. A thread needs a reason to
 * exist — a booking they share, or a question about a published profile — so the
 * inbox cannot become a channel for messaging any freelancer about anything.
 */

export interface ThreadSummary {
  id: string
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

  const { data, error } = await supabase
    .from("threads")
    // The customer's name is on the thread, not joined from `accounts`: that
    // row carries their phone number and a thread does not entitle anyone to it.
    .select(`
      id, customer_id, pro_id, booking_id, customer_name, last_message_at,
      pro:pros!threads_pro_id_fkey (slug, display_name, avatar_path),
      messages (id, sender_id, body, image_paths, read_at, created_at)
    `)
    .order("last_message_at", { ascending: false })
  if (error) {
    console.error("listThreads failed:", error.message)
    return []
  }

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
    .filter((t) => t.lastMessage !== "")
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
  return (data ?? []).map((m) => ({
    id: m.id,
    mine: m.sender_id === auth.user.id,
    body: m.body ?? "",
    images: m.image_paths ?? [],
    createdAt: m.created_at,
  }))
}

/** Who the caller is talking to, for the conversation header. */
export async function threadHeader(
  threadId: string,
): Promise<{ name: string; proSlug: string; bookingId: string | null; iAmPro: boolean } | null> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data } = await supabase
    .from("threads")
    .select(`
      pro_id, booking_id, customer_name,
      pro:pros!threads_pro_id_fkey (slug, display_name)
    `)
    .eq("id", threadId)
    .maybeSingle()
  if (!data) return null
  const iAmPro = data.pro_id === auth.user.id
  const pro = one(data.pro)
  return {
    name: String((iAmPro ? data.customer_name : pro.display_name) ?? "Người dùng"),
    proSlug: String(pro.slug ?? ""),
    bookingId: data.booking_id,
    iAmPro,
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

export async function sendMessage(threadId: string, body: string, images: string[] = []): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  if (!body.trim() && images.length === 0) return { ok: false, error: "Nhập tin nhắn." }
  const { error } = await supabase.from("messages").insert({
    thread_id: threadId,
    sender_id: auth.user.id,
    body: body.trim().slice(0, 2000),
    image_paths: images,
  })
  if (error) return { ok: false, error: "Không gửi được tin nhắn." }
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
