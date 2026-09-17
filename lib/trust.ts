import type { Pro, RatingSummary, Review, VerificationId } from "./types"

/**
 * Verification is optional. Each verified item earns a public badge and pushes the
 * freelancer up in search; verifying everything earns the "Tin cậy" badge.
 */
export const VERIFICATIONS: { id: VerificationId; label: string; badge: string; description: string }[] = [
  {
    id: "identity",
    label: "Danh tính (CCCD)",
    badge: "Đã xác minh danh tính",
    description: "Chụp CCCD gắn chip và ảnh chân dung. Khách chỉ thấy dấu tick, không thấy số CCCD.",
  },
  {
    id: "skill",
    label: "Tay nghề",
    badge: "Tay nghề đã kiểm chứng",
    description: "Gửi chứng chỉ nghề hoặc video làm mẫu để đội ngũ dep360 duyệt.",
  },
  {
    id: "hygiene",
    label: "Cam kết vệ sinh",
    badge: "Cam kết vệ sinh",
    description: "Đọc và cam kết quy chuẩn tiệt trùng dụng cụ, dùng một lần vật tư tiếp xúc da.",
  },
]

export function isVerified(pro: Pro, id: VerificationId) {
  return pro.verifications[id] === "verified"
}

export function verifiedCount(pro: Pro) {
  return VERIFICATIONS.filter((x) => isVerified(pro, x.id)).length
}

/** Fully verified freelancers get the "Tin cậy" badge. */
export function isTrusted(pro: Pro) {
  return verifiedCount(pro) === VERIFICATIONS.length
}

/** Merge a freelancer's historical rating with reviews written in this session. */
export function mergeRating(base: RatingSummary, extra: Review[]): RatingSummary {
  if (!extra.length) return base
  const count = base.count + extra.length
  return { count, average: (base.average * base.count + extra.reduce((s, r) => s + r.rating, 0)) / count }
}

/**
 * Bayesian average: pulls ratings with few reviews toward the platform mean so a
 * 5.0 from 3 reviews does not outrank 4.9 from 300 reviews.
 */
export function bayesianRating(r: RatingSummary, platformMean = 4.6, weight = 20) {
  return (platformMean * weight + r.average * r.count) / (weight + r.count)
}

/**
 * "Phù hợp nhất" ordering, higher is better. Verification is the biggest lever a
 * freelancer controls, so each verified item adds a clear boost on top of rating.
 */
export function rankScore(pro: Pro, rating: RatingSummary = pro.rating) {
  const quality = bayesianRating(rating) - 4 // ~0..1 for ratings 4..5
  const verification = verifiedCount(pro) / VERIFICATIONS.length
  const experience = Math.min(1, Math.log10(pro.stats.completedJobs + 1) / Math.log10(300))
  return 0.4 * quality + 0.45 * verification + 0.15 * experience
}

export const REVIEW_TAGS = ["Đúng giờ", "Tay nghề tốt", "Dụng cụ sạch sẽ", "Tư vấn kỹ", "Nhẹ nhàng", "Giá hợp lý", "Bền đẹp"]
