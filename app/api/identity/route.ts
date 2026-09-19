import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { backendEnabled } from "@/lib/supabase/env"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server"

/**
 * Identity verification with a vision AI (Gemini).
 * Input: multipart form with `front`, `back`, `selfie` (JPEG).
 * The AI reads the CCCD, checks the selfie and compares the two faces.
 *
 * The verdict is the server's, not the browser's: with a backend configured this
 * route requires a signed-in freelancer, records the attempt, writes the resulting
 * status itself, and locks the display name to the name on the card. Editing
 * localStorage cannot produce a badge.
 *
 * Images are forwarded to the AI and never stored or logged.
 */

export const runtime = "nodejs"
export const maxDuration = 30

/**
 * Per-account limits live in the database. This IP limiter is the fallback for
 * the demo build, where there is no account to attribute an attempt to.
 */
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function rateLimited(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > MAX_PER_WINDOW
}

/** Only our own pages may call this; it is not a public face-matching API. */
function wrongOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return false // same-origin form posts may omit it
  try {
    return new URL(origin).host !== new URL(request.url).host
  } catch {
    return true
  }
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash"
const MAX_CHECKS_PER_DAY = 3

const PROMPT = `Bạn là bộ phận xác minh danh tính của 360dep, nền tảng đặt lịch làm đẹp tại Việt Nam.
Người dùng là freelancer đã đồng ý xác minh danh tính. Bạn nhận 3 ảnh theo thứ tự:
1) mặt trước Căn cước công dân (CCCD) Việt Nam, 2) mặt sau CCCD, 3) ảnh selfie của người đăng ký.

Hãy kiểm tra và trả về JSON đúng schema:
- front_is_cccd: ảnh 1 có phải mặt trước một thẻ CCCD/CMND Việt Nam thật (không phải ảnh chụp màn hình, bản vẽ hay giấy tờ khác) và có ảnh chân dung không.
- back_is_cccd: ảnh 2 có phải mặt sau CCCD không.
- name_on_card: họ và tên in trên thẻ (viết hoa như trên thẻ), chuỗi rỗng nếu không đọc được.
- card_number: số CCCD in trên thẻ, chỉ chữ số, chuỗi rỗng nếu không đọc được. Số này chỉ dùng để băm một chiều nhằm chặn một thẻ xác minh nhiều tài khoản; không lưu bản gốc.
- selfie_ok: ảnh 3 có đúng một khuôn mặt người thật, nhìn rõ, không che khuất, không phải ảnh chụp lại từ màn hình hay giấy.
- same_person: "yes" nếu ảnh chân dung trên thẻ và selfie là cùng một người, "no" nếu rõ ràng khác người, "uncertain" nếu không đủ chắc chắn.
- confidence: độ chắc chắn 0..1 cho kết luận same_person.
- issues: danh sách vấn đề ngắn gọn bằng tiếng Việt để hướng dẫn người dùng chụp lại (ví dụ "Ảnh mặt trước bị loá"), rỗng nếu không có.
Chỉ trả JSON, không thêm giải thích.`

const SCHEMA = {
  type: "OBJECT",
  properties: {
    front_is_cccd: { type: "BOOLEAN" },
    back_is_cccd: { type: "BOOLEAN" },
    name_on_card: { type: "STRING" },
    card_number: { type: "STRING" },
    selfie_ok: { type: "BOOLEAN" },
    same_person: { type: "STRING", enum: ["yes", "no", "uncertain"] },
    confidence: { type: "NUMBER" },
    issues: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "front_is_cccd",
    "back_is_cccd",
    "name_on_card",
    "card_number",
    "selfie_ok",
    "same_person",
    "confidence",
    "issues",
  ],
}

interface AiVerdict {
  front_is_cccd: boolean
  back_is_cccd: boolean
  name_on_card: string
  card_number: string
  selfie_ok: boolean
  same_person: "yes" | "no" | "uncertain"
  confidence: number
  issues: string[]
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .split(/\s+/)
    .filter(Boolean)

/** Display names are often short ("Linh Phạm"); every word must appear in the full card name. */
function nameMatches(profileName: string, cardName: string) {
  const card = new Set(normalize(cardName))
  const profile = normalize(profileName)
  return profile.length > 0 && profile.every((w) => card.has(w))
}

/** One-way, salted: enough to notice the same card twice, useless if leaked. */
function cardHash(cardNumber: string, salt: string) {
  const digits = cardNumber.replace(/\D/g, "")
  if (digits.length < 9) return null
  return createHash("sha256").update(`${salt}:${digits}`).digest("hex")
}

async function toPart(file: FormDataEntryValue | null) {
  if (!(file instanceof File)) return null
  if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) return null
  const data = Buffer.from(await file.arrayBuffer()).toString("base64")
  return { inlineData: { mimeType: file.type, data } }
}

/** The signed-in freelancer, plus how many checks they have already used today. */
async function callerPro() {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { error: "Cần đăng nhập để xác minh danh tính.", status: 401 as const }
  const { data: pro } = await supabase
    .from("pros")
    .select("id, identity_status")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (!pro) return { error: "Chỉ hồ sơ chuyên viên mới xác minh được.", status: 403 as const }
  if (pro.identity_status === "verified") {
    return { error: "Hồ sơ của bạn đã được xác minh.", status: 409 as const }
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from("identity_checks")
    .select("id", { count: "exact", head: true })
    .eq("pro_id", pro.id)
    .gte("created_at", since)
  if ((count ?? 0) >= MAX_CHECKS_PER_DAY) {
    return { error: `Bạn đã thử xác minh ${MAX_CHECKS_PER_DAY} lần trong 24 giờ. Vui lòng thử lại sau.`, status: 429 as const }
  }
  const { data: account } = await supabase.from("accounts").select("full_name").eq("id", auth.user.id).maybeSingle()
  return { proId: pro.id, profileName: account?.full_name ?? "" }
}

/** Record the outcome and let the database own the resulting badge. */
async function record(input: {
  proId: string
  status: "verified" | "rejected" | "pending"
  verdict: AiVerdict
  nameMatched: boolean | null
  reason?: string
  consentAt: string
  salt: string
}) {
  const admin = supabaseAdmin()
  const hash = cardHash(input.verdict.card_number, input.salt)

  if (input.status === "verified" && hash) {
    const { data: clash } = await admin
      .from("identity_checks")
      .select("pro_id")
      .eq("card_hash", hash)
      .eq("status", "verified")
      .neq("pro_id", input.proId)
      .maybeSingle()
    if (clash) {
      // The same card already verified another account: a human should look.
      input = { ...input, status: "pending", reason: "Thẻ CCCD này đã dùng để xác minh một tài khoản khác." }
    }
  }

  const { error: checkError } = await admin.from("identity_checks").insert({
    pro_id: input.proId,
    status: input.status,
    model: MODEL,
    name_on_card: input.verdict.name_on_card || null,
    name_matches: input.nameMatched,
    same_person: input.verdict.same_person,
    confidence: input.verdict.confidence,
    reject_reason: input.reason ?? null,
    card_hash: hash,
    consent_at: input.consentAt,
    decided_at: input.status === "pending" ? null : new Date().toISOString(),
  })
  if (checkError) throw new Error("Không ghi được lượt xác minh.")

  const { error: proError } = await admin
    .from("pros")
    .update({
      identity_status: input.status,
      // A verified freelancer is shown under the name on their card.
      ...(input.status === "verified" && input.verdict.name_on_card
        ? { identity_name: input.verdict.name_on_card }
        : {}),
    })
    .eq("id", input.proId)
  if (proError) throw new Error("Không cập nhật được trạng thái xác minh.")

  return input.status
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Dịch vụ xác minh chưa được cấu hình (thiếu GEMINI_API_KEY)." }, { status: 503 })
  }
  const salt = process.env.IDENTITY_HASH_SALT?.trim()
  if (!salt) return NextResponse.json({ error: "Dịch vụ xác minh chưa được cấu hình an toàn." }, { status: 503 })

  if (wrongOrigin(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 })

  // With a backend, the account is what gets rate limited, not the IP address.
  let proId: string | null = null
  let profileName = ""
  if (backendEnabled) {
    const caller = await callerPro()
    if ("error" in caller) return NextResponse.json({ error: caller.error }, { status: caller.status })
    proId = caller.proId
    profileName = caller.profileName
  } else if (rateLimited(request)) {
    return NextResponse.json({ error: "Bạn đã thử xác minh quá nhiều lần. Vui lòng thử lại sau 1 giờ." }, { status: 429 })
  }

  let form: Awaited<ReturnType<Request["formData"]>>
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 })
  }
  const [front, back, selfie] = await Promise.all([
    toPart(form.get("front")),
    toPart(form.get("back")),
    toPart(form.get("selfie")),
  ])
  if (!front || !back || !selfie) {
    return NextResponse.json({ error: "Cần đủ 3 ảnh JPEG/PNG, mỗi ảnh tối đa 2MB." }, { status: 400 })
  }
  const consentAt = new Date().toISOString()

  let verdict: AiVerdict
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      signal: AbortSignal.timeout(25_000),
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: PROMPT }, front, back, selfie] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: SCHEMA },
      }),
    })
    if (res.status === 404) throw new Error(`model_not_found:${MODEL}`)
    if (!res.ok) throw new Error(`Gemini ${res.status}`)
    const json = await res.json()
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error("Empty response")
    verdict = JSON.parse(text) as AiVerdict
    if (
      typeof verdict.front_is_cccd !== "boolean" || typeof verdict.back_is_cccd !== "boolean" ||
      typeof verdict.selfie_ok !== "boolean" || !["yes", "no", "uncertain"].includes(verdict.same_person) ||
      typeof verdict.confidence !== "number" || verdict.confidence < 0 || verdict.confidence > 1 ||
      typeof verdict.name_on_card !== "string" || typeof verdict.card_number !== "string" || !Array.isArray(verdict.issues)
    ) throw new Error("invalid_response")
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    console.error("identity check failed:", message)
    if (message.startsWith("model_not_found:")) {
      // A config mistake must not look like an outage.
      return NextResponse.json({ error: `Cấu hình sai: model "${MODEL}" không tồn tại. Kiểm tra biến GEMINI_MODEL.` }, { status: 500 })
    }
    return NextResponse.json({ error: "AI xác minh đang bận, vui lòng thử lại sau ít phút." }, { status: 502 })
  }

  const hint = verdict.issues?.length ? ` ${verdict.issues.join(". ")}.` : ""

  const reject = async (reason: string) => {
    if (proId) await record({ proId, status: "rejected", verdict, nameMatched: null, reason, consentAt, salt })
    return NextResponse.json({ status: "rejected", reason })
  }

  if (!verdict.front_is_cccd) return reject(`Ảnh mặt trước chưa đúng là CCCD.${hint}`)
  if (!verdict.back_is_cccd) return reject(`Ảnh mặt sau chưa đúng là CCCD.${hint}`)
  if (!verdict.selfie_ok) return reject(`Ảnh selfie chưa đạt: cần một khuôn mặt rõ, chụp trực tiếp.${hint}`)
  if (verdict.same_person === "no") return reject("Khuôn mặt trên CCCD và ảnh selfie không khớp.")

  if (verdict.same_person === "yes" && verdict.confidence >= 0.8) {
    const matched = profileName && verdict.name_on_card ? nameMatches(profileName, verdict.name_on_card) : null
    if (matched === false) {
      const reason = `Khuôn mặt khớp, nhưng tên trên thẻ (${verdict.name_on_card}) khác tên hồ sơ. Đội ngũ 360dep sẽ kiểm tra thêm.`
      if (proId) await record({ proId, status: "pending", verdict, nameMatched: false, reason, consentAt, salt })
      return NextResponse.json({ status: "review", nameOnCard: verdict.name_on_card, reason })
    }
    const status = proId
      ? await record({ proId, status: "verified", verdict, nameMatched: matched, consentAt, salt })
      : "verified"
    return status === "verified"
      ? NextResponse.json({ status: "verified", nameOnCard: verdict.name_on_card })
      : NextResponse.json({
          status: "review",
          nameOnCard: verdict.name_on_card,
          reason: "Thẻ CCCD này đã dùng để xác minh một tài khoản khác. Đội ngũ 360dep sẽ kiểm tra thêm.",
        })
  }

  const reason = `AI chưa đủ chắc chắn đây là cùng một người.${hint} Đội ngũ 360dep sẽ kiểm tra thêm, hoặc bạn chụp lại selfie rõ hơn.`
  if (proId) await record({ proId, status: "pending", verdict, nameMatched: null, reason, consentAt, salt })
  return NextResponse.json({ status: "review", nameOnCard: verdict.name_on_card, reason })
}
