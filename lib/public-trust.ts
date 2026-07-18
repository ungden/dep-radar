import type { CreatorProductEvent, ProductOffer, UserRatingSummary } from "@/lib/types"

const SEARCH_URL_PATTERN = /(?:\/search|search\?|keyword=|[?&](?:q|query)=)/i
const INTERNAL_SOURCE_PATTERN = /^https:\/\/(?:www\.)?360dep\.vn(?:\/|$)/i
const OFFER_FRESHNESS_MS = 30 * 24 * 60 * 60 * 1000

function isFreshDate(value: string | null | undefined, maxAgeMs: number, now = Date.now()) {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= maxAgeMs
}

export function isPublicOffer(offer: ProductOffer, now = Date.now()) {
  const url = offer.affiliate_url
  if (!url?.startsWith("https://") || SEARCH_URL_PATTERN.test(url)) return false
  if (offer.verification_status !== "verified" || offer.match_status !== "exact") return false
  if (offer.is_active !== true || !offer.verified_by || !offer.verified_at) return false
  if (!isFreshDate(offer.last_checked_at, OFFER_FRESHNESS_MS, now)) return false
  if (offer.valid_until && Date.parse(offer.valid_until) <= now) return false
  return true
}

export function isPublicCreatorEvent(event: CreatorProductEvent, now = Date.now()) {
  const platform = event.source_platform.toLowerCase()
  const sourceUrl = event.source_url
  if (!sourceUrl?.startsWith("https://") || INTERNAL_SOURCE_PATTERN.test(sourceUrl)) return false
  if (platform.includes("seed") || platform.includes("internal")) return false
  if (event.verification_status !== "verified" || !event.evidence_id) return false
  if (!event.verified_by || !event.verified_at) return false
  if (event.valid_until && Date.parse(event.valid_until) <= now) return false
  return true
}

export function summarizeApprovedRatings(ratings: Array<{ rating: number }>): UserRatingSummary {
  if (ratings.length === 0) return { average: null, count: 0 }
  const total = ratings.reduce((sum, item) => sum + item.rating, 0)
  return { average: Math.round((total / ratings.length) * 10) / 10, count: ratings.length }
}
