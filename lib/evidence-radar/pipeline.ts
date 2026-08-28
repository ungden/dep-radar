import "server-only"

import { createHash } from "node:crypto"

import { findBeautyBrand, normalizeBrandName } from "@/lib/brand-registry"
import {
  assertEvidenceProviderReady,
  extractEvidenceClaims,
  EVIDENCE_MODEL,
  EVIDENCE_PROMPT_VERSION,
  requiresHumanReview,
} from "@/lib/evidence-radar/gemini"
import { getEvidenceSourceProvider } from "@/lib/evidence-radar/providers"
import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import { triageSourcePost } from "@/lib/evidence-radar/triage"
import type { CreatorAccount, CreatorProductEvent, EvidenceClaim, Product, SourcePost } from "@/lib/types"

export const MAX_ANALYSIS_ATTEMPTS = 3

function evidenceIdForSource(sourcePostId: string) {
  return `evidence-${sourcePostId}`
}

function eventIdForClaim(evidenceId: string, claim: EvidenceClaim) {
  return `evt-${createHash("sha256")
    .update([evidenceId, claim.matched_product_id, claim.event_type].join("|"))
    .digest("hex")
    .slice(0, 28)}`
}

function validUntil(eventType: CreatorProductEvent["event_type"], eventDate: string) {
  const date = new Date(`${eventDate}T00:00:00Z`)
  if (eventType === "repurchased") date.setUTCDate(date.getUTCDate() + 90)
  else if (eventType === "used" || eventType === "switched_to") date.setUTCDate(date.getUTCDate() + 60)
  else return null
  return date.toISOString()
}

function excerptForClaim(claim: EvidenceClaim) {
  return claim.evidence_spans[0]?.value?.slice(0, 500) || `${claim.brand} ${claim.product_name}`.trim()
}

function candidateKey(claim: EvidenceClaim) {
  return [claim.brand, claim.product_name, claim.variant ?? ""]
    .map(normalizeBrandName)
    .filter(Boolean)
    .join("|")
}

async function upsertProductCandidates(
  post: SourcePost,
  evidenceId: string,
  claims: EvidenceClaim[]
) {
  const supabase = getSupabaseAdmin()

  for (const claim of claims) {
    const canonicalKey = candidateKey(claim)
    if (!canonicalKey || !claim.brand.trim() || !claim.product_name.trim()) continue
    const registeredBrand = findBeautyBrand(claim.brand)
    const canonicalBrand = registeredBrand?.name ?? claim.brand.trim()
    const alias = `${claim.brand} ${claim.product_name}${claim.variant ? ` ${claim.variant}` : ""}`.trim()
    const { data: existing, error: existingError } = await supabase
      .from("product_candidates")
      .select("id,aliases,matched_product_id,status,reviewed_by,reviewed_at")
      .eq("canonical_key", canonicalKey)
      .maybeSingle()
    if (existingError) throw new Error(`Product candidate lookup failed: ${existingError.message}`)

    const candidatePayload = {
      canonical_key: canonicalKey,
      brand: canonicalBrand,
      product_name: claim.product_name.trim(),
      variant: claim.variant?.trim() || null,
      aliases: Array.from(new Set([...(existing?.aliases ?? []), alias])),
      identity_confidence: claim.confidence_score,
      matched_product_id: existing?.matched_product_id ?? claim.matched_product_id,
      status: existing?.status ?? (claim.risk_flags.includes("ambiguous_variant") ? "needs_identity" : "new"),
      reviewed_by: existing?.reviewed_by ?? null,
      reviewed_at: existing?.reviewed_at ?? null,
      updated_at: new Date().toISOString(),
    }
    const { data: candidate, error: candidateError } = await supabase
      .from("product_candidates")
      .upsert(candidatePayload, { onConflict: "canonical_key" })
      .select("id")
      .single()
    if (candidateError) throw new Error(candidateError.message)

    const { error: sourceError } = await supabase.from("product_candidate_sources").upsert({
      candidate_id: candidate.id,
      source_post_id: post.id,
      creator_id: post.creator_id,
      evidence_id: evidenceId,
      event_type: claim.event_type,
      disclosure: claim.disclosure,
      evidence_spans: claim.evidence_spans,
      risk_flags: claim.risk_flags,
      product_identity_score: claim.product_identity_score,
      action_evidence_score: claim.action_evidence_score,
      source_authenticity_score: claim.source_authenticity_score,
      evidence_localization_score: claim.evidence_localization_score,
      confidence_score: claim.confidence_score,
      updated_at: new Date().toISOString(),
    }, { onConflict: "candidate_id,source_post_id" })
    if (sourceError) throw new Error(sourceError.message)
  }
}

export async function collectCreatorAccount(accountId: string) {
  const supabase = getSupabaseAdmin()
  const { data: account, error: accountError } = await supabase
    .from("creator_accounts")
    .select("*")
    .eq("id", accountId)
    .single()
  if (accountError || !account) throw new Error(accountError?.message || `Creator account ${accountId} not found`)

  const typedAccount = account as CreatorAccount
  const provider = getEvidenceSourceProvider(typedAccount)
  const { data: run, error: runError } = await supabase
    .from("evidence_radar_runs")
    .insert({ run_type: "collection", provider: provider.name, metadata: { account_id: accountId } })
    .select("id")
    .single()
  if (runError) throw new Error(runError.message)

  try {
    const posts = await provider.listNewPosts(typedAccount, typedAccount.cursor)
    let inserted = 0
    for (const post of posts) {
      const { error } = await supabase.from("source_posts").upsert({
        creator_account_id: typedAccount.id,
        creator_id: typedAccount.creator_id,
        source_platform: typedAccount.platform,
        external_post_id: post.external_post_id,
        source_url: post.source_url,
        published_at: post.published_at,
        title: post.title,
        caption: post.caption,
        media_url: post.media_url,
        media_metadata: post.media_metadata,
        raw_payload: post.raw_payload,
        content_hash: post.content_hash,
      }, { onConflict: "source_url", ignoreDuplicates: true })
      if (!error) inserted += 1
      else if (error.code !== "23505") throw new Error(error.message)
    }

    const cursor = posts.map((post) => post.external_post_id).filter(Boolean).slice(0, 100).join(",") || typedAccount.cursor
    const { error: accountUpdateError } = await supabase.from("creator_accounts").update({
      cursor,
      last_polled_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", accountId)
    if (accountUpdateError) throw new Error(`Creator account update failed: ${accountUpdateError.message}`)
    const { error: runUpdateError } = await supabase.from("evidence_radar_runs").update({
      status: "completed",
      records_seen: posts.length,
      records_inserted: inserted,
      finished_at: new Date().toISOString(),
    }).eq("id", run.id)
    if (runUpdateError) throw new Error(`Collection run update failed: ${runUpdateError.message}`)
    return { provider: provider.name, seen: posts.length, inserted }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const [accountFailure, runFailure] = await Promise.all([
      supabase.from("creator_accounts").update({ last_error: message, updated_at: new Date().toISOString() }).eq("id", accountId),
      supabase.from("evidence_radar_runs").update({ status: "failed", error_summary: message, finished_at: new Date().toISOString() }).eq("id", run.id),
    ])
    const persistenceError = accountFailure.error?.message || runFailure.error?.message
    if (persistenceError) throw new Error(`${message}; failure state persistence failed: ${persistenceError}`)
    throw error
  }
}

export async function analyzeSourcePost(sourcePostId: string) {
  const supabase = getSupabaseAdmin()
  const { data: sourcePost, error: sourceError } = await supabase
    .from("source_posts")
    .select("*")
    .eq("id", sourcePostId)
    .single()
  if (sourceError || !sourcePost) throw new Error(sourceError?.message || `Source post ${sourcePostId} not found`)

  const post = sourcePost as SourcePost
  if (["ready", "ignored"].includes(post.analysis_status)) {
    return { evidenceId: null, claims: 0, maxConfidence: 0, humanReview: false, skipped: true, terminal: true }
  }
  if (post.analysis_attempts >= MAX_ANALYSIS_ATTEMPTS) {
    return {
      evidenceId: null,
      claims: 0,
      maxConfidence: 0,
      humanReview: false,
      skipped: true,
      exhausted: true,
      attempts: post.analysis_attempts,
    }
  }
  const triage = triageSourcePost(post)
  const { data: claimedPost, error: claimError } = await supabase.from("source_posts").update({
    analysis_status: triage.shouldAnalyze ? "processing" : "ignored",
    analysis_attempts: post.analysis_attempts + 1,
    content_lane: triage.lane,
    priority_score: triage.priorityScore,
    triage_reason: triage.reason,
    triaged_at: new Date().toISOString(),
    last_error: null,
    updated_at: new Date().toISOString(),
  })
    .eq("id", sourcePostId)
    .eq("analysis_attempts", post.analysis_attempts)
    .eq("analysis_status", post.analysis_status)
    .select("id")
    .maybeSingle()
  if (claimError) throw new Error(`Source post claim failed: ${claimError.message}`)
  if (!claimedPost) {
    return { evidenceId: null, claims: 0, maxConfidence: 0, humanReview: false, skipped: true, concurrent: true }
  }

  if (!triage.shouldAnalyze) {
    return { evidenceId: null, claims: 0, maxConfidence: 0, humanReview: false, ignored: true }
  }

  const { data: productsData, error: productsError } = await supabase
    .from("radar_products")
    .select("*")
    .neq("status", "archived")
  if (productsError) throw new Error(productsError.message)

  try {
    const claims = await extractEvidenceClaims(post, (productsData ?? []) as Product[])
    const maxConfidence = claims.reduce((max, claim) => Math.max(max, claim.confidence_score), 0)
    const candidateProductIds = Array.from(new Set(claims.map((claim) => claim.matched_product_id).filter(Boolean)))
    const candidateProductNames = Array.from(new Set(claims.map((claim) => `${claim.brand} ${claim.product_name}`.trim())))
    const riskFlags = Array.from(new Set(claims.flatMap((claim) => claim.risk_flags)))
    const goldenSampleCount = Number(process.env.EVIDENCE_RADAR_GOLDEN_SAMPLE_COUNT || 0)
    const humanReview = claims.length === 0 || claims.some((claim) => requiresHumanReview(claim, goldenSampleCount))
    const status = claims.length === 0
      ? "rejected"
      : candidateProductIds.length < claims.length
        ? "needs_product_match"
        : "ready_to_publish"
    const evidenceId = evidenceIdForSource(sourcePostId)
    const evidenceText = post.transcript_text?.trim() || post.caption
    const excerpt = claims[0] ? excerptForClaim(claims[0]) : evidenceText.slice(0, 500) || "Không phát hiện claim sản phẩm."

    const { error: evidenceError } = await supabase.from("creator_evidence_items").upsert({
      id: evidenceId,
      creator_id: post.creator_id,
      source_platform: post.source_platform,
      source_url: post.source_url,
      source_post_id: post.external_post_id,
      source_post_ref: post.id,
      published_at: post.published_at,
      observed_at: post.observed_at,
      source_title: post.title,
      source_excerpt: excerpt,
      raw_text: evidenceText,
      media_url: post.media_url,
      status,
      candidate_product_ids: candidateProductIds,
      candidate_product_names: candidateProductNames,
      researcher_note: "AI extraction pending human verification.",
      extracted_claims: claims,
      confidence_score: maxConfidence,
      model_name: EVIDENCE_MODEL,
      prompt_version: EVIDENCE_PROMPT_VERSION,
      evidence_spans: claims.flatMap((claim) => claim.evidence_spans),
      risk_flags: riskFlags,
      requires_human_review: humanReview,
      review_reason: humanReview ? "Pilot gate, low confidence, or risk flag requires review." : null,
    }, { onConflict: "id" })
    if (evidenceError) throw new Error(evidenceError.message)

    await upsertProductCandidates(post, evidenceId, claims)

    const { error: auditError } = await supabase.from("evidence_audit_log").insert({
      evidence_id: evidenceId,
      actor_type: "model",
      decision: claims.length ? (humanReview ? "queued_for_review" : "extracted") : "rejected",
      reason: humanReview ? "Human review gate active." : "Structured extraction completed.",
      after_data: { claim_count: claims.length, max_confidence: maxConfidence, risk_flags: riskFlags },
    })
    if (auditError) throw new Error(`Evidence audit insert failed: ${auditError.message}`)

    const systemReviewerId = process.env.EVIDENCE_RADAR_SYSTEM_REVIEWER_ID
    const autoPublish = process.env.EVIDENCE_RADAR_AUTO_PUBLISH === "true" && goldenSampleCount >= 500 && Boolean(systemReviewerId)
    if (autoPublish) {
      for (const claim of claims.filter((item) => !requiresHumanReview(item, goldenSampleCount) && item.matched_product_id)) {
        await publishVerifiedClaim(evidenceId, post, claim, "system", systemReviewerId!)
      }
    }

    const { error: readyUpdateError } = await supabase.from("source_posts").update({
      analysis_status: "ready",
      updated_at: new Date().toISOString(),
      raw_payload: {},
    }).eq("id", sourcePostId)
    if (readyUpdateError) throw new Error(`Source post completion failed: ${readyUpdateError.message}`)
    return { evidenceId, claims: claims.length, maxConfidence, humanReview }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const { error: failedUpdateError } = await supabase.from("source_posts").update({
      analysis_status: "failed",
      last_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", sourcePostId)
    if (failedUpdateError) {
      throw new Error(`${message}; failure state persistence failed: ${failedUpdateError.message}`)
    }
    throw error
  }
}

export async function analyzePriorityBatch(limit = 6) {
  const supabase = getSupabaseAdmin()
  const boundedLimit = Math.max(1, Math.min(8, Math.floor(limit)))
  const { data, error } = await supabase
    .from("source_posts")
    .select("id")
    .in("analysis_status", ["pending", "queued", "failed"])
    .in("transcription_status", ["ready", "no_speech"])
    .is("duplicate_of_source_post_id", null)
    .neq("content_lane", "lifestyle")
    .neq("content_lane", "vision_required")
    .lt("analysis_attempts", MAX_ANALYSIS_ATTEMPTS)
    .order("priority_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(boundedLimit)
  if (error) throw new Error(error.message)

  // Avoid a provider preflight when there is no work. When rows exist, validate
  // once before processing the batch so a revoked key cannot burn every retry.
  if ((data ?? []).length > 0) await assertEvidenceProviderReady()

  const results: Array<Record<string, unknown>> = []
  for (const row of data ?? []) {
    try {
      results.push({ sourcePostId: row.id, ...(await analyzeSourcePost(row.id)) })
    } catch (analysisError) {
      results.push({ sourcePostId: row.id, error: analysisError instanceof Error ? analysisError.message : String(analysisError) })
    }
  }
  return results
}

async function publishVerifiedClaim(
  evidenceId: string,
  post: SourcePost,
  claim: EvidenceClaim,
  actorType: "system" | "admin",
  reviewerId: string
) {
  if (!claim.matched_product_id) throw new Error("Cannot publish an unmatched product claim")
  const supabase = getSupabaseAdmin()
  const eventDate = (post.published_at || post.observed_at).slice(0, 10)
  const eventId = eventIdForClaim(evidenceId, claim)
  const payload: CreatorProductEvent = {
    id: eventId,
    creator_id: post.creator_id,
    product_id: claim.matched_product_id,
    evidence_id: evidenceId,
    event_type: claim.event_type,
    event_date: eventDate,
    observed_at: post.observed_at,
    source_platform: post.source_platform,
    source_url: post.source_url,
    source_post_id: post.external_post_id,
    source_title: post.title,
    source_excerpt: excerptForClaim(claim),
    media_url: post.media_url,
    sentiment: claim.sentiment,
    disclosure: claim.disclosure,
    usage_context: claim.usage_context,
    evidence_note: `Verified ${actorType} claim from ${EVIDENCE_PROMPT_VERSION}.`,
    confidence: claim.confidence_score >= 92 ? "high" : claim.confidence_score >= 70 ? "medium" : "low",
    confidence_score: claim.confidence_score,
    evidence_spans: claim.evidence_spans,
    risk_flags: claim.risk_flags,
    product_identity_score: claim.product_identity_score,
    action_evidence_score: claim.action_evidence_score,
    source_authenticity_score: claim.source_authenticity_score,
    evidence_localization_score: claim.evidence_localization_score,
    exact_sku_verified: true,
    verification_status: "verified",
    verified_by: reviewerId,
    verified_at: new Date().toISOString(),
    valid_until: validUntil(claim.event_type, eventDate),
  }
  const { error } = await supabase.from("creator_product_events").upsert(payload, {
    onConflict: "evidence_id,product_id,event_type",
  })
  if (error) throw new Error(error.message)
  const { error: evidenceUpdateError } = await supabase.from("creator_evidence_items").update({
    status: "published",
    requires_human_review: false,
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  }).eq("id", evidenceId)
  if (evidenceUpdateError) throw new Error(`Evidence publish update failed: ${evidenceUpdateError.message}`)
  const { error: auditInsertError } = await supabase.from("evidence_audit_log").insert({
    evidence_id: evidenceId,
    event_id: eventId,
    actor_id: reviewerId,
    actor_type: actorType,
    decision: actorType === "system" ? "auto_published" : "published",
    after_data: payload,
  })
  if (auditInsertError) throw new Error(`Evidence publish audit failed: ${auditInsertError.message}`)
}
