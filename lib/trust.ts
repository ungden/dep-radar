import type { Pro, RatingSummary, Review } from "./types"

/** Identity is verified with a CCCD (both sides) and a selfie. Optional, but rewarded. */
export function isVerified(pro: Pro) {
  return pro.identity === "verified"
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
 * "Phù hợp nhất" ordering, higher is better. A verified identity is a large boost
 * so verified freelancers appear before unverified ones with similar ratings.
 */
export function rankScore(pro: Pro, rating: RatingSummary = pro.rating) {
  const quality = bayesianRating(rating) - 4 // ~0..1 for ratings 4..5
  const experience = Math.min(1, Math.log10(pro.stats.completedJobs + 1) / Math.log10(300))
  return 0.5 * quality + 0.35 * (isVerified(pro) ? 1 : 0) + 0.15 * experience
}

export const REVIEW_TAGS = ["Đúng giờ", "Tay nghề tốt", "Dụng cụ sạch sẽ", "Tư vấn kỹ", "Nhẹ nhàng", "Giá hợp lý", "Bền đẹp"]
