"use server"

import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase/server"
import type { ActionResult } from "./actions"
import type { NotificationItem, WalletSummary } from "./types"

/**
 * The two ledgers a person keeps: what happened to them (notifications) and what
 * they are owed or owe (the freelancer wallet). Both are read on their own pages
 * rather than in the per-navigation snapshot, because neither is needed to render
 * a booking screen.
 */

export async function listNotifications(limit = 50): Promise<NotificationItem[]> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at")
    .eq("account_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) {
    console.error("listNotifications failed:", error.message)
    return []
  }
  return (data ?? []).map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body ?? "",
    link: n.link,
    readAt: n.read_at,
    createdAt: n.created_at,
  }))
}

export async function markNotificationsRead(): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("account_id", auth.user.id)
    .is("read_at", null)
  if (error) return { ok: false, error: "Không đánh dấu được đã đọc." }
  revalidatePath("/", "layout")
  return { ok: true, data: undefined }
}

/**
 * The freelancer's wallet. Prepaid commission: a completed job debits the
 * commission, a top-up credits it, and a negative balance past the threshold
 * stops new jobs. Every line says what it was for.
 */
export async function walletSummary(): Promise<WalletSummary> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { balance: 0, entries: [] }
  const { data, error } = await supabase
    .from("wallet_entries")
    .select("id, kind, amount, note, created_at, booking_id")
    .eq("pro_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) {
    console.error("walletSummary failed:", error.message)
    return { balance: 0, entries: [] }
  }
  const entries = (data ?? []).map((e) => ({
    id: e.id,
    kind: e.kind as WalletSummary["entries"][number]["kind"],
    amount: e.amount,
    note: e.note ?? "",
    createdAt: e.created_at,
    bookingId: e.booking_id,
  }))
  return { balance: entries.reduce((sum, e) => sum + e.amount, 0), entries }
}

/** What the freelancer earned from completed jobs, by month. */
export async function earningsByMonth(): Promise<{ month: string; jobs: number; gross: number; commission: number; net: number }[]> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from("bookings")
    .select("completed_at, total, commission, payout")
    .eq("pro_id", auth.user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(500)
  if (error) {
    console.error("earningsByMonth failed:", error.message)
    return []
  }
  const months = new Map<string, { month: string; jobs: number; gross: number; commission: number; net: number }>()
  for (const b of data ?? []) {
    if (!b.completed_at) continue
    // Group by the Vietnamese calendar month the job was finished in.
    const month = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
    }).format(new Date(b.completed_at))
    const row = months.get(month) ?? { month, jobs: 0, gross: 0, commission: 0, net: 0 }
    row.jobs += 1
    row.gross += b.total ?? 0
    row.commission += b.commission ?? 0
    row.net += b.payout ?? 0
    months.set(month, row)
  }
  return [...months.values()]
}

// Days off --------------------------------------------------------------------

export interface DayOff {
  id: string
  startsOn: string
  endsOn: string
  reason: string
}

export async function listDaysOff(): Promise<DayOff[]> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from("days_off")
    .select("id, starts_on, ends_on, reason")
    .eq("pro_id", auth.user.id)
    .order("starts_on")
  if (error) {
    console.error("listDaysOff failed:", error.message)
    return []
  }
  return (data ?? []).map((d) => ({ id: d.id, startsOn: d.starts_on, endsOn: d.ends_on, reason: d.reason ?? "" }))
}

export async function addDayOff(startsOn: string, endsOn: string, reason: string): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  if (endsOn < startsOn) return { ok: false, error: "Ngày kết thúc phải sau ngày bắt đầu." }

  // A day off does not cancel a job somebody already booked: those have to be
  // dealt with one by one, so say so instead of silently leaving them.
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("pro_id", auth.user.id)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", `${startsOn}T00:00:00+07:00`)
    .lte("starts_at", `${endsOn}T23:59:59+07:00`)
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Bạn còn ${count} lịch hẹn trong khoảng này. Hãy đổi giờ hoặc huỷ trước khi nghỉ.`,
    }
  }

  const { error } = await supabase
    .from("days_off")
    .insert({ pro_id: auth.user.id, starts_on: startsOn, ends_on: endsOn, reason: reason.trim() })
  if (error) return { ok: false, error: "Không lưu được ngày nghỉ." }
  revalidatePath("/studio", "layout")
  return { ok: true, data: undefined }
}

export async function removeDayOff(id: string): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { error } = await supabase.from("days_off").delete().eq("id", id)
  if (error) return { ok: false, error: "Không xoá được ngày nghỉ." }
  revalidatePath("/studio", "layout")
  return { ok: true, data: undefined }
}

// Account ---------------------------------------------------------------------

export async function updateAccount(input: { fullName: string }): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const name = input.fullName.trim()
  if (name.length < 2) return { ok: false, error: "Nhập họ tên của bạn." }
  const { error } = await supabase.from("accounts").update({ full_name: name }).eq("id", auth.user.id)
  if (error) return { ok: false, error: "Không lưu được tên." }
  revalidatePath("/", "layout")
  return { ok: true, data: undefined }
}

/**
 * Delete the account, as Decree 13/2023 requires. Refused while there is a job
 * still to happen, because the other side is counting on it.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .or(`customer_id.eq.${auth.user.id},pro_id.eq.${auth.user.id}`)
    .in("status", ["pending", "confirmed", "in_progress"])
  if ((count ?? 0) > 0) {
    return { ok: false, error: "Bạn còn lịch hẹn chưa hoàn tất. Hoàn tất hoặc huỷ trước khi xoá tài khoản." }
  }

  // Cast: the generated types are regenerated from the local stack, which does
  // not know this function until the migration has been applied there.
  const { error } = await supabase.rpc("delete_my_account" as never)
  if (error) return { ok: false, error: "Không xoá được tài khoản. Liên hệ hỗ trợ giúp bạn." }
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  return { ok: true, data: undefined }
}

// Reports ---------------------------------------------------------------------

export async function fileReport(input: {
  reason: string
  detail: string
  targetAccountId?: string | null
  bookingId?: string | null
}): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  if (input.reason.trim().length < 3) return { ok: false, error: "Chọn lý do báo cáo." }
  const { error } = await supabase.from("reports").insert({
    reporter_id: auth.user.id,
    target_account_id: input.targetAccountId ?? null,
    booking_id: input.bookingId ?? null,
    reason: input.reason.trim(),
    detail: input.detail.trim().slice(0, 1000),
  })
  if (error) return { ok: false, error: "Không gửi được báo cáo." }
  return { ok: true, data: undefined }
}
