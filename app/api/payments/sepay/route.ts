import { NextResponse } from "next/server"
import { checkApiKey, memoCandidates, parseSepay } from "@/lib/payments/sepay"
import { supabaseAdmin } from "@/lib/supabase/server"

/**
 * SePay's webhook: every transaction on 360dep's bank account. A transfer in
 * whose memo carries a freelancer's pay code ("DEPAB23CD", see payMemo in
 * lib/connection.ts) is credited to their wallet by record_bank_topup, which
 * only the service role may call. Turning it on: README, "Vận hành".
 *
 * SePay retries anything that is not a 2xx, so a transaction that is simply
 * not ours (money out, no code, already credited) is answered 200. Only a
 * failure worth retrying (the database did not answer) is a 500.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const auth = checkApiKey(request.headers.get("authorization"), process.env.SEPAY_WEBHOOK_KEY)
  if (auth === "off") return NextResponse.json({ success: false, error: "Webhook chưa bật." }, { status: 503 })
  if (auth === "denied") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const tx = parseSepay(body)
  if (tx.kind === "invalid") return NextResponse.json({ success: false, error: tx.reason }, { status: 400 })
  if (tx.kind === "ignore") return NextResponse.json({ success: true, credited: false, reason: tx.reason })

  let admin: ReturnType<typeof supabaseAdmin>
  try {
    admin = supabaseAdmin()
  } catch (err) {
    // No service key on this deployment: nothing can be credited, and a retry later may work.
    console.error("sepay webhook: no database access:", err instanceof Error ? err.message : err)
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 500 })
  }

  const { data, error } = await admin.rpc("record_marketplace_transfer" as never, {
    p_ref: tx.ref, p_content: tx.content, p_amount: tx.amount, p_code: tx.code,
    p_memos: memoCandidates(tx.content, tx.code),
    p_account: tx.account, p_sub: tx.subAccount,
    p_va: process.env.SEPAY_RECEIVING_VA?.trim() || null,
  } as never)
  if (error || !["credited", "duplicate", "unmatched", "other_account"].includes(String(data))) {
    console.error("sepay webhook: transaction not recorded", tx.ref, error?.code)
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
  }
  return NextResponse.json({ success: true, credited: data === "credited" })
}
