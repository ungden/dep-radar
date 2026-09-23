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

  // One transaction, one reference: whichever memo credits first, the others
  // can no longer (the ref is unique among top-ups).
  for (const memo of memoCandidates(tx.content, tx.code)) {
    const { data, error } = await admin.rpc("record_bank_topup", { p_content: memo, p_amount: tx.amount, p_ref: tx.ref })
    if (error) {
      // Logged without the memo or the amount: the reference is enough to find it.
      console.error("sepay webhook: record_bank_topup failed for", tx.ref, error.message)
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
    }
    if (data === true) return NextResponse.json({ success: true, credited: true })
  }
  // No pay code in the memo, or this transaction was already credited. Staff
  // record the first kind by hand from /admin.
  return NextResponse.json({ success: true, credited: false })
}
