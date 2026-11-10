import { payMemo } from "@/shared"
import { rpc, supabase, type Row } from "./supabase"

/**
 * What a freelancer owes and how to pay it (20260926100000_match_then_chat.sql).
 * Completing a job charges the 360dep fee to the wallet at once; while the
 * balance is below zero, confirm_booking and take_job refuse. A bank transfer
 * whose memo is payMemo(pay_code) is credited by staff or by the bank's
 * webhook, and the block lifts by itself.
 */
export interface FeeInfo {
  /** my_wallet_balance(): negative means a fee is owed. */
  balance: number
  /** pros.pay_code; null on a server without it yet. */
  payCode: string | null
  /** Where to transfer (platform_settings); null until the owner fills it in. */
  bank: { bin: string; accountNo: string; accountName: string } | null
}

/** Below zero is below the floor (fee_policy.wallet_floor is 0). */
export const owes = (fee: FeeInfo | null | undefined) => Boolean(fee && fee.balance < 0)

export async function loadFee(uid: string): Promise<FeeInfo> {
  const [balance, pro, settings] = await Promise.all([
    rpc<number>("my_wallet_balance", {}),
    supabase.from("pros").select("pay_code").eq("id", uid).maybeSingle(),
    supabase.from("platform_settings").select("topup_bank_bin, topup_account_no, topup_account_name").maybeSingle(),
  ])
  if (!balance.ok) throw new Error("Không tải được ví. Kiểm tra kết nối rồi thử lại.")
  const s = settings.data as Row | null
  return {
    balance: Number(balance.data ?? 0),
    payCode: ((pro.data as Row | null)?.pay_code as string | undefined) || null,
    bank: s?.topup_bank_bin && s.topup_account_no ? { bin: s.topup_bank_bin, accountNo: s.topup_account_no, accountName: s.topup_account_name ?? "" } : null,
  }
}

/** The transfer's memo, matched by the bank webhook. */
export const feeMemo = (fee: FeeInfo) => (fee.payCode ? payMemo(fee.payCode) : null)

/** A VietQR code with the amount and the memo filled in, for the banking app to scan. */
export function feeQrUrl(fee: FeeInfo): string | null {
  const memo = feeMemo(fee)
  if (!fee.bank || !memo || fee.balance >= 0) return null
  // %20, not "+", for the space in the memo.
  const q = `amount=${-fee.balance}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(fee.bank.accountName)}`
  return `https://img.vietqr.io/image/${fee.bank.bin}-${fee.bank.accountNo}-compact2.png?${q}`
}

/** One line of the wallet: a fee, a top-up, a voucher refund, a no-show compensation. */
export interface WalletEntry {
  id: string
  kind: string
  amount: number
  note: string
  createdAt: string
  bookingId: string | null
}

/** The partner's own lines, newest first ("pro reads own wallet" policy). */
export async function loadWalletEntries(uid: string): Promise<WalletEntry[]> {
  const { data, error } = await supabase
    .from("wallet_entries")
    .select("id, kind, amount, note, created_at, booking_id")
    .eq("pro_id", uid)
    .order("created_at", { ascending: false })
    .limit(60)
  if (error) throw new Error("Không tải được lịch sử ví. Kiểm tra kết nối rồi thử lại.")
  return ((data ?? []) as Row[]).map((e) => ({
    id: e.id,
    kind: String(e.kind ?? ""),
    amount: Number(e.amount ?? 0),
    note: String(e.note ?? ""),
    createdAt: e.created_at,
    bookingId: e.booking_id ?? null,
  }))
}

/** What a wallet line was for, in the partner's words, when its note is empty. */
export function walletLabel(e: WalletEntry) {
  // The common kinds in plain words; the server's notes for these read like ledger codes.
  if (e.kind === "commission") return "Phí 360đẹp · đơn đã xong"
  if (e.kind === "topup") return "Bạn chuyển vào ví"
  if (e.kind === "voucher") return "360đẹp bù voucher của khách"
  if (e.kind === "no_show_comp") return "Bù phí di chuyển · khách vắng mặt"
  if (e.note.trim()) return e.note.trim()
  if (e.amount > 0) return "Cộng vào ví"
  return "Trừ ví"
}

/** Where 360đẹp sends money owed to the partner (pro_payout, 20261008100000). */
export interface PayoutAccount {
  bankName: string
  accountNumber: string
  accountHolder: string
}

export async function loadPayoutAccount(uid: string): Promise<PayoutAccount | null> {
  const { data } = await supabase.from("pro_payout").select("bank_name, account_number, account_holder").eq("pro_id", uid).maybeSingle()
  const row = data as Row | null
  return row ? { bankName: row.bank_name, accountNumber: row.account_number, accountHolder: row.account_holder } : null
}

export async function savePayoutAccount(uid: string, account: PayoutAccount): Promise<{ ok: true } | { ok: false; error: string }> {
  const bankName = account.bankName.trim()
  const accountNumber = account.accountNumber.replace(/\s+/g, "")
  const accountHolder = account.accountHolder.trim()
  if (bankName.length < 2) return { ok: false, error: "Nhập tên ngân hàng." }
  if (!/^[0-9]{6,20}$/.test(accountNumber)) return { ok: false, error: "Số tài khoản chỉ gồm 6–20 chữ số." }
  if (accountHolder.length < 2) return { ok: false, error: "Nhập tên chủ tài khoản." }
  const { error } = await supabase
    .from("pro_payout")
    .upsert({ pro_id: uid, bank_name: bankName, account_number: accountNumber, account_holder: accountHolder.toUpperCase(), updated_at: new Date().toISOString() })
  return error ? { ok: false, error: "Chưa lưu được tài khoản. Thử lại nhé." } : { ok: true }
}
