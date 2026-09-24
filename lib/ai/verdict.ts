import type { AiSchema } from "./llm"
import type { ProfileDecision, ProfileVerdict } from "./rules"

/**
 * What the reviewer asks the AI, and how its answer is read. Pure: the prompt
 * is built from plain facts and the answer is validated field by field, so a
 * model that drifts from the schema is a failed call (the profile stays
 * pending), never a decision nobody meant. Tested in tests/ai-review.test.ts.
 */

export interface ServiceFact {
  name: string
  option: string
  price: number
  min: number
  max: number
  suggested: number
}

export interface PhotoFact {
  /** 1-based, the order the images are attached in. */
  index: number
  workTitle: string
  serviceName: string
  /** "before", "after", "poster" (a clip's cover), or "photo". */
  role: "before" | "after" | "poster" | "photo"
}

export interface ProfilePromptInput {
  displayName: string
  title: string
  bio: string
  highlights: string[]
  categories: string[]
  city: string
  district: string
  identityStatus: string
  services: ServiceFact[]
  hoursSummary: string
  photos: PhotoFact[]
  /** What an earlier review asked for, if this is a second try. */
  previousNote: string | null
}

export interface WorkPromptInput {
  proName: string
  categories: string[]
  title: string
  description: string
  serviceName: string
  photos: PhotoFact[]
}

export type WorkDecision = "kept" | "hidden"

export interface WorkVerdict {
  decision: WorkDecision
  reasons: string[]
  summary: string
}

const PHOTO_RULES = `Ảnh tác phẩm đạt khi: là ảnh thật về việc người này đã làm và khớp với chuyên môn đã khai; rõ, không trống/đen/mờ đến mức không thấy gì.
Ảnh KHÔNG đạt khi: ảnh chụp màn hình (thấy thanh trạng thái, giao diện app, bài đăng mạng xã hội); ảnh mẫu/stock/catalog lấy trên mạng;
có logo hoặc watermark của thương hiệu, salon, studio khác; khiêu dâm, hở hang, bạo lực hay không an toàn; chứa số điện thoại, mã QR, đường link để liên hệ ngoài 360dep.`

const lines = (items: string[]) => (items.length ? items.map((s) => `- ${s}`).join("\n") : "- (không có)")

function photoList(photos: PhotoFact[]) {
  return lines(
    photos.map((p) => {
      const role = p.role === "before" ? " (ảnh TRƯỚC)" : p.role === "after" ? " (ảnh SAU)" : p.role === "poster" ? " (ảnh bìa của clip)" : ""
      return `Ảnh ${p.index}: bài "${p.workTitle}", dịch vụ ${p.serviceName}${role}`
    }),
  )
}

export function buildProfilePrompt(input: ProfilePromptInput): string {
  const services = input.services.map(
    (s) => `${s.name} · ${s.option}: ${s.price}đ (khung ${s.min}–${s.max}đ, giá gợi ý ${s.suggested}đ)`,
  )
  return `Bạn là bộ phận duyệt hồ sơ đối tác của 360dep, nền tảng đặt lịch làm đẹp, chụp ảnh/quay clip và người mẫu tại Việt Nam.
Một đối tác (freelancer) vừa gửi hồ sơ để hiện với khách. Hãy quyết định:
- "approved": hồ sơ dùng được, khách xem không có gì sai.
- "changes_requested": có điều cần sửa (ảnh chưa đạt, phần giới thiệu có thông tin liên hệ, giá bất thường…). Đây là lựa chọn mặc định khi chưa ổn.
- "rejected": chỉ khi rõ ràng lừa đảo, khiêu dâm, hoặc toàn bộ ảnh là ảnh lấy của người khác.

${PHOTO_RULES}
Phần giới thiệu, tiêu đề, tên đạt khi: không có số điện thoại, email, link, tên Zalo/Facebook; không tục tĩu, không hứa hẹn kiểu lừa đảo ("đặt cọc trước", "phí hồ sơ"), không nhận làm dịch vụ nhạy cảm.
Giá: đã nằm trong khung của 360dep; chỉ nêu khi giá rõ ràng vô lý so với dịch vụ.
Không đòi thêm những thứ không có trong danh sách trên (không bắt buộc bio dài, không chấm điểm thẩm mỹ).

Hồ sơ:
- Tên hiển thị: ${input.displayName || "(trống)"}
- Tiêu đề: ${input.title || "(trống)"}
- Giới thiệu: ${input.bio ? input.bio.slice(0, 1500) : "(trống)"}
- Điểm nổi bật: ${input.highlights.length ? input.highlights.join("; ") : "(không có)"}
- Chuyên môn: ${input.categories.join(", ") || "(không có)"}
- Khu vực: ${input.district}, ${input.city}
- Xác minh danh tính: ${input.identityStatus === "verified" ? "đã xác minh" : "chưa xác minh"}
- Giờ làm việc: ${input.hoursSummary || "(chưa lưu)"}
Dịch vụ và giá:
${lines(services)}
Ảnh đính kèm theo thứ tự:
${photoList(input.photos)}
${input.previousNote ? `\nLần trước hồ sơ được yêu cầu sửa:\n${input.previousNote}\nKiểm tra xem đã sửa chưa.\n` : ""}
Trả JSON đúng schema:
- decision: "approved" | "changes_requested" | "rejected".
- reasons: nếu không duyệt, mỗi lý do một câu tiếng Việt, cụ thể và làm theo được, nói với đối tác bằng "bạn" (ví dụ "Ảnh 2 là ảnh chụp màn hình Instagram, hãy đăng ảnh gốc bạn chụp"). Rỗng nếu duyệt.
- summary: một câu tiếng Việt cho nhân viên 360dep tóm tắt vì sao.`
}

export function buildWorkPrompt(input: WorkPromptInput): string {
  return `Bạn là bộ phận kiểm duyệt bài đăng của 360dep, nền tảng đặt lịch làm đẹp, chụp ảnh/quay clip và người mẫu tại Việt Nam.
Đối tác "${input.proName}" (chuyên môn: ${input.categories.join(", ") || "không rõ"}) vừa đăng một bài:
- Tiêu đề: ${input.title}
- Mô tả: ${input.description ? input.description.slice(0, 800) : "(trống)"}
- Dịch vụ: ${input.serviceName}
Ảnh đính kèm theo thứ tự:
${photoList(input.photos)}

${PHOTO_RULES}
Tiêu đề và mô tả cũng không được có số điện thoại, link, Zalo/Facebook hay từ ngữ tục tĩu.
Chỉ ẩn khi thật sự vi phạm; ảnh đẹp hay chưa đẹp không phải lý do để ẩn.

Trả JSON đúng schema:
- decision: "kept" (giữ bài) | "hidden" (ẩn bài).
- reasons: nếu ẩn, mỗi lý do một câu tiếng Việt cụ thể, nói với đối tác bằng "bạn". Rỗng nếu giữ.
- summary: một câu tiếng Việt cho nhân viên 360dep.`
}

export const PROFILE_SCHEMA: AiSchema = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["approved", "changes_requested", "rejected"] },
    reasons: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
  required: ["decision", "reasons", "summary"],
  additionalProperties: false,
}

export const WORK_SCHEMA: AiSchema = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["kept", "hidden"] },
    reasons: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
  required: ["decision", "reasons", "summary"],
  additionalProperties: false,
}

export class VerdictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "VerdictError"
  }
}

const MAX_REASONS = 6
const MAX_REASON_CHARS = 300
const MAX_SUMMARY_CHARS = 500

function readCommon(raw: unknown): { decision: unknown; reasons: string[]; summary: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new VerdictError("not an object")
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.reasons) || !r.reasons.every((x) => typeof x === "string")) throw new VerdictError("reasons")
  if (typeof r.summary !== "string") throw new VerdictError("summary")
  const reasons = (r.reasons as string[])
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, MAX_REASONS)
    .map((s) => (s.length > MAX_REASON_CHARS ? `${s.slice(0, MAX_REASON_CHARS - 1)}…` : s))
  const summary = r.summary.trim().slice(0, MAX_SUMMARY_CHARS)
  return { decision: r.decision, reasons, summary }
}

/** The AI's answer on a profile, or VerdictError. A refusal needs at least one reason the partner can act on. */
export function parseProfileVerdict(raw: unknown): ProfileVerdict {
  const { decision, reasons, summary } = readCommon(raw)
  const decisions: ProfileDecision[] = ["approved", "changes_requested", "rejected"]
  if (!decisions.includes(decision as ProfileDecision)) throw new VerdictError(`decision ${String(decision)}`)
  if (decision !== "approved" && reasons.length === 0) throw new VerdictError("a refusal without a reason")
  return { decision: decision as ProfileDecision, reasons: decision === "approved" ? [] : reasons, summary }
}

/** The AI's answer on one post, or VerdictError. */
export function parseWorkVerdict(raw: unknown): WorkVerdict {
  const { decision, reasons, summary } = readCommon(raw)
  if (decision !== "kept" && decision !== "hidden") throw new VerdictError(`decision ${String(decision)}`)
  if (decision === "hidden" && reasons.length === 0) throw new VerdictError("hidden without a reason")
  return { decision, reasons: decision === "kept" ? [] : reasons, summary }
}

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`

/** "T2 09:00–18:00; T3 09:00–18:00" for the prompt and the log. */
export function hoursSummary(windows: { weekday: number; start_min: number; end_min: number }[]): string {
  return [...windows]
    .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || a.start_min - b.start_min)
    .map((w) => `${DAYS[w.weekday] ?? "?"} ${hhmm(w.start_min)}–${hhmm(w.end_min)}`)
    .join("; ")
}
