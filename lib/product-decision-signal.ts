import type {
  CreatorEvidenceMetrics,
  CreatorProductDisclosure,
  CreatorProductEvent,
  CreatorProductEventType,
  Kol,
  ProductDecisionSignal,
} from "@/lib/types"

const DAY_MS = 86_400_000

const EVENT_WEIGHTS: Record<CreatorProductEventType, number> = {
  first_seen: 0.2,
  mentioned: 0.2,
  unboxed: 0.3,
  used: 0.9,
  reviewed: 0.75,
  recommended: 0.7,
  disliked: 0,
  emptied: 0.95,
  repurchased: 1,
  switched_to: 0.9,
  stopped_using: 0,
  live_sold: 0.1,
  sponsored: 0.1,
}

const DISCLOSURE_WEIGHTS: Record<CreatorProductDisclosure, number> = {
  organic: 1,
  unknown: 0.7,
  pr: 0.65,
  sponsored: 0.55,
  affiliate: 0.5,
}

const COMMERCIAL_DISCLOSURES = new Set<CreatorProductDisclosure>(["pr", "sponsored", "affiliate"])
const CAUTION_EVENT_TYPES = new Set<CreatorProductEventType>(["disliked", "stopped_using"])

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function eventConfidence(event: CreatorProductEvent) {
  if (typeof event.confidence_score === "number") return clamp(event.confidence_score)
  if (event.confidence === "high") return 92
  if (event.confidence === "medium") return 75
  return 50
}

function freshnessWeight(eventDate: string, now: Date) {
  const timestamp = new Date(`${eventDate}T00:00:00Z`).getTime()
  if (!Number.isFinite(timestamp)) return 0.25
  const age = Math.max(0, Math.floor((now.getTime() - timestamp) / DAY_MS))
  if (age <= 90) return 1
  if (age <= 180) return 0.75
  if (age <= 365) return 0.5
  return 0.25
}

export function eventDecisionWeight(event: CreatorProductEvent, now = new Date()) {
  return (
    eventConfidence(event) / 100
    * EVENT_WEIGHTS[event.event_type]
    * DISCLOSURE_WEIGHTS[event.disclosure]
    * freshnessWeight(event.event_date, now)
  )
}

function isCaution(event: CreatorProductEvent) {
  return (
    event.sentiment === "mixed"
    || event.sentiment === "negative"
    || CAUTION_EVENT_TYPES.has(event.event_type)
    || event.disclosure !== "organic"
  )
}

export function buildProductDecisionSignal(
  events: CreatorProductEvent[],
  now = new Date()
): ProductDecisionSignal {
  const verified = events.filter((event) => (event.verification_status ?? "verified") === "verified")
  const strongestByCreator = new Map<string, number>()

  for (const event of verified) {
    strongestByCreator.set(
      event.creator_id,
      Math.max(strongestByCreator.get(event.creator_id) ?? 0, eventDecisionWeight(event, now))
    )
  }

  const independentCreatorCount = strongestByCreator.size
  const averageStrength = independentCreatorCount > 0
    ? Array.from(strongestByCreator.values()).reduce((sum, value) => sum + value, 0) / independentCreatorCount
    : 0
  const commercialCount = verified.filter((event) => COMMERCIAL_DISCLOSURES.has(event.disclosure)).length
  const commercialShare = verified.length > 0 ? commercialCount / verified.length : 0
  const hasOrganic = verified.some((event) => event.disclosure === "organic")
  const hasAmbiguousVariant = verified.some((event) => event.risk_flags?.includes("ambiguous_variant"))

  const evidenceStatus = independentCreatorCount >= 3 && hasOrganic && !hasAmbiguousVariant
    ? "broadly_validated"
    : independentCreatorCount >= 2
      ? "cross_checked"
      : independentCreatorCount === 1
        ? "one_source"
        : "no_evidence"

  return {
    supportScore: Math.round(clamp(averageStrength * 100)),
    independentCreatorCount,
    supportCount: verified.filter((event) => event.sentiment === "positive" && EVENT_WEIGHTS[event.event_type] > 0.1).length,
    cautionCount: verified.filter(isCaution).length,
    commercialShare: Math.round(commercialShare * 100),
    evidenceStatus,
    commercialBuzz: verified.length > 0 && commercialShare >= 0.75,
    latestEvidenceAt: verified.map((event) => event.event_date).sort((a, b) => b.localeCompare(a))[0] ?? null,
  }
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
}

function creatorExpertiseScore(kol: Kol) {
  const text = normalize([
    kol.name,
    kol.realName,
    kol.bio,
    ...(kol.categories ?? []),
    ...(kol.specialties ?? []),
  ].filter(Boolean).join(" "))

  if (["bac si", "da lieu", "chuyen khoa", "noi tru", "doctor", "dr "].some((term) => text.includes(term))) return 95
  if (["makeup artist", "chuyen gia trang diem", "mua"].some((term) => text.includes(term))) return 85
  if (["skincare", "my pham", "beauty editor", "beauty blogger"].some((term) => text.includes(term))) return 75
  return kol.specialties?.length ? 65 : kol.categories?.length ? 55 : 35
}

function evidenceCompleteness(event: CreatorProductEvent) {
  let score = 0
  if (event.source_url?.startsWith("https://")) score += 20
  if ((event.evidence_spans?.length ?? 0) > 0) score += 20
  if (event.exact_sku_verified) score += 20
  if (eventConfidence(event) >= 90) score += 20
  if (event.usage_context?.trim()) score += 10
  if (event.disclosure !== "unknown") score += 10
  return score
}

export function buildCreatorEvidenceMetrics(kol: Kol, events: CreatorProductEvent[]): CreatorEvidenceMetrics {
  const verified = events.filter((event) => (event.verification_status ?? "verified") === "verified")
  const knownDisclosureCount = verified.filter((event) => event.disclosure !== "unknown").length
  const commercialCount = verified.filter((event) => COMMERCIAL_DISCLOSURES.has(event.disclosure)).length
  const knownDisclosureRate = verified.length > 0 ? knownDisclosureCount / verified.length : 0

  return {
    identityVerified: kol.verified,
    expertiseScore: creatorExpertiseScore(kol),
    evidenceCompleteness: verified.length > 0
      ? Math.round(verified.reduce((sum, event) => sum + evidenceCompleteness(event), 0) / verified.length)
      : 0,
    commercialTransparency: Math.round(knownDisclosureRate * 100),
    verifiedEventCount: verified.length,
    exactProductCount: new Set(verified.map((event) => event.product_id)).size,
    knownDisclosureRate: Math.round(knownDisclosureRate * 100),
    commercialShare: verified.length > 0 ? Math.round(commercialCount / verified.length * 100) : 0,
  }
}

export function productEvidenceStatusLabel(status: ProductDecisionSignal["evidenceStatus"]) {
  return {
    no_evidence: "Chưa có nguồn creator đã duyệt",
    one_source: "Một nguồn",
    cross_checked: "Đã đối chiếu",
    broadly_validated: "Được kiểm chứng rộng",
  }[status]
}
