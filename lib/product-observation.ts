import type {
  CreatorEvidenceMetrics,
  CreatorProductDisclosure,
  CreatorProductEvent,
  Kol,
  ProductObservationSummary,
} from "@/lib/types"

const COMMERCIAL_DISCLOSURES = new Set<CreatorProductDisclosure>(["pr", "sponsored", "affiliate"])
const DIRECT_USE_TYPES = new Set(["used", "emptied", "repurchased", "switched_to", "stopped_using"])
const REVIEW_TYPES = new Set(["reviewed", "recommended", "disliked"])

export function buildProductObservationSummary(events: CreatorProductEvent[]): ProductObservationSummary {
  const verified = events.filter((event) => (event.verification_status ?? "verified") === "verified")
  const independentCreatorCount = new Set(verified.map((event) => event.creator_id)).size
  const commercialCount = verified.filter((event) => COMMERCIAL_DISCLOSURES.has(event.disclosure)).length
  const commercialShare = verified.length > 0 ? commercialCount / verified.length : 0

  const observationStatus = independentCreatorCount >= 3
    ? "broad_coverage"
    : independentCreatorCount >= 2
      ? "multiple_creators"
      : independentCreatorCount === 1
        ? "one_creator"
        : "no_records"

  return {
    independentCreatorCount,
    verifiedClipCount: verified.length,
    directUseCount: verified.filter((event) => DIRECT_USE_TYPES.has(event.event_type)).length,
    reviewOrRecommendationCount: verified.filter((event) => REVIEW_TYPES.has(event.event_type)).length,
    commercialClipCount: commercialCount,
    commercialShare: Math.round(commercialShare * 100),
    observationStatus,
    hasMostlyCommercialSources: verified.length > 0 && commercialShare >= 0.75,
    latestEvidenceAt: verified.map((event) => event.event_date).sort((a, b) => b.localeCompare(a))[0] ?? null,
  }
}

export function buildCreatorEvidenceMetrics(kol: Kol, events: CreatorProductEvent[]): CreatorEvidenceMetrics {
  const verified = events.filter((event) => (event.verification_status ?? "verified") === "verified")
  const knownDisclosureCount = verified.filter((event) => event.disclosure !== "unknown").length
  const commercialCount = verified.filter((event) => COMMERCIAL_DISCLOSURES.has(event.disclosure)).length

  return {
    identityVerified: kol.verified,
    verifiedEventCount: verified.length,
    exactProductCount: new Set(verified.map((event) => event.product_id)).size,
    knownDisclosureCount,
    unknownDisclosureCount: verified.length - knownDisclosureCount,
    commercialEventCount: commercialCount,
    commercialShare: verified.length > 0 ? Math.round(commercialCount / verified.length * 100) : 0,
  }
}

export function productObservationStatusLabel(status: ProductObservationSummary["observationStatus"]) {
  return {
    no_records: "Chưa có creator được ghi nhận",
    one_creator: "1 creator được ghi nhận",
    multiple_creators: "Nhiều creator được ghi nhận",
    broad_coverage: "Từ 3 creator được ghi nhận",
  }[status]
}
