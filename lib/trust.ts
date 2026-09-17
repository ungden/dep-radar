import type { Pro, RatingSummary, Review, TierId, VerificationId } from "./types"

export const VERIFICATIONS: { id: VerificationId; label: string; short: string; description: string }[] = [
  { id: "phone", label: "Số điện thoại", short: "SĐT", description: "Xác minh bằng OTP khi đăng ký." },
  {
    id: "identity",
    label: "Danh tính (CCCD)",
    short: "Danh tính",
    description: "Đối chiếu CCCD gắn chip với khuôn mặt. Khách chỉ thấy tên, không thấy số CCCD.",
  },
  {
    id: "skill",
    label: "Tay nghề",
    short: "Tay nghề",
    description: "Chứng chỉ nghề hoặc bài kiểm tra thực hành với đội ngũ dep360. Bắt buộc cho dịch vụ cô dâu, lấy nhân mụn, massage bầu.",
  },
  {
    id: "hygiene",
    label: "Cam kết vệ sinh",
    short: "Vệ sinh",
    description: "Hoàn thành khoá an toàn vệ sinh: tiệt trùng dụng cụ, dùng một lần cho vật tư tiếp xúc da.",
  },
]

export interface TierDef {
  id: TierId
  label: string
  description: string
  minJobs: number
  minRating: number
  maxCancellation: number
  minResponse: number
  requires: VerificationId[]
}

/** Ordered from lowest to highest. */
export const TIERS: TierDef[] = [
  {
    id: "new",
    label: "Mới",
    description: "Freelancer mới tham gia, đã xác minh số điện thoại.",
    minJobs: 0,
    minRating: 0,
    maxCancellation: 1,
    minResponse: 0,
    requires: ["phone"],
  },
  {
    id: "standard",
    label: "Tiêu chuẩn",
    description: "Đã có kinh nghiệm trên dep360 và được khách đánh giá tốt.",
    minJobs: 10,
    minRating: 4.5,
    maxCancellation: 0.08,
    minResponse: 0.8,
    requires: ["phone", "identity"],
  },
  {
    id: "pro",
    label: "Pro",
    description: "Tay nghề đã kiểm chứng, lịch làm ổn định, ít huỷ lịch.",
    minJobs: 50,
    minRating: 4.7,
    maxCancellation: 0.05,
    minResponse: 0.9,
    requires: ["phone", "identity", "skill"],
  },
  {
    id: "top",
    label: "Top",
    description: "Nhóm dẫn đầu: đánh giá xuất sắc, gần như không huỷ lịch, đủ mọi xác minh.",
    minJobs: 200,
    minRating: 4.85,
    maxCancellation: 0.02,
    minResponse: 0.95,
    requires: ["phone", "identity", "skill", "hygiene"],
  },
]

export const tierDef = (id: TierId) => TIERS.find((t) => t.id === id)!

export function isVerified(pro: Pro, id: VerificationId) {
  return pro.verifications[id] === "verified"
}

export function verifiedCount(pro: Pro) {
  return VERIFICATIONS.filter((x) => isVerified(pro, x.id)).length
}

function meets(pro: Pro, t: TierDef, rating: RatingSummary) {
  return (
    pro.stats.completedJobs >= t.minJobs &&
    rating.average >= t.minRating &&
    pro.stats.cancellationRate <= t.maxCancellation &&
    pro.stats.responseRate >= t.minResponse &&
    t.requires.every((r) => isVerified(pro, r))
  )
}

export function tierOf(pro: Pro, rating: RatingSummary = pro.rating): TierId {
  let tier: TierId = "new"
  for (const t of TIERS) if (meets(pro, t, rating)) tier = t.id
  return tier
}

export interface TierRequirement {
  label: string
  current: string
  target: string
  done: boolean
}

/** What is still missing to reach the next tier. */
export function nextTierProgress(pro: Pro, rating: RatingSummary = pro.rating) {
  const current = tierOf(pro, rating)
  const idx = TIERS.findIndex((t) => t.id === current)
  const next = TIERS[idx + 1]
  if (!next) return null
  const pct = (n: number) => `${Math.round(n * 100)}%`
  const pct1 = (n: number) => `${(n * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`
  const reqs: TierRequirement[] = [
    { label: "Job hoàn thành", current: String(pro.stats.completedJobs), target: `≥ ${next.minJobs}`, done: pro.stats.completedJobs >= next.minJobs },
    { label: "Điểm đánh giá", current: rating.average.toFixed(2), target: `≥ ${next.minRating}`, done: rating.average >= next.minRating },
    { label: "Tỉ lệ huỷ lịch", current: pct1(pro.stats.cancellationRate), target: `≤ ${pct(next.maxCancellation)}`, done: pro.stats.cancellationRate <= next.maxCancellation },
    { label: "Tỉ lệ phản hồi", current: pct(pro.stats.responseRate), target: `≥ ${pct(next.minResponse)}`, done: pro.stats.responseRate >= next.minResponse },
    ...next.requires.map((r) => ({
      label: `Xác minh ${VERIFICATIONS.find((x) => x.id === r)!.short.toLowerCase()}`,
      current: pro.verifications[r] === "verified" ? "Đã xác minh" : pro.verifications[r] === "pending" ? "Đang duyệt" : "Chưa có",
      target: "Đã xác minh",
      done: isVerified(pro, r),
    })),
  ]
  return { next, reqs }
}

/** Merge a freelancer's historical rating with reviews written in this session. */
export function mergeRating(base: RatingSummary, extra: Review[]): RatingSummary {
  if (!extra.length) return base
  const n = base.count + extra.length
  const avg = (key: "rating" | "skill" | "punctuality" | "hygiene" | "attitude", baseValue: number) =>
    (baseValue * base.count + extra.reduce((s, r) => s + r[key], 0)) / n
  return {
    count: n,
    average: avg("rating", base.average),
    skill: avg("skill", base.skill),
    punctuality: avg("punctuality", base.punctuality),
    hygiene: avg("hygiene", base.hygiene),
    attitude: avg("attitude", base.attitude),
  }
}

/**
 * Bayesian average: pulls ratings with few reviews toward the platform mean so a
 * 5.0 from 3 reviews does not outrank 4.9 from 300 reviews.
 */
export function bayesianRating(r: RatingSummary, platformMean = 4.6, weight = 20) {
  return (platformMean * weight + r.average * r.count) / (weight + r.count)
}

/** Estimated star distribution (5★..1★) from an average and count. */
export function ratingDistribution(r: RatingSummary): number[] {
  if (!r.count) return [0, 0, 0, 0, 0]
  const five = Math.min(0.97, Math.max(0.3, (r.average - 4) * 0.95))
  const four = Math.max(0.02, (1 - five) * 0.7)
  const three = Math.max(0.01, (1 - five - four) * 0.6)
  const two = Math.max(0, (1 - five - four - three) * 0.5)
  const one = Math.max(0, 1 - five - four - three - two)
  const counts = [five, four, three, two].map((p) => Math.round(p * r.count))
  // Put the rounding remainder in the 5★ bucket so the bars always add up to the count.
  counts[0] += r.count - counts.reduce((a, b) => a + b, 0) - Math.round(one * r.count)
  return [...counts, Math.round(one * r.count)]
}

const TIER_BOOST: Record<TierId, number> = { new: 0, standard: 0.03, pro: 0.06, top: 0.1 }

/**
 * Ranking score (higher is better) used for "Phù hợp nhất" ordering. Quality first (Bayesian
 * rating), then reliability, responsiveness, loyalty, experience and verification.
 * New freelancers get a small exposure boost so they can earn their first reviews.
 */
export function rankScore(pro: Pro, rating: RatingSummary = pro.rating) {
  const quality = (bayesianRating(rating) - 3.5) / 1.5
  const reliability = 1 - Math.min(1, pro.stats.cancellationRate * 10)
  const response = pro.stats.responseRate
  const onTime = pro.stats.onTimeRate
  const loyalty = Math.min(1, pro.stats.repeatRate / 0.5)
  const experience = Math.min(1, Math.log10(pro.stats.completedJobs + 1) / Math.log10(500))
  const verification = verifiedCount(pro) / VERIFICATIONS.length
  const tier = tierOf(pro, rating)
  const newcomerBoost = tier === "new" ? 0.05 : 0
  return (
    0.35 * quality +
    0.15 * reliability +
    0.1 * response +
    0.1 * onTime +
    0.1 * loyalty +
    0.1 * experience +
    0.1 * verification +
    TIER_BOOST[tier] +
    newcomerBoost
  )
}

export const REVIEW_TAGS = ["Đúng giờ", "Tay nghề tốt", "Dụng cụ sạch sẽ", "Tư vấn kỹ", "Nhẹ nhàng", "Giá hợp lý", "Bền đẹp"]
