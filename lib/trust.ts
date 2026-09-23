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

/**
 * Review tags. The database accepts only these (review_tags_ok in
 * supabase/migrations/20260925100200_review_rules.sql); keep the two in step.
 * Three stars or fewer needs at least one REVIEW_ISSUE_TAGS entry.
 */
export const REVIEW_TAGS = [
  "Đúng giờ",
  "Tay nghề tốt",
  "Dụng cụ sạch sẽ",
  "Tư vấn kỹ",
  "Nhẹ nhàng",
  "Giá hợp lý",
  "Bền đẹp",
  "Ảnh đẹp",
  "Giao ảnh đúng hẹn",
  "Chuyên nghiệp",
]
export const REVIEW_ISSUE_TAGS = [
  "Trễ giờ",
  "Tay nghề chưa tốt",
  "Dụng cụ chưa sạch",
  "Thái độ chưa tốt",
  "Giá khác báo giá",
  "Giao ảnh trễ",
  "Không giống mô tả",
]
/** The tags to offer for a star rating: what went well, or what did not. */
export const reviewTagsFor = (rating: number) => (rating <= 3 ? REVIEW_ISSUE_TAGS : REVIEW_TAGS)
