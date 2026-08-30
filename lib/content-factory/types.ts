export type ContentRiskLevel = "low" | "medium" | "high"
export type ContentJobType = "new" | "refresh"
export type ContentSlotType = "refresh" | "evidence" | "evergreen"
export type ContentJobStatus =
  | "queued"
  | "researching"
  | "drafting"
  | "verifying"
  | "asset_preparation"
  | "publishable"
  | "policy_blocked"
  | "published"
  | "failed"

export interface ContentSignalRecord {
  id: string
  signal_type: "creator_evidence" | "product_evidence" | "content_gap" | "search_console" | "freshness" | "evergreen"
  source_type: string
  external_key: string | null
  title: string
  summary: string
  source_url: string | null
  hub_slug: string | null
  intent: string | null
  risk_level: ContentRiskLevel
  payload: Record<string, unknown>
  evidence_score: number
  freshness_score: number
  opportunity_score: number
  total_score: number
  status: "pending" | "selected" | "consumed" | "rejected" | "expired"
  dedupe_hash: string
  observed_at: string
  expires_at: string | null
}

export interface ContentJobRecord {
  id: string
  signal_id: string | null
  post_id: string | null
  job_type: ContentJobType
  slot_type: ContentSlotType
  status: ContentJobStatus
  risk_level: ContentRiskLevel
  hub_slug: string | null
  intent: string | null
  scheduled_for: string
  idempotency_key: string
  checkpoint: Record<string, unknown>
  attempt_count: number
  max_attempts: number
  lease_until: string | null
  leased_by: string | null
  generator_model: string | null
  verifier_model: string | null
  draft_version_id: string | null
  published_version_id: string | null
  deterministic_score: number | null
  verifier_score: number | null
  similarity_score: number | null
  policy_reasons: string[]
  estimated_cost_usd: number
  actual_cost_usd: number
  shadow_mode: boolean
  published_at: string | null
  last_error: string | null
}

export interface FactorySource {
  url: string
  title: string
  publisher: string
  sourceType: string
  tier: "A" | "B" | "C" | "D"
  accessible: boolean
  official: boolean
  regulatorOrProfessional: boolean
  excerpt?: string
}

export interface FactoryClaim {
  key: string
  text: string
  type: "fact" | "product" | "safety" | "recommendation" | "experience"
  riskLevel: ContentRiskLevel
  sourceUrls: string[]
  status: "supported" | "unsupported" | "contradictory" | "not_applicable"
  confidence: number
  note?: string
}

export interface StructuredDraft {
  title: string
  slug: string
  excerpt: string
  content: string
  hubSlug: string
  intent: "pillar" | "problem-solving" | "decision" | "safety"
  contentFormat: "guide" | "checklist" | "comparison" | "explainer" | "review"
  category: string
  tags: string[]
  image: string
  takeaways: string[]
  faq: Array<{ question: string; answer: string }>
  medicalDisclaimerLevel: "none" | "light" | "medical"
  productIds: string[]
  internalLinkSlugs: string[]
  claims: Array<{
    key: string
    text: string
    type: FactoryClaim["type"]
    riskLevel: ContentRiskLevel
    sourceUrls: string[]
  }>
}

export interface VerificationResult {
  score: number
  summary: string
  claims: FactoryClaim[]
  unsupportedClaims: string[]
  contradictoryClaims: string[]
  policyFlags: string[]
}

export interface BudgetStatus {
  monthlyLimitUsd: number
  warningRatio: number
  spentUsd: number
  ratio: number
  categorySpend: Record<"ai_text" | "collection" | "image" | "reserve", number>
  stopNewPaidWork: boolean
  stopAllPaidWork: boolean
}

export interface ContentFactoryRunResult {
  paused: boolean
  reason?: string
  slot?: ContentSlotType | null
  seededSignals: number
  enqueuedJobId?: string
  processedJobId?: string
  status?: ContentJobStatus
  publishedSlug?: string
  shadowMode?: boolean
  budget?: BudgetStatus
  warnings: string[]
}
