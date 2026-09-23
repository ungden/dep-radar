import { timingSafeEqual } from "node:crypto"

/**
 * SePay (sepay.vn) watches 360dep's bank account and POSTs every transaction
 * to app/api/payments/sepay. These two pieces are pure so they can be tested
 * without a server: whether the request carries our key, and what in its body
 * matters. The crediting itself is the database's (record_bank_topup in
 * supabase/migrations/20260926100000_match_then_chat.sql).
 */

/**
 * "off": no key configured, so the webhook is switched off. "ok" / "denied":
 * the `Authorization: Apikey <key>` header does or does not match. The compare
 * takes the same time however much of the key is right.
 */
export function checkApiKey(header: string | null | undefined, expected: string | null | undefined): "off" | "ok" | "denied" {
  const key = expected?.trim()
  if (!key) return "off"
  const match = /^Apikey\s+(.+)$/i.exec(header?.trim() ?? "")
  if (!match) return "denied"
  const given = Buffer.from(match[1].trim())
  const wanted = Buffer.from(key)
  // timingSafeEqual needs equal lengths; comparing against itself keeps the time the same.
  if (given.length !== wanted.length) {
    timingSafeEqual(wanted, wanted)
    return "denied"
  }
  return timingSafeEqual(given, wanted) ? "ok" : "denied"
}

/**
 * The memos worth trying, best first. A freelancer's memo is "DEP" + their six
 * character pay code, written together ("DEPAB23CD"), which is also the
 * payment-code pattern registered in SePay (Cấu hình công ty → Cấu trúc mã
 * thanh toán: prefix DEP, 6 letters/digits), so SePay hands it over as `code`.
 * That comes first; then every DEP code found in the memo, cleaned up (banks
 * add their own words, and "DEPOSIT" must not pass for a code); then the text
 * as it came. The webhook stops at the first one credited.
 */
export function memoCandidates(content: string, code?: string | null): string[] {
  const found = [code ?? "", content]
    .flatMap((text) => [...text.matchAll(/DEP[^A-Za-z0-9]*([A-HJ-NP-Z2-9]{6})(?![A-Za-z0-9])/gi)])
    .map((m) => `DEP${m[1].toUpperCase()}`)
  return [...new Set([...found, content])].filter(Boolean).slice(0, 4)
}

export type SepayTransaction =
  /** Money in: credit it, if the memo names a freelancer. */
  | { kind: "in"; ref: string; content: string; code: string; amount: number }
  /** Nothing to do (money out, zero amount), but not an error: answer 200 so SePay does not retry. */
  | { kind: "ignore"; reason: string }
  /** Not a SePay transaction at all. */
  | { kind: "invalid"; reason: string }

const text = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "")

/**
 * The fields that matter from SePay's body: {id, gateway, transactionDate,
 * accountNumber, code, content, transferType: "in" | "out", transferAmount,
 * accumulated, subAccount, referenceCode, description}. The reference is
 * SePay's own transaction id, so the same transfer reported twice is credited
 * once.
 */
export function parseSepay(body: unknown): SepayTransaction {
  if (!body || typeof body !== "object") return { kind: "invalid", reason: "body is not an object" }
  const b = body as Record<string, unknown>
  const id = text(b.id).trim()
  if (!id) return { kind: "invalid", reason: "no transaction id" }
  if (b.transferType !== "in") return { kind: "ignore", reason: `transferType ${text(b.transferType) || "missing"}` }
  const amount = typeof b.transferAmount === "number" ? b.transferAmount : Number(text(b.transferAmount))
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    return { kind: "ignore", reason: "no positive whole amount" }
  }
  // The memo the freelancer typed ("DEPAB23CD"). Banks sometimes put it only
  // in the full description, so fall back to that. `code` is the payment code
  // SePay itself recognised in it, if any.
  const content = [text(b.content), text(b.description)].map((s) => s.trim()).find(Boolean) ?? ""
  return { kind: "in", ref: `sepay:${id}`, content, code: text(b.code).trim(), amount }
}
