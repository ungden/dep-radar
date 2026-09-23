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
