"use server"

import { revalidatePath } from "next/cache"
import { backendEnabled } from "@/lib/supabase/env"
import { supabaseServer } from "@/lib/supabase/server"
import { localDate, localTime } from "@/lib/utils"
import type { ActionResult } from "./actions"
import { messageFor, orLegacy } from "./errors"

/**
 * The operations desk. Reads go through row level security with the admin
 * policies, writes through RPCs that check `is_admin()` themselves, so an admin
 * page rendered to the wrong person still cannot do anything.
 */

export interface PendingCheck {
  id: string
  proId: string
  proSlug: string
  proName: string
  nameOnCard: string | null
  nameMatches: boolean | null
  samePerson: string | null
  confidence: number | null
  reason: string | null
  createdAt: string
}

export interface AdminPro {
  id: string
  slug: string
  name: string
  city: string
  district: string
  identity: string
  published: boolean
  suspended: boolean
  acceptingJobs: boolean
  completedJobs: number
  rating: number
  ratingCount: number
  wallet: number
  /** The code on their fee transfers ("NAP AB23CD"); null before the match-then-chat migration. */
  payCode: string | null
}

export interface AdminBooking {
  id: string
  status: string
  date: string
  time: string
  proName: string
  customerName: string
  total: number
  serviceLabel: string
}

export interface AdminReport {
  id: string
  reason: string
  detail: string
  status: string
  createdAt: string
  reporter: string
}

const row = (v: unknown) => (Array.isArray(v) ? ((v[0] ?? {}) as Record<string, unknown>) : ((v ?? {}) as Record<string, unknown>))

export async function isAdmin(): Promise<boolean> {
  // Nobody is an admin of a database that is not configured.
  if (!backendEnabled) return false
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return false
  const { data } = await supabase.from("accounts").select("is_admin").eq("id", auth.user.id).maybeSingle()
  return Boolean(data?.is_admin)
}

export async function pendingChecks(): Promise<PendingCheck[]> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from("identity_checks")
    .select(`
      id, pro_id, status, name_on_card, name_matches, same_person, confidence, reject_reason, created_at,
      pros!identity_checks_pro_id_fkey (slug, display_name)
    `)
    .eq("status", "pending")
    .order("created_at")
  if (error) {
    console.error("pendingChecks failed:", error.message)
    return []
  }
  return (data ?? []).map((r) => {
    const pro = row(r.pros)
    return {
      id: r.id,
      proId: r.pro_id,
      proSlug: String(pro.slug ?? ""),
      proName: String(pro.display_name ?? "Chuyên viên"),
      nameOnCard: r.name_on_card,
      nameMatches: r.name_matches,
      samePerson: r.same_person,
      confidence: r.confidence === null ? null : Number(r.confidence),
      reason: r.reject_reason,
      createdAt: r.created_at,
    }
  })
}

export async function adminPros(): Promise<AdminPro[]> {
  const supabase = await supabaseServer()
  const { data: rows, error } = await orLegacy((legacy) =>
    supabase
      .from("pros")
      .select(
        `id, slug, display_name, city, district, identity_status, published, suspended_at, accepting_jobs, completed_jobs, rating_avg, rating_count${legacy ? "" : ", pay_code"}`,
      )
      .order("created_at", { ascending: false }),
  )
  const data = rows as Record<string, any>[] | null
  if (error) {
    console.error("adminPros failed:", error.message)
    return []
  }
  const { data: ledger } = await supabase.from("wallet_entries").select("pro_id, amount")
  const balances = new Map<string, number>()
  for (const entry of ledger ?? []) {
    balances.set(entry.pro_id, (balances.get(entry.pro_id) ?? 0) + entry.amount)
  }
  return (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.display_name,
    city: p.city,
    district: p.district,
    identity: p.identity_status,
    published: p.published,
    suspended: Boolean(p.suspended_at),
    acceptingJobs: p.accepting_jobs,
    completedJobs: p.completed_jobs,
    rating: Number(p.rating_avg),
    ratingCount: p.rating_count,
    wallet: balances.get(p.id) ?? 0,
    payCode: p.pay_code ?? null,
  }))
}

export async function adminBookings(limit = 40): Promise<AdminBooking[]> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, status, starts_at, total, template_id, variant_id,
      customer:accounts!bookings_customer_id_fkey (full_name),
      pro:pros!bookings_pro_id_fkey (display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) {
    console.error("adminBookings failed:", error.message)
    return []
  }
  return (data ?? []).map((b) => ({
    id: b.id,
    status: b.status,
    date: localDate(b.starts_at),
    time: localTime(b.starts_at),
    proName: String(row(b.pro).display_name ?? "—"),
    customerName: String(row(b.customer).full_name ?? "—"),
    total: b.total ?? 0,
    serviceLabel: `${b.template_id} · ${b.variant_id}`,
  }))
}

export async function adminReports(): Promise<AdminReport[]> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from("reports")
    .select("id, reason, detail, status, created_at, accounts!reports_reporter_id_fkey (full_name)")
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) {
    console.error("adminReports failed:", error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    reason: r.reason,
    detail: r.detail ?? "",
    status: r.status,
    createdAt: r.created_at,
    reporter: String(row(r.accounts).full_name ?? "—"),
  }))
}

// Decisions -------------------------------------------------------------------

async function call(fn: string, args: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { error } = await supabase.rpc(fn as never, args as never)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin")
  return { ok: true, data: undefined }
}

export async function decideCheck(checkId: string, approve: boolean, reason = "") {
  return call("decide_identity_check", { p_check: checkId, p_approve: approve, p_reason: reason })
}

export async function setSuspended(proId: string, suspended: boolean, reason = "") {
  return call("set_pro_suspended", { p_pro: proId, p_suspended: suspended, p_reason: reason })
}

export async function setReviewHidden(bookingId: string, hidden: boolean) {
  return call("set_review_hidden", { p_booking: bookingId, p_hidden: hidden })
}

export async function resolveReport(reportId: string, status: string, resolution = "") {
  return call("resolve_report", { p_report: reportId, p_status: status, p_resolution: resolution })
}

/**
 * Staff credit a freelancer's wallet after seeing the transfer on the bank
 * statement. `ref` is the bank's transaction reference, so the same transfer
 * is not recorded twice.
 */
export async function recordTopup(proId: string, amount: number, ref: string): Promise<ActionResult> {
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, error: "Nhập số tiền." }
  const supabase = await supabaseServer()
  const reference = ref.trim()
  // False: that reference was already recorded, so nothing was credited.
  const { data, error } = await supabase.rpc("record_topup", { p_pro: proId, p_amount: amount, p_ref: reference })
  if (error) return { ok: false, error: messageFor(error) }
  if (data === false) return { ok: false, error: "Mã giao dịch này đã được ghi nhận rồi, không cộng lần nữa." }
  revalidatePath("/admin")
  return { ok: true, data: undefined }
}
