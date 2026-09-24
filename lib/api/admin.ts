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
  /** The code on their fee transfers ("DEPAB23CD"); null before the match-then-chat migration. */
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

// The AI reviewer's log ------------------------------------------------------------

export type AiSubject = "pro_profile" | "work" | "follow_up"

export interface AiDecisionItem {
  id: string
  createdAt: string
  subject: AiSubject
  /** What the AI (or the rules) decided. */
  decision: string
  reasons: string[]
  summary: string
  model: string
  proSlug: string
  proName: string
  workTitle: string | null
  /** The post's photos, or the photos the reviewer looked at. */
  photos: string[]
  overriddenAt: string | null
  overrideDecision: string | null
  overrideNote: string | null
  overriddenBy: string | null
}

/** Newest first, and how many decisions the last 24 hours had. Empty before the 20260929100000 migration. */
export async function aiDecisions(limit = 200): Promise<{ items: AiDecisionItem[]; last24h: number }> {
  const supabase = await supabaseServer()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("ai_decisions")
      .select(`
        id, created_at, subject, decision, reasons, summary, model, input,
        overridden_at, override_decision, override_note,
        pro:pros!ai_decisions_pro_id_fkey (slug, display_name),
        work:works!ai_decisions_work_id_fkey (title, image_paths),
        overrider:accounts!ai_decisions_overridden_by_fkey (full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("ai_decisions").select("id", { count: "exact", head: true }).gte("created_at", since),
  ])
  if (error) {
    console.error("aiDecisions failed:", error.message)
    return { items: [], last24h: 0 }
  }
  const items = (data ?? []).map((r) => {
    const pro = row(r.pro)
    const work = r.work ? row(r.work) : null
    const input = row(r.input)
    const photos = work ? work.image_paths : input.photos
    return {
      id: r.id,
      createdAt: r.created_at,
      subject: r.subject as AiSubject,
      decision: r.decision,
      reasons: r.reasons ?? [],
      summary: r.summary ?? "",
      model: r.model,
      proSlug: String(pro.slug ?? ""),
      proName: String(pro.display_name ?? "Đối tác"),
      workTitle: work ? String(work.title ?? "") : typeof input.title === "string" ? input.title : null,
      photos: Array.isArray(photos) ? photos.filter((p): p is string => typeof p === "string") : [],
      overriddenAt: r.overridden_at,
      overrideDecision: r.override_decision,
      overrideNote: r.override_note,
      overriddenBy: r.overrider ? String(row(r.overrider).full_name ?? "") || null : null,
    }
  })
  return { items, last24h: count ?? 0 }
}

/** Reverses a decision in the log; admin_override_ai_decision checks is_admin() and tells the partner. */
export async function overrideAiDecision(decisionId: string, decision: string, note = "") {
  return call("admin_override_ai_decision", { p_decision_id: decisionId, p_decision: decision, p_note: note })
}

// The desk's customers, money and settings (20261004100000) --------------------------

export interface AdminCustomer {
  id: string
  name: string
  phone: string
  email: string | null
  createdAt: string
  isPro: boolean
  bookings: number
  completed: number
  cancelled: number
  noShows: number
  spent: number
  lastBookingAt: string | null
  suspendedAt: string | null
  suspendReason: string
}

export async function adminCustomers(query = ""): Promise<ActionResult<AdminCustomer[]>> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc("admin_customers" as never, { p_query: query.trim(), p_limit: 200 } as never)
  if (error) return { ok: false, error: messageFor(error) }
  return {
    ok: true,
    data: ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      name: String(r.full_name || "—"),
      phone: String(r.phone ?? ""),
      email: (r.email as string | null) ?? null,
      createdAt: String(r.created_at),
      isPro: Boolean(r.is_pro),
      bookings: Number(r.bookings ?? 0),
      completed: Number(r.completed ?? 0),
      cancelled: Number(r.cancelled ?? 0),
      noShows: Number(r.no_shows ?? 0),
      spent: Number(r.spent ?? 0),
      lastBookingAt: (r.last_booking_at as string | null) ?? null,
      suspendedAt: (r.suspended_at as string | null) ?? null,
      suspendReason: String(r.suspend_reason ?? ""),
    })),
  }
}

export async function setAccountSuspended(accountId: string, suspended: boolean, reason = "") {
  return call("admin_set_account_suspended", { p_account: accountId, p_suspended: suspended, p_reason: reason })
}

export interface FinanceSummary {
  completed: number
  gmv: number
  serviceRevenue: number
  commission: number
  discounts: number
  created: number
  cancelled: number
  noShows: number
  expired: number
  topupsSepay: number
  topupsStaff: number
  feesCharged: number
  adjustments: number
  voucherCredits: number
  referralPaid: number
  noShowComp: number
  owing: number
  owed: number
  credit: number
}

export interface FinanceByPro {
  proId: string
  slug: string
  name: string
  nameOnCard: string | null
  identity: string
  phone: string
  city: string
  district: string
  completed: number
  gmv: number
  commission: number
  topups: number
  balance: number
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

export async function financeReport(from: string, to: string): Promise<ActionResult<{ summary: FinanceSummary; byPro: FinanceByPro[] }>> {
  if (!DATE.test(from) || !DATE.test(to) || from > to) return { ok: false, error: "Chọn khoảng ngày hợp lệ." }
  const supabase = await supabaseServer()
  const [summary, byPro] = await Promise.all([
    supabase.rpc("admin_finance_summary" as never, { p_from: from, p_to: to } as never),
    supabase.rpc("admin_finance_by_pro" as never, { p_from: from, p_to: to } as never),
  ])
  if (summary.error) return { ok: false, error: messageFor(summary.error) }
  if (byPro.error) return { ok: false, error: messageFor(byPro.error) }
  const s = (summary.data ?? {}) as Record<string, unknown>
  const num = (k: string) => Number(s[k] ?? 0)
  return {
    ok: true,
    data: {
      summary: {
        completed: num("completed"),
        gmv: num("gmv"),
        serviceRevenue: num("serviceRevenue"),
        commission: num("commission"),
        discounts: num("discounts"),
        created: num("created"),
        cancelled: num("cancelled"),
        noShows: num("noShows"),
        expired: num("expired"),
        topupsSepay: num("topupsSepay"),
        topupsStaff: num("topupsStaff"),
        feesCharged: num("feesCharged"),
        adjustments: num("adjustments"),
        voucherCredits: num("voucherCredits"),
        referralPaid: num("referralPaid"),
        noShowComp: num("noShowComp"),
        owing: num("owing"),
        owed: num("owed"),
        credit: num("credit"),
      },
      byPro: ((byPro.data ?? []) as Record<string, unknown>[]).map((r) => ({
        proId: String(r.pro_id),
        slug: String(r.slug),
        name: String(r.display_name ?? ""),
        nameOnCard: (r.name_on_card as string | null) ?? null,
        identity: String(r.identity ?? "none"),
        phone: String(r.phone ?? ""),
        city: String(r.city ?? ""),
        district: String(r.district ?? ""),
        completed: Number(r.completed ?? 0),
        gmv: Number(r.gmv ?? 0),
        commission: Number(r.commission ?? 0),
        topups: Number(r.topups ?? 0),
        balance: Number(r.balance ?? 0),
      })),
    },
  }
}

/** A correction to a freelancer's wallet: signed amount, reason required, logged. */
export async function adjustWallet(proId: string, amount: number, note: string) {
  if (!Number.isInteger(amount) || amount === 0) return { ok: false as const, error: "Nhập số tiền (âm để trừ)." }
  return call("admin_adjust_wallet", { p_pro: proId, p_amount: amount, p_note: note })
}

export interface PlatformSettings {
  companyName: string
  companyTaxId: string
  companyAddress: string
  supportZalo: string
  supportEmail: string
  topupBankBin: string
  topupAccountNo: string
  topupAccountName: string
  referralEnabled: boolean
  referralCustomerAmount: number
  referralProAmount: number
  referralMinTotal: number
  referralMonthlyCap: number
  voucherDays: number
}

export interface FeePolicyView {
  commissionRate: number
  walletFloor: number
  confirmWithinHours: number
  freeCancelHours: number
  lateCancelRate: number
  freeTravelKm: number
  travelFeePerKm: number
  travelFeeCap: number
  urgentWithinHours: number
  urgentFee: number
}

export interface AdminAction {
  id: string
  createdAt: string
  actor: string
  action: string
  targetId: string | null
  detail: Record<string, unknown>
}

export async function adminSettings(): Promise<{ settings: PlatformSettings; fees: FeePolicyView; log: AdminAction[] }> {
  const supabase = await supabaseServer()
  const [{ data: s }, { data: f }, { data: log }] = await Promise.all([
    supabase.from("platform_settings").select("*").maybeSingle(),
    supabase.from("fee_policy").select("*").maybeSingle(),
    supabase
      .from("admin_actions" as never)
      .select("id, created_at, action, target_id, detail, actor:accounts!admin_actions_actor_id_fkey (full_name)")
      .order("created_at", { ascending: false })
      .limit(100),
  ])
  const r = (s ?? {}) as Record<string, unknown>
  const p = (f ?? {}) as Record<string, unknown>
  const text = (v: unknown) => (v == null ? "" : String(v))
  return {
    settings: {
      companyName: text(r.company_name),
      companyTaxId: text(r.company_tax_id),
      companyAddress: text(r.company_address),
      supportZalo: text(r.support_zalo),
      supportEmail: text(r.support_email),
      topupBankBin: text(r.topup_bank_bin),
      topupAccountNo: text(r.topup_account_no),
      topupAccountName: text(r.topup_account_name),
      referralEnabled: Boolean(r.referral_enabled),
      referralCustomerAmount: Number(r.referral_customer_amount ?? 0),
      referralProAmount: Number(r.referral_pro_amount ?? 0),
      referralMinTotal: Number(r.referral_min_total ?? 0),
      referralMonthlyCap: Number(r.referral_monthly_cap ?? 0),
      voucherDays: Number(r.voucher_days ?? 0),
    },
    fees: {
      commissionRate: Number(p.commission_rate ?? 0),
      walletFloor: Number(p.wallet_floor ?? 0),
      confirmWithinHours: Number(p.confirm_within_hours ?? 0),
      freeCancelHours: Number(p.free_cancel_hours ?? 0),
      lateCancelRate: Number(p.late_cancel_rate ?? 0),
      freeTravelKm: Number(p.free_travel_km ?? 0),
      travelFeePerKm: Number(p.travel_fee_per_km ?? 0),
      travelFeeCap: Number(p.travel_fee_cap ?? 0),
      urgentWithinHours: Number(p.urgent_within_hours ?? 0),
      urgentFee: Number(p.urgent_fee ?? 0),
    },
    log: ((log ?? []) as Record<string, unknown>[]).map((a) => ({
      id: String(a.id),
      createdAt: String(a.created_at),
      actor: String(row(a.actor).full_name ?? "Hệ thống"),
      action: String(a.action),
      targetId: (a.target_id as string | null) ?? null,
      detail: (a.detail ?? {}) as Record<string, unknown>,
    })),
  }
}

/** platform_settings is admin-writable under row level security; the change is logged by a trigger. */
export async function updatePlatformSettings(s: PlatformSettings): Promise<ActionResult> {
  const blank = (v: string) => (v.trim() === "" ? null : v.trim())
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from("platform_settings")
    .update({
      company_name: blank(s.companyName),
      company_tax_id: blank(s.companyTaxId),
      company_address: blank(s.companyAddress),
      support_zalo: blank(s.supportZalo),
      support_email: blank(s.supportEmail),
      topup_bank_bin: blank(s.topupBankBin),
      topup_account_no: blank(s.topupAccountNo),
      topup_account_name: blank(s.topupAccountName),
      referral_enabled: s.referralEnabled,
      referral_customer_amount: s.referralCustomerAmount,
      referral_pro_amount: s.referralProAmount,
      referral_min_total: s.referralMinTotal,
      referral_monthly_cap: s.referralMonthlyCap,
      voucher_days: s.voucherDays,
    } as never)
    .eq("id", true)
    .select("id")
  if (error) return { ok: false, error: messageFor(error) }
  if (!data?.length) return { ok: false, error: "Không lưu được: tài khoản này không có quyền quản trị." }
  revalidatePath("/admin")
  revalidatePath("/", "layout")
  return { ok: true, data: undefined }
}
