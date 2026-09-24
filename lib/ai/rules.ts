/**
 * The rules a profile has to pass whatever the AI says, and how the two
 * answers combine. Pure: tested in tests/ai-review.test.ts.
 *
 * The rules come first and win: an AI that likes the photos does not make up
 * for a missing service, and a model's profile needs a verified identity. With
 * no AI configured, a profile that passes every rule is approved on the rules
 * alone, and the log says so.
 */

export type ProfileDecision = "approved" | "changes_requested" | "rejected"

export interface ProfileVerdict {
  decision: ProfileDecision
  reasons: string[]
  summary: string
}

export interface ProfileFacts {
  displayName: string
  title: string
  bio: string
  categories: string[]
  identityStatus: string
  activeServices: number
  hasHours: boolean
  visibleWorks: number
  /** Photos that are not the partner's own upload to our storage. */
  foreignPhotos: number
  /** Photos of their own that no longer open (deleted, broken). */
  missingPhotos: number
  /** public.banned_content() on the name, title and bio. */
  bannedWords: boolean
}

export const RULE_REASONS = {
  modelIdentity: "Xác minh danh tính trước khi nhận làm mẫu (Hồ sơ → Xác minh danh tính).",
  noService: "Bật ít nhất một dịch vụ và đặt giá (Dịch vụ & bảng giá).",
  noHours: "Lưu giờ làm việc trong tuần (Hồ sơ → Giờ làm việc).",
  noWork: "Đăng ít nhất một ảnh việc bạn đã làm (Tác phẩm).",
  noName: "Điền tên hiển thị để khách biết gọi bạn là gì.",
  contact:
    "Bỏ số điện thoại, email, đường link, Zalo/Facebook khỏi tên, tiêu đề và phần giới thiệu: khách liên hệ và đặt lịch qua 360dep.",
  banned: "Bỏ những từ ngữ không được phép trên 360dep khỏi tên, tiêu đề và phần giới thiệu.",
  foreignPhotos: "Ảnh tác phẩm phải là ảnh bạn tải lên từ máy của mình, không dùng đường link ảnh ở nơi khác.",
  missingPhotos: "Có ảnh tác phẩm không mở được: xoá bài đó và đăng lại ảnh.",
} as const

const PHONE = /(?:\+?84|\b0)(?:[\s.-]?\d){8,10}\b/
const URL = /\bhttps?:\/\/|\bwww\.|\b[\w-]+\.(?:com|vn|net|me|io|link|site|shop|store)\b/i
const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.]+\b/
const CHANNELS = /\b(?:zalo|facebook|fb|messenger|instagram|insta|telegram|viber|whatsapp)\b/i

/** A way to reach someone off the platform: a phone number, a link, an address, a messaging app. */
export function hasContactInfo(text: string): boolean {
  // Our own address is not a way around us.
  const t = text.normalize("NFC").replace(/\b(?:https?:\/\/)?(?:www\.)?360dep\.vn\S*/gi, "")
  return PHONE.test(t) || URL.test(t) || EMAIL.test(t) || CHANNELS.test(t)
}

/** What must change before the profile can be approved, in the partner's words. Empty when nothing. */
export function profileRuleProblems(f: ProfileFacts): string[] {
  const problems: string[] = []
  if (f.categories.some((c) => c.startsWith("model-")) && f.identityStatus !== "verified") {
    problems.push(RULE_REASONS.modelIdentity)
  }
  if (f.activeServices === 0) problems.push(RULE_REASONS.noService)
  if (!f.hasHours) problems.push(RULE_REASONS.noHours)
  if (f.visibleWorks === 0) problems.push(RULE_REASONS.noWork)
  if (f.displayName.trim().length < 2) problems.push(RULE_REASONS.noName)
  if (hasContactInfo(`${f.displayName}\n${f.title}\n${f.bio}`)) problems.push(RULE_REASONS.contact)
  if (f.bannedWords) problems.push(RULE_REASONS.banned)
  if (f.foreignPhotos > 0) problems.push(RULE_REASONS.foreignPhotos)
  if (f.missingPhotos > 0) problems.push(RULE_REASONS.missingPhotos)
  return problems
}

const dedupe = (items: string[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * The decision that is applied. `ai` is null when no AI was asked (no key);
 * a failed AI call never reaches here: the profile just stays pending.
 */
export function combineProfileDecision(rules: string[], ai: ProfileVerdict | null): ProfileVerdict {
  if (!ai) {
    return rules.length
      ? {
          decision: "changes_requested",
          reasons: rules,
          summary: `Chưa có AI, duyệt theo quy tắc: còn ${rules.length} điều cần sửa.`,
        }
      : { decision: "approved", reasons: [], summary: "Chưa có AI, duyệt theo quy tắc: đủ dịch vụ, giờ làm, tác phẩm." }
  }
  if (ai.decision === "rejected") {
    return { decision: "rejected", reasons: dedupe([...ai.reasons, ...rules]), summary: ai.summary }
  }
  if (rules.length) {
    return {
      decision: "changes_requested",
      // The rules first: they are the ones the partner can fix for certain.
      reasons: dedupe([...rules, ...(ai.decision === "changes_requested" ? ai.reasons : [])]),
      summary: ai.summary,
    }
  }
  if (ai.decision === "approved") return { decision: "approved", reasons: [], summary: ai.summary }
  return { decision: "changes_requested", reasons: dedupe(ai.reasons), summary: ai.summary }
}
