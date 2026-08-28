import "server-only"

import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import { getBudgetStatus } from "@/lib/content-factory/budget"
import { ContentProviderConfigurationError, generateDraft, verifyDraft } from "@/lib/content-factory/gemini"
import { planSlot, seedEvidenceSignals } from "@/lib/content-factory/planner"
import {
  deterministicQuality,
  extractExternalLinks,
  maximumSimilarity,
  publicationPolicy,
  slugifyVietnamese,
  sourcePolicy,
  stableHash,
} from "@/lib/content-factory/policy"
import { deleteContentJobMessage, readContentJobs } from "@/lib/content-factory/server"
import type {
  ContentFactoryRunResult,
  ContentJobRecord,
  ContentSignalRecord,
  FactoryClaim,
  FactorySource,
  StructuredDraft,
  VerificationResult,
} from "@/lib/content-factory/types"

const HUB_IMAGES: Record<string, string> = {
  "da-mat": "/images/catalogue/skincare-foundation.jpg",
  "tri-mun": "/images/catalogue/acne-sun-education.jpg",
  "sang-da-chong-nang": "/images/catalogue/acne-sun-education.jpg",
  "ingredient-radar": "/images/catalogue/skincare-foundation.jpg",
  "product-radar": "/brand/social-share.jpg",
  bodycare: "/images/catalogue/hair-body-grooming.jpg",
  "toc-da-dau": "/images/catalogue/hair-body-grooming.jpg",
  makeup: "/images/catalogue/makeup-fragrance-tech.jpg",
  "mui-huong": "/images/products/miss-dior-eau-de-parfum.jpg",
  "nam-gioi": "/images/catalogue/hair-body-grooming.jpg",
  "clinic-treatment": "/images/catalogue/acne-sun-education.jpg",
  "beauty-lifestyle": "/images/catalogue/skincare-foundation.jpg",
  "nails-mi-long-may": "/images/catalogue/makeup-fragrance-tech.jpg",
  "beauty-tech": "/images/catalogue/makeup-fragrance-tech.jpg",
}

function assertSafeSourceUrl(value: string) {
  const url = new URL(value)
  if (url.protocol !== "https:") throw new Error("Only HTTPS content sources are allowed")
  const host = url.hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".local") || /^127\./.test(host) || /^10\./.test(host)
    || /^192\.168\./.test(host) || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    || host === "::1" || host === "0.0.0.0") {
    throw new Error("Private content source URLs are not allowed")
  }
  return url
}

function stripHtml(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

async function researchSource(input: { url: string; title?: string; publisher?: string; sourceType?: string; excerpt?: string }) {
  try {
    const url = assertSafeSourceUrl(input.url)
    const policy = sourcePolicy(url.toString())
    const response = await fetch(url, {
      method: "GET",
      headers: { "user-agent": "360dep-ContentResearch/1.0 (+https://www.360dep.vn)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    })
    const contentType = response.headers.get("content-type") ?? ""
    let excerpt = input.excerpt?.trim() ?? ""
    if (response.ok && (!excerpt || excerpt.length < 120) && /(text|json|html)/i.test(contentType)) {
      excerpt = stripHtml((await response.text()).slice(0, 120_000)).slice(0, 5_000)
    }
    return {
      url: url.toString(),
      title: input.title?.trim() || url.hostname,
      publisher: input.publisher?.trim() || url.hostname,
      sourceType: input.sourceType?.trim() || "web",
      tier: policy.tier,
      accessible: response.ok && excerpt.length >= 80,
      official: policy.official,
      regulatorOrProfessional: policy.regulatorOrProfessional,
      excerpt,
    } satisfies FactorySource
  } catch {
    const policy = sourcePolicy(input.url)
    return {
      url: input.url,
      title: input.title?.trim() || input.url,
      publisher: input.publisher?.trim() || "unknown",
      sourceType: input.sourceType?.trim() || "web",
      tier: policy.tier,
      accessible: false,
      official: policy.official,
      regulatorOrProfessional: policy.regulatorOrProfessional,
      excerpt: input.excerpt?.trim() ?? "",
    } satisfies FactorySource
  }
}

function sourceInputs(post: Record<string, unknown>, signal: ContentSignalRecord | null) {
  const signalSources = Array.isArray(signal?.payload?.sources) ? signal.payload.sources : []
  const postSources = Array.isArray(post.source_notes) ? post.source_notes : []
  const values = [...signalSources, ...postSources]
    .map((item) => item && typeof item === "object" ? item as Record<string, unknown> : null)
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item.url === "string"))
    .map((item) => ({
      url: String(item.url),
      title: typeof item.title === "string" ? item.title : typeof item.label === "string" ? item.label : undefined,
      publisher: typeof item.publisher === "string" ? item.publisher : undefined,
      sourceType: typeof item.sourceType === "string" ? item.sourceType : undefined,
      excerpt: typeof item.excerpt === "string" ? item.excerpt : undefined,
    }))
  const seen = new Set<string>()
  return values.filter((source) => {
    if (seen.has(source.url)) return false
    seen.add(source.url)
    return true
  }).slice(0, 8)
}

function minimumSourcesSatisfied(job: ContentJobRecord, sources: FactorySource[]) {
  const accessible = sources.filter((source) => source.accessible)
  if (job.risk_level === "low") return accessible.length >= 1
  if (job.risk_level === "medium") return accessible.length >= 2
  const strong = accessible.filter((source) => source.tier === "A" || source.tier === "B")
  return strong.length >= 2 && strong.some((source) => source.regulatorOrProfessional)
}

function allowedProductIds(post: Record<string, unknown>, signal: ContentSignalRecord | null) {
  const postIds = Array.isArray(post.product_ids) ? post.product_ids.map(String) : []
  const signalIds = Array.isArray(signal?.payload?.productIds) ? signal.payload.productIds.map(String) : []
  return new Set([...postIds, ...signalIds])
}

function sanitizeDraft(params: {
  draft: StructuredDraft
  job: ContentJobRecord
  post: Record<string, unknown>
  signal: ContentSignalRecord | null
  existingSlugs: string[]
}) {
  const productIds = allowedProductIds(params.post, params.signal)
  const slug = params.job.job_type === "refresh" ? String(params.post.slug) : slugifyVietnamese(params.draft.slug || params.draft.title)
  return {
    ...params.draft,
    slug,
    hubSlug: params.job.hub_slug ?? params.draft.hubSlug,
    intent: (params.job.intent ?? params.draft.intent) as StructuredDraft["intent"],
    image: HUB_IMAGES[params.job.hub_slug ?? params.draft.hubSlug] ?? "/brand/social-share.jpg",
    productIds: params.draft.productIds.filter((id) => productIds.has(id)),
    internalLinkSlugs: params.draft.internalLinkSlugs.filter((value) => value !== slug && params.existingSlugs.includes(value)).slice(0, 8),
    claims: params.draft.claims.map((claim, index) => ({ ...claim, key: claim.key.trim() || `claim-${index + 1}` })),
  } satisfies StructuredDraft
}

async function invalidAffiliateLinks(draft: StructuredDraft) {
  const links = extractExternalLinks(draft.content)
  if (links.length === 0) return []
  const { data } = await getSupabaseAdmin().from("product_offers").select("affiliate_url,verification_status,match_status,is_active,valid_until")
    .in("affiliate_url", links)
  const now = Date.now()
  const valid = new Set((data ?? []).filter((offer) => offer.verification_status === "verified"
      && offer.match_status === "exact" && offer.is_active === true
      && (!offer.valid_until || new Date(offer.valid_until).getTime() > now))
    .map((offer) => offer.affiliate_url as string))
  return links.filter((link) => {
    if (!valid.has(link)) return true
    const index = draft.content.indexOf(link)
    const context = draft.content.slice(Math.max(0, index - 180), index + link.length + 180)
    return !/(liên kết tiếp thị|affiliate|hoa hồng)/iu.test(context)
  })
}

function normalizeVerification(draft: StructuredDraft, verification: VerificationResult) {
  const verifiedByKey = new Map(verification.claims.map((claim) => [claim.key, claim]))
  const claims: FactoryClaim[] = draft.claims.map((claim) => verifiedByKey.get(claim.key) ?? {
    ...claim,
    status: "unsupported",
    confidence: 0,
    note: "Verifier omitted this claim.",
  })
  const omitted = claims.some((claim) => claim.status === "unsupported" && claim.note === "Verifier omitted this claim.")
  return {
    ...verification,
    score: Math.max(0, Math.min(100, Math.round(Number(verification.score) || 0))),
    claims,
    policyFlags: Array.from(new Set([...(verification.policyFlags ?? []), ...(omitted ? ["verifier_omitted_claim"] : [])])),
  }
}

async function createDraftSnapshot(params: {
  job: ContentJobRecord
  draft: StructuredDraft
  post: Record<string, unknown>
  sources: FactorySource[]
  qualityReport: Record<string, unknown>
}) {
  const supabase = getSupabaseAdmin()
  const existing = await supabase.from("content_versions").select("*").eq("job_id", params.job.id).eq("snapshot_stage", "draft").maybeSingle()
  if (existing.data) return existing.data as Record<string, unknown>
  const latest = await supabase.from("content_versions").select("version_number").eq("post_id", params.post.id)
    .order("version_number", { ascending: false }).limit(1).maybeSingle()
  const versionNumber = Number(latest.data?.version_number ?? 0) + 1
  const contentHash = stableHash({ title: params.draft.title, content: params.draft.content, structured: params.draft })
  const insert = await supabase.from("content_versions").insert({
    post_id: params.post.id,
    job_id: params.job.id,
    version_number: versionNumber,
    snapshot_stage: "draft",
    title: params.draft.title,
    slug: params.draft.slug,
    excerpt: params.draft.excerpt,
    content: params.draft.content,
    structured_content: params.draft,
    metadata: {
      category: params.draft.category, tags: params.draft.tags, image: params.draft.image,
      takeaways: params.draft.takeaways, faq: params.draft.faq,
      medicalDisclaimerLevel: params.draft.medicalDisclaimerLevel,
      productIds: params.draft.productIds, internalLinkSlugs: params.draft.internalLinkSlugs,
    },
    risk_level: params.job.risk_level,
    provenance: { content_job_id: params.job.id, signal_id: params.job.signal_id, source_count: params.sources.length },
    quality_report: params.qualityReport,
    content_hash: contentHash,
  }).select("*").single()
  if (insert.error) throw new Error(`Cannot create draft snapshot: ${insert.error.message}`)
  return insert.data as Record<string, unknown>
}

async function storeSourcesAndClaims(versionId: string, sources: FactorySource[], claims: FactoryClaim[]) {
  const supabase = getSupabaseAdmin()
  const sourceRows = sources.map((source) => ({
    version_id: versionId,
    canonical_url: source.url,
    source_title: source.title,
    publisher: source.publisher,
    source_type: source.sourceType,
    source_tier: source.tier,
    accessible: source.accessible,
    official: source.official,
    regulator_or_professional: source.regulatorOrProfessional,
    evidence_excerpt: source.excerpt?.slice(0, 8_000),
    content_hash: stableHash(source.excerpt ?? ""),
  }))
  const sourceInsert = await supabase.from("content_sources").upsert(sourceRows, { onConflict: "version_id,canonical_url" }).select("id,canonical_url")
  if (sourceInsert.error) throw new Error(`Cannot store content sources: ${sourceInsert.error.message}`)
  const sourceIds = new Map((sourceInsert.data ?? []).map((source) => [source.canonical_url, source.id]))
  const claimRows = claims.map((claim) => ({
    version_id: versionId,
    claim_key: claim.key,
    claim_text: claim.text,
    claim_type: claim.type,
    risk_level: claim.riskLevel,
    source_ids: claim.sourceUrls.map((url) => sourceIds.get(url)).filter(Boolean),
    verification_status: claim.status,
    verifier_confidence: claim.confidence,
    verifier_note: claim.note ?? null,
  }))
  if (claimRows.length > 0) {
    const claimInsert = await supabase.from("content_claims").upsert(claimRows, { onConflict: "version_id,claim_key" })
    if (claimInsert.error) throw new Error(`Cannot store content claims: ${claimInsert.error.message}`)
  }
}

async function updateJobCost(jobId: string) {
  const supabase = getSupabaseAdmin()
  const result = await supabase.from("content_runs").select("actual_cost_usd").eq("job_id", jobId).eq("status", "completed")
  const cost = (result.data ?? []).reduce((sum, run) => sum + Number(run.actual_cost_usd ?? 0), 0)
  await supabase.from("content_jobs").update({ actual_cost_usd: cost }).eq("id", jobId)
  return cost
}

async function blockJob(job: ContentJobRecord, reasons: string[], error?: string) {
  await getSupabaseAdmin().from("content_jobs").update({
    status: "policy_blocked",
    policy_reasons: Array.from(new Set(reasons)),
    last_error: error ?? null,
    lease_until: null,
    leased_by: null,
  }).eq("id", job.id)
}

async function processMessage(message: Awaited<ReturnType<typeof readContentJobs>>[number], options: { shadowMode: boolean; autoPublish: boolean }) {
  const supabase = getSupabaseAdmin()
  const jobResult = await supabase.from("content_jobs").select("*").eq("id", message.message.job_id).maybeSingle()
  const job = jobResult.data as ContentJobRecord | null
  if (!job) {
    await deleteContentJobMessage(message.msg_id)
    return { processedJobId: message.message.job_id, status: "failed" as const }
  }
  if (["published", "publishable", "policy_blocked", "failed"].includes(job.status)) {
    await deleteContentJobMessage(message.msg_id)
    return { processedJobId: job.id, status: job.status }
  }
  const attempt = Math.max(job.attempt_count + 1, message.read_ct)
  if (attempt > job.max_attempts) {
    await supabase.from("content_jobs").update({ status: "failed", last_error: "Maximum attempts exceeded" }).eq("id", job.id)
    await deleteContentJobMessage(message.msg_id)
    return { processedJobId: job.id, status: "failed" as const }
  }

  const leaseUntil = new Date(Date.now() + 10 * 60_000).toISOString()
  await supabase.from("content_jobs").update({
    status: "researching", attempt_count: attempt, lease_until: leaseUntil, leased_by: `vercel:${process.env.VERCEL_REGION ?? "local"}`,
  }).eq("id", job.id)
  job.attempt_count = attempt

  try {
    const [postResult, signalResult, postsResult, budget] = await Promise.all([
      supabase.from("posts").select("*").eq("id", job.post_id).single(),
      job.signal_id ? supabase.from("content_signals").select("*").eq("id", job.signal_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      supabase.from("posts").select("id,title,slug,content").eq("status", "published"),
      getBudgetStatus(),
    ])
    if (postResult.error) throw new Error(`Content job post is missing: ${postResult.error.message}`)
    const post = postResult.data as Record<string, unknown>
    const signal = signalResult.data as ContentSignalRecord | null
    const sources = await Promise.all(sourceInputs(post, signal).map(researchSource))

    if (!minimumSourcesSatisfied(job, sources)) {
      await blockJob(job, ["insufficient_accessible_sources"])
      await deleteContentJobMessage(message.msg_id)
      return { processedJobId: job.id, status: "policy_blocked" as const }
    }
    if (budget.stopAllPaidWork || (job.job_type === "new" && budget.stopNewPaidWork)) {
      await blockJob(job, [budget.stopAllPaidWork ? "monthly_budget_exhausted" : "budget_warning_net_new_paused"])
      await deleteContentJobMessage(message.msg_id)
      return { processedJobId: job.id, status: "policy_blocked" as const }
    }

    const existingPosts = (postsResult.data ?? []) as Array<{ id: string; title: string; slug: string; content: string }>
    const existingSlugs = existingPosts.map((item) => item.slug)
    await supabase.from("content_jobs").update({ status: "drafting", checkpoint: { research: { sourceCount: sources.length, accessibleCount: sources.filter((source) => source.accessible).length } } }).eq("id", job.id)
    const generated = await generateDraft({
      job,
      subject: signal?.title ?? String(post.title),
      existingPost: job.job_type === "refresh" ? post : null,
      ownData: (signal?.payload?.ownData as Record<string, unknown> | undefined) ?? { postId: post.id, productIds: post.product_ids ?? [] },
      sources,
      existingSlugs,
    })
    const draft = sanitizeDraft({ draft: generated.draft, job, post, signal, existingSlugs })
    const similarity = maximumSimilarity(draft, existingPosts, job.post_id)
    const duplicateSlug = existingPosts.some((item) => item.id !== job.post_id && item.slug === draft.slug)
    const invalidLinks = await invalidAffiliateLinks(draft)
    const claimSourceRegistry = new Set(sources.map((source) => source.url))
    const invalidClaimSources = draft.claims.some((claim) => claim.sourceUrls.some((url) => !claimSourceRegistry.has(url)))
    const deterministic = deterministicQuality({ draft, sources, similarity, duplicateSlug, invalidAffiliateLinks: invalidLinks })
    if (invalidClaimSources) {
      deterministic.reasons.push("claim_source_outside_registry")
      deterministic.score = Math.max(0, deterministic.score - 40)
    }
    const snapshot = await createDraftSnapshot({ job, draft, post, sources, qualityReport: { deterministic, similarity } })

    await supabase.from("content_jobs").update({ status: "verifying", draft_version_id: snapshot.id, generator_model: generated.model }).eq("id", job.id)
    const verified = await verifyDraft({ job, draft, sources })
    const verification = normalizeVerification(draft, verified.verification)
    await storeSourcesAndClaims(String(snapshot.id), sources, verification.claims)

    const freshBudget = await getBudgetStatus()
    const decision = publicationPolicy({
      riskLevel: job.risk_level,
      sources,
      deterministicScore: deterministic.score,
      deterministicReasons: deterministic.reasons,
      verifier: verification,
      similarity,
      budget: freshBudget,
    })
    const cost = await updateJobCost(job.id)
    const nextStatus = decision.pass ? "publishable" : "policy_blocked"
    const update = await supabase.from("content_jobs").update({
      status: nextStatus,
      deterministic_score: deterministic.score,
      verifier_score: verification.score,
      similarity_score: similarity,
      policy_reasons: decision.reasons,
      generator_model: generated.model,
      verifier_model: verified.model,
      actual_cost_usd: cost,
      checkpoint: {
        research: { sourceCount: sources.length, accessibleCount: sources.filter((source) => source.accessible).length },
        draft: { versionId: snapshot.id, contentHash: snapshot.content_hash },
        verification: { score: verification.score, summary: verification.summary },
      },
      lease_until: null,
      leased_by: null,
    }).eq("id", job.id)
    if (update.error) throw new Error(`Cannot checkpoint content decision: ${update.error.message}`)

    let publishedSlug: string | undefined
    if (decision.pass && options.autoPublish && !options.shadowMode) {
      const publish = await supabase.rpc("content_factory_publish", { p_job_id: job.id, p_draft_version_id: snapshot.id, p_published_at: new Date().toISOString() })
      if (publish.error) throw new Error(`Atomic content publication failed: ${publish.error.message}`)
      publishedSlug = draft.slug
    }
    await deleteContentJobMessage(message.msg_id)
    return { processedJobId: job.id, status: publishedSlug ? "published" as const : nextStatus, publishedSlug }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error)
    if (error instanceof ContentProviderConfigurationError) {
      await blockJob(job, ["provider_unavailable"], messageText)
      await deleteContentJobMessage(message.msg_id)
      return { processedJobId: job.id, status: "policy_blocked" as const }
    }
    const finalAttempt = attempt >= job.max_attempts
    await supabase.from("content_jobs").update({
      status: finalAttempt ? "failed" : "queued",
      last_error: messageText,
      lease_until: null,
      leased_by: null,
    }).eq("id", job.id)
    if (finalAttempt) await deleteContentJobMessage(message.msg_id)
    throw error
  }
}

export async function runContentFactory(now = new Date()): Promise<ContentFactoryRunResult> {
  const enabled = process.env.CONTENT_FACTORY_ENABLED === "true"
  const shadowMode = process.env.CONTENT_FACTORY_SHADOW_MODE !== "false"
  const autoPublish = process.env.CONTENT_FACTORY_AUTO_PUBLISH === "true"
  const warnings: string[] = []
  if (!enabled) return { paused: true, reason: "CONTENT_FACTORY_ENABLED is off", seededSignals: 0, warnings }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { paused: true, reason: "Supabase service credentials are missing", seededSignals: 0, warnings }
  }

  const budget = await getBudgetStatus(now)
  if (budget.stopAllPaidWork) return { paused: true, reason: "Monthly paid-call budget is exhausted", seededSignals: 0, budget, warnings }

  const seededSignals = await seedEvidenceSignals()
  const planned = await planSlot(now, budget, shadowMode)
  if (planned.skipped && planned.skipped !== "not_a_publication_window" && planned.skipped !== "slot_already_planned") warnings.push(planned.skipped)

  const messages = await readContentJobs(1, 600)
  if (messages.length === 0) {
    return {
      paused: false,
      slot: planned.slot,
      seededSignals,
      enqueuedJobId: planned.job?.id,
      shadowMode,
      budget,
      warnings,
    }
  }
  const processed = await processMessage(messages[0], { shadowMode, autoPublish })
  return {
    paused: false,
    slot: planned.slot,
    seededSignals,
    enqueuedJobId: planned.job?.id,
    processedJobId: processed.processedJobId,
    status: processed.status as ContentFactoryRunResult["status"],
    publishedSlug: processed.publishedSlug,
    shadowMode,
    budget,
    warnings,
  }
}
