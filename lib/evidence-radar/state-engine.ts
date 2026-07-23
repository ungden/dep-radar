import type { CreatorProductEvent, CreatorProductStateValue } from "@/lib/types"
import { isDirectCreatorEvidenceSource } from "@/lib/evidence-source"

const DAY_MS = 86_400_000
const DIRECT_USAGE_TYPES = new Set(["used", "repurchased", "switched_to"])
const HISTORICAL_USAGE_TYPES = new Set(["used", "emptied", "repurchased", "switched_to", "stopped_using"])
const REVIEW_TYPES = new Set(["reviewed", "recommended"])
const PROMOTION_TYPES = new Set(["sponsored", "live_sold"])

export interface DerivedCreatorProductState {
  state: CreatorProductStateValue
  stateConfidence: number
  lastConfirmedAt: string | null
  expiresAt: string | null
  evidenceCount: number
  lastEventId: string | null
}

function ageInDays(date: string, now: Date) {
  return Math.floor((now.getTime() - new Date(`${date}T00:00:00Z`).getTime()) / DAY_MS)
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00Z`)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

function eventConfidence(event: CreatorProductEvent) {
  if (typeof event.confidence_score === "number") return event.confidence_score
  if (event.confidence === "high") return 92
  if (event.confidence === "medium") return 75
  return 50
}

export function deriveCreatorProductState(
  events: CreatorProductEvent[],
  now = new Date()
): DerivedCreatorProductState {
  const verified = events
    .filter((event) => (event.verification_status ?? "verified") === "verified")
    .sort((a, b) => b.event_date.localeCompare(a.event_date) || b.observed_at.localeCompare(a.observed_at))

  const latest = verified[0]
  if (!latest) {
    return {
      state: "unknown",
      stateConfidence: 0,
      lastConfirmedAt: null,
      expiresAt: null,
      evidenceCount: 0,
      lastEventId: null,
    }
  }

  const latestAge = ageInDays(latest.event_date, now)
  const directIn90Days = verified.filter(
    (event) => DIRECT_USAGE_TYPES.has(event.event_type) && ageInDays(event.event_date, now) <= 90
  )
  let state: CreatorProductStateValue = "unknown"
  let expiresAt: string | null = null

  if (latest.event_type === "disliked") {
    state = "disliked"
  } else if (latest.event_type === "stopped_using") {
    state = "past"
  } else if (latest.event_type === "repurchased" && latestAge <= 90) {
    state = "current"
    expiresAt = addDays(latest.event_date, 90)
  } else if ((latest.event_type === "used" || latest.event_type === "switched_to") && latestAge <= 60) {
    state = "current"
    expiresAt = addDays(latest.event_date, 60)
  } else if (
    directIn90Days.length >= 2 &&
    directIn90Days.some((event) => ageInDays(event.event_date, now) <= 60)
  ) {
    state = "current"
    const newestDirect = directIn90Days[0]
    expiresAt = addDays(newestDirect.event_date, newestDirect.event_type === "repurchased" ? 90 : 60)
  } else if (verified.some((event) => HISTORICAL_USAGE_TYPES.has(event.event_type))) {
    state = verified.some(
      (event) =>
        event.event_type !== "stopped_using" &&
        HISTORICAL_USAGE_TYPES.has(event.event_type) &&
        ageInDays(event.event_date, now) <= 180
    )
      ? "recently_used"
      : "past"
  } else if (verified.some((event) => REVIEW_TYPES.has(event.event_type))) {
    state = "reviewed_only"
  } else if (verified.some((event) => PROMOTION_TYPES.has(event.event_type))) {
    state = "promoted_only"
  }

  return {
    state,
    stateConfidence: eventConfidence(latest),
    lastConfirmedAt: latest.event_date,
    expiresAt,
    evidenceCount: verified.length,
    lastEventId: latest.id,
  }
}

export function isPublicEvidenceEvent(event: CreatorProductEvent) {
  return (
    (event.verification_status ?? "verified") === "verified" &&
    eventConfidence(event) >= 90 &&
    event.exact_sku_verified === true &&
    Boolean(event.verified_by && event.verified_at) &&
    isDirectCreatorEvidenceSource(event.source_platform, event.source_url, event.source_post_id) &&
    (event.evidence_spans?.length ?? 0) > 0 &&
    !(event.risk_flags ?? []).some((flag) => ["ambiguous_variant", "multi_product_bundle", "product_not_in_catalogue"].includes(flag))
  )
}
