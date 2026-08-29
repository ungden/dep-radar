import "server-only"

import { createHash } from "node:crypto"

import { EVIDENCE_PROMPT_VERSION } from "@/lib/evidence-radar/gemini"
import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import type { CreatorProductEvent, EvidenceClaim, SourcePost } from "@/lib/types"

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

export function excerptForClaim(claim: EvidenceClaim) {
  return claim.evidence_spans[0]?.value?.slice(0, 500) || `${claim.brand} ${claim.product_name}`.trim()
}

export async function publishVerifiedClaim(
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
