import { createHash } from "node:crypto"

import type {
  BudgetStatus,
  ContentRiskLevel,
  FactorySource,
  StructuredDraft,
  VerificationResult,
} from "@/lib/content-factory/types"

export const CONTENT_FACTORY_PROMPT_VERSION = "360dep-content-factory-v1"
export const MAX_SIMILARITY = 0.82

const HIGH_RISK_TERMS = [
  "điều trị", "chữa", "bệnh", "mụn viêm", "nám", "rụng tóc", "mang thai", "thai kỳ",
  "laser", "tiêm", "botox", "filler", "peel", "microneedling", "thuốc", "tác dụng phụ",
]
const MEDIUM_RISK_TERMS = [
  "retinoid", "retinol", "bha", "aha", "mụn", "chống nắng", "dị ứng", "kích ứng",
  "hoạt chất", "thành phần", "so sánh", "review", "spf",
]
const PROHIBITED_MEDICAL_PROMISES = [
  /chữa\s+(khỏi|dứt điểm)/iu,
  /điều trị\s+(100%|hoàn toàn|tận gốc)/iu,
  /cam kết\s+(hết|khỏi)/iu,
  /thay thế\s+(bác sĩ|thuốc)/iu,
  /không\s+có\s+tác dụng phụ/iu,
]

const TIER_A_HOSTS = new Set([
  "fda.gov", "www.fda.gov", "ftc.gov", "www.ftc.gov", "aad.org", "www.aad.org",
  "who.int", "www.who.int", "nhs.uk", "www.nhs.uk", "mayoclinic.org", "www.mayoclinic.org",
  "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov",
])
const TIER_B_HOST_SUFFIXES = [".edu", ".gov.vn", ".org"]

export function normalizeForComparison(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function stableHash(value: unknown) {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex")
}

export function slugifyVietnamese(value: string) {
  return normalizeForComparison(value).replace(/\s+/g, "-").replace(/^-|-$/g, "").slice(0, 100)
}

export function classifyRisk(input: string): ContentRiskLevel {
  const normalized = normalizeForComparison(input)
  if (HIGH_RISK_TERMS.some((term) => normalized.includes(normalizeForComparison(term)))) return "high"
  if (MEDIUM_RISK_TERMS.some((term) => normalized.includes(normalizeForComparison(term)))) return "medium"
  return "low"
}

export function sourcePolicy(urlValue: string) {
  try {
    const url = new URL(urlValue)
    const host = url.hostname.toLowerCase()
    if (TIER_A_HOSTS.has(host)) {
      return { tier: "A" as const, official: true, regulatorOrProfessional: true }
    }
    const tierB = TIER_B_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
    return {
      tier: tierB ? "B" as const : "C" as const,
      official: tierB || host.includes("official"),
      regulatorOrProfessional: tierB,
    }
  } catch {
    return { tier: "D" as const, official: false, regulatorOrProfessional: false }
  }
}

function tokenSet(value: string) {
  return new Set(normalizeForComparison(value).split(" ").filter((token) => token.length > 2))
}

export function contentSimilarity(left: string, right: string) {
  const a = tokenSet(left)
  const b = tokenSet(right)
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const token of a) if (b.has(token)) intersection += 1
  return intersection / (a.size + b.size - intersection)
}

export function maximumSimilarity(draft: StructuredDraft, existing: Array<{ id: string; title: string; content: string }>, ownPostId?: string | null) {
  return existing
    .filter((post) => post.id !== ownPostId)
    .reduce((maximum, post) => Math.max(maximum, contentSimilarity(`${draft.title} ${draft.content}`, `${post.title} ${post.content}`)), 0)
}

export function deterministicQuality(params: {
  draft: StructuredDraft
  sources: FactorySource[]
  similarity: number
  duplicateSlug: boolean
  invalidAffiliateLinks: string[]
}) {
  const reasons: string[] = []
  let score = 100
  const wordCount = params.draft.content.trim().split(/\s+/).filter(Boolean).length
  const accessibleSources = params.sources.filter((source) => source.accessible)

  if (wordCount < 650) { reasons.push("content_too_short"); score -= 25 }
  if (params.draft.takeaways.length < 3) { reasons.push("missing_takeaways"); score -= 8 }
  if (params.draft.faq.length < 2) { reasons.push("missing_faq"); score -= 7 }
  if (params.draft.claims.length === 0) { reasons.push("missing_claim_map"); score -= 20 }
  if (accessibleSources.length === 0) { reasons.push("no_accessible_source"); score -= 35 }
  if (params.similarity >= MAX_SIMILARITY) { reasons.push("duplicate_similarity"); score -= 40 }
  if (params.duplicateSlug) { reasons.push("duplicate_slug"); score -= 50 }
  if (/\b(TODO|TBD|lorem ipsum|đang cập nhật)\b/iu.test(params.draft.content)) {
    reasons.push("unfinished_content")
    score -= 35
  }
  if (PROHIBITED_MEDICAL_PROMISES.some((pattern) => pattern.test(params.draft.content))) {
    reasons.push("prohibited_medical_promise")
    score -= 60
  }
  if (params.invalidAffiliateLinks.length > 0) {
    reasons.push("unverified_affiliate_link")
    score -= 60
  }
  return { score: Math.max(0, score), reasons, wordCount }
}

export function publicationPolicy(params: {
  riskLevel: ContentRiskLevel
  sources: FactorySource[]
  deterministicScore: number
  deterministicReasons: string[]
  verifier: VerificationResult
  similarity: number
  budget: BudgetStatus
}) {
  const reasons = [...params.deterministicReasons, ...params.verifier.policyFlags]
  const accessible = params.sources.filter((source) => source.accessible)
  const strong = accessible.filter((source) => source.tier === "A" || source.tier === "B")
  const unsupported = params.verifier.claims.filter((claim) => claim.status === "unsupported" || claim.status === "contradictory")

  if (params.budget.stopAllPaidWork) reasons.push("monthly_budget_exhausted")
  if (params.similarity >= MAX_SIMILARITY) reasons.push("similarity_threshold_failed")
  if (params.deterministicScore < 90) reasons.push("deterministic_quality_below_90")

  if (params.riskLevel === "low") {
    if (accessible.length < 1) reasons.push("low_risk_requires_one_accessible_source")
    if (params.verifier.score < 85) reasons.push("low_risk_verifier_below_85")
  }
  if (params.riskLevel === "medium") {
    if (accessible.length < 2) reasons.push("medium_risk_requires_two_sources")
    if (params.verifier.score < 90) reasons.push("medium_risk_verifier_below_90")
  }
  if (params.riskLevel === "high") {
    if (strong.length < 2) reasons.push("high_risk_requires_two_tier_a_b_sources")
    if (!strong.some((source) => source.regulatorOrProfessional)) reasons.push("high_risk_requires_regulator_or_professional")
    if (params.verifier.score < 95) reasons.push("high_risk_verifier_below_95")
    if (unsupported.length > 0) reasons.push("high_risk_has_unsupported_or_contradictory_claim")
  }

  return { pass: reasons.length === 0, reasons: Array.from(new Set(reasons)) }
}

export function extractExternalLinks(content: string) {
  return Array.from(content.matchAll(/https?:\/\/[^\s)\]}>"']+/giu), (match) => match[0])
}
