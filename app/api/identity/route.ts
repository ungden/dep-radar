import { NextResponse } from "next/server"

/**
 * Identity verification with a vision AI (Gemini).
 * Input: multipart form with `front`, `back`, `selfie` (JPEG) and `profileName`.
 * The AI reads the CCCD, checks the selfie and compares the two faces. Images are
 * only forwarded to Gemini and are not stored or logged here.
 */

export const runtime = "nodejs"

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash"

const PROMPT = `Bạn là bộ phận xác minh danh tính của dep360, nền tảng đặt lịch làm đẹp tại Việt Nam.
Người dùng là freelancer đã đồng ý xác minh danh tính. Bạn nhận 3 ảnh theo thứ tự:
1) mặt trước Căn cước công dân (CCCD) Việt Nam, 2) mặt sau CCCD, 3) ảnh selfie của người đăng ký.

Hãy kiểm tra và trả về JSON đúng schema:
- front_is_cccd: ảnh 1 có phải mặt trước một thẻ CCCD/CMND Việt Nam thật (không phải ảnh chụp màn hình, bản vẽ hay giấy tờ khác) và có ảnh chân dung không.
- back_is_cccd: ảnh 2 có phải mặt sau CCCD không.
- name_on_card: họ và tên in trên thẻ (viết hoa như trên thẻ), chuỗi rỗng nếu không đọc được. KHÔNG trả về số CCCD, ngày sinh hay địa chỉ.
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
    selfie_ok: { type: "BOOLEAN" },
    same_person: { type: "STRING", enum: ["yes", "no", "uncertain"] },
    confidence: { type: "NUMBER" },
    issues: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["front_is_cccd", "back_is_cccd", "name_on_card", "selfie_ok", "same_person", "confidence", "issues"],
}

interface AiVerdict {
  front_is_cccd: boolean
  back_is_cccd: boolean
  name_on_card: string
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

async function toPart(file: FormDataEntryValue | null) {
  if (!(file instanceof File)) return null
  if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) return null
  const data = Buffer.from(await file.arrayBuffer()).toString("base64")
  return { inlineData: { mimeType: file.type, data } }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Dịch vụ xác minh chưa được cấu hình (thiếu GEMINI_API_KEY)." }, { status: 503 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 })
  }
  const [front, back, selfie] = await Promise.all([toPart(form.get("front")), toPart(form.get("back")), toPart(form.get("selfie"))])
  if (!front || !back || !selfie) {
    return NextResponse.json({ error: "Cần đủ 3 ảnh JPEG/PNG, mỗi ảnh tối đa 2MB." }, { status: 400 })
  }
  const profileName = String(form.get("profileName") ?? "").slice(0, 80)

  let verdict: AiVerdict
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: PROMPT }, front, back, selfie] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: SCHEMA },
      }),
    })
    if (!res.ok) throw new Error(`Gemini ${res.status}`)
    const json = await res.json()
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error("Empty response")
    verdict = JSON.parse(text) as AiVerdict
  } catch (err) {
    console.error("identity check failed:", err instanceof Error ? err.message : "unknown error")
    return NextResponse.json({ error: "AI xác minh đang bận, vui lòng thử lại sau ít phút." }, { status: 502 })
  }

  const hint = verdict.issues?.length ? ` ${verdict.issues.join(". ")}.` : ""
  if (!verdict.front_is_cccd) return NextResponse.json({ status: "rejected", reason: `Ảnh mặt trước chưa đúng là CCCD.${hint}` })
  if (!verdict.back_is_cccd) return NextResponse.json({ status: "rejected", reason: `Ảnh mặt sau chưa đúng là CCCD.${hint}` })
  if (!verdict.selfie_ok) return NextResponse.json({ status: "rejected", reason: `Ảnh selfie chưa đạt: cần một khuôn mặt rõ, chụp trực tiếp.${hint}` })
  if (verdict.same_person === "no") {
    return NextResponse.json({ status: "rejected", reason: "Khuôn mặt trên CCCD và ảnh selfie không khớp." })
  }
  if (verdict.same_person === "yes" && verdict.confidence >= 0.8) {
    if (profileName && verdict.name_on_card && !nameMatches(profileName, verdict.name_on_card)) {
      return NextResponse.json({
        status: "review",
        nameOnCard: verdict.name_on_card,
        reason: `Khuôn mặt khớp, nhưng tên trên thẻ (${verdict.name_on_card}) khác tên hồ sơ. Đội ngũ dep360 sẽ kiểm tra thêm.`,
      })
    }
    return NextResponse.json({ status: "verified", nameOnCard: verdict.name_on_card })
  }
  return NextResponse.json({
    status: "review",
    nameOnCard: verdict.name_on_card,
    reason: `AI chưa đủ chắc chắn đây là cùng một người.${hint} Đội ngũ dep360 sẽ kiểm tra thêm, hoặc bạn chụp lại selfie rõ hơn.`,
  })
}
