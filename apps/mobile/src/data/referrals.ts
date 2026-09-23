import { rpc, supabase, type Row } from "./supabase"

/**
 * Giới thiệu bạn bè and the vouchers it pays out, as in
 * supabase/migrations/20260925100300_referrals.sql. Everything is read with
 * the user's own session: row level security shows their own vouchers and
 * rewards, and platform_settings is public.
 */

export interface Voucher {
  id: string
  amount: number
  minTotal: number
  expiresAt: string
  /** The booking it is on while that booking is going ahead. */
  bookingId: string | null
  usedAt: string | null
  note: string
  createdAt: string
}

export interface ReferralSettings {
  enabled: boolean
  customerAmount: number
  proAmount: number
  minTotal: number
  monthlyCap: number
  voucherDays: number
}

export interface ReferralReward {
  /** "I invited someone" or "someone invited me". */
  asReferrer: boolean
  kind: "customer" | "pro"
  amount: number
  createdAt: string
}

export interface ReferralInfo {
  code: string | null
  settings: ReferralSettings | null
  rewards: ReferralReward[]
  vouchers: Voucher[]
  /** Whether this account may still enter a friend's code. */
  canClaim: boolean
  /** Already entered one. */
  claimed: boolean
}

const toVoucher = (r: Row): Voucher => ({
  id: r.id,
  amount: Number(r.amount ?? 0),
  minTotal: Number(r.min_total ?? 0),
  expiresAt: r.expires_at,
  bookingId: r.booking_id ?? null,
  usedAt: r.used_at ?? null,
  note: r.note ?? "",
  createdAt: r.created_at,
})

export async function listVouchers(uid: string): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from("vouchers")
    .select("id, amount, min_total, expires_at, booking_id, used_at, note, created_at")
    .eq("account_id", uid)
    .order("expires_at")
  if (error) return []
  return ((data ?? []) as Row[]).map(toVoucher)
}

/** Not used, not on another booking, not expired. */
export const isUsable = (v: Voucher, now = Date.now()) => !v.usedAt && !v.bookingId && Date.parse(v.expiresAt) > now

export async function loadReferralSettings(): Promise<ReferralSettings | null> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("referral_enabled, referral_customer_amount, referral_pro_amount, referral_min_total, referral_monthly_cap, voucher_days")
    .limit(1)
    .maybeSingle()
  const r = data as Row | null
  if (error || !r) return null
  return {
    enabled: Boolean(r.referral_enabled),
    customerAmount: Number(r.referral_customer_amount ?? 0),
    proAmount: Number(r.referral_pro_amount ?? 0),
    minTotal: Number(r.referral_min_total ?? 0),
    monthlyCap: Number(r.referral_monthly_cap ?? 0),
    voucherDays: Number(r.voucher_days ?? 0),
  }
}

const CLAIM_DAYS = 30

export async function loadReferral(uid: string): Promise<ReferralInfo> {
  const [code, settings, rewards, vouchers, account, completed] = await Promise.all([
    rpc<string>("my_referral_code", {}),
    loadReferralSettings(),
    supabase
      .from("referral_rewards")
      .select("referee, referrer, kind, referrer_amount, referee_amount, created_at")
      .or(`referrer.eq.${uid},referee.eq.${uid}`)
      .order("created_at", { ascending: false }),
    listVouchers(uid),
    supabase.from("accounts").select("created_at, referred_by").eq("id", uid).maybeSingle(),
    supabase.from("bookings").select("id", { count: "exact", head: true }).or(`customer_id.eq.${uid},pro_id.eq.${uid}`).eq("status", "completed"),
  ])
  if (!code.ok && !settings) throw new Error("Không tải được chương trình giới thiệu. Kiểm tra kết nối rồi thử lại.")
  const a = account.data as Row | null
  const young = a?.created_at ? Date.now() - Date.parse(a.created_at) < CLAIM_DAYS * 86_400_000 : false
  const claimed = Boolean(a?.referred_by)
  return {
    code: code.ok ? code.data : null,
    settings,
    rewards: ((rewards.data ?? []) as Row[]).map((r) => {
      const asReferrer = r.referrer === uid
      return {
        asReferrer,
        kind: r.kind === "pro" ? "pro" : "customer",
        amount: Number(asReferrer ? r.referrer_amount : r.referee_amount),
        createdAt: r.created_at,
      }
    }),
    vouchers,
    // The same conditions claim_referral() checks, so the form is offered only when it can work.
    canClaim: Boolean(a) && young && !claimed && (completed.count ?? 0) === 0,
    claimed,
  }
}

/** Returns the friend's name. */
export const claimReferral = (code: string) => rpc<string>("claim_referral", { p_code: code.trim().toUpperCase() })

export const referralLink = (code: string) => `https://www.360dep.vn/?ref=${encodeURIComponent(code)}`
