import "./load-local-env"

import { createClient } from "@supabase/supabase-js"
import { isDirectCreatorEvidenceSource } from "../lib/evidence-source"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error("check:data-integrity requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {

const [
  { data: offers, error: offerError },
  { data: events, error: eventError },
  { data: evidence, error: evidenceError },
  { data: candidates, error: candidateError },
  { data: products, error: productError },
  { data: ratings, error: ratingError },
] = await Promise.all([
  db.from("product_offers").select("*"),
  db.from("creator_product_events").select("*"),
  db.from("creator_evidence_items").select("*"),
  db.from("product_candidates").select("*"),
  db.from("radar_products").select("id,name,brand,rating,reviews,status"),
  db.from("user_ratings").select("product_id,rating,status").eq("status", "approved"),
])

for (const error of [offerError, eventError, evidenceError, candidateError, productError, ratingError]) {
  if (error) throw error
}

const referencedPostIds = Array.from(new Set(
  [...(events ?? []), ...(evidence ?? [])]
    .map((row) => row.source_post_id)
    .filter((id): id is string => Boolean(id)),
))
const { data: sourcePosts, error: sourcePostError } = referencedPostIds.length > 0
  ? await db.from("source_posts").select("creator_id,external_post_id,source_url").in("external_post_id", referencedPostIds)
  : { data: [], error: null }
if (sourcePostError) throw sourcePostError

const failures: string[] = []
const searchUrlPattern = /(?:\/search|search\?|keyword=|[?&](?:q|query)=)/i
const internalSourcePattern = /^https:\/\/(?:www\.)?360dep\.vn(?:\/|$)/i
const sourcePostByCreatorAndId = new Map(
  (sourcePosts ?? []).map((post) => [`${post.creator_id}:${post.external_post_id}`, post]),
)

for (const offer of offers ?? []) {
  if (offer.verification_status !== "verified" || offer.is_active !== true) continue
  if (offer.match_status !== "exact") failures.push(`offer ${offer.id}: verified without exact product match`)
  if (!offer.verified_by || !offer.verified_at) failures.push(`offer ${offer.id}: verified without audit actor/time`)
  if (!offer.affiliate_url?.startsWith("https://") || searchUrlPattern.test(offer.affiliate_url)) {
    failures.push(`offer ${offer.id}: public URL is not a direct HTTPS affiliate/product URL`)
  }
}

for (const event of events ?? []) {
  if (event.verification_status !== "verified") continue
  const platform = String(event.source_platform).toLowerCase()
  if (!event.verified_by || !event.verified_at) failures.push(`creator event ${event.id}: verified without audit actor/time`)
  if (!event.evidence_id) failures.push(`creator event ${event.id}: verified without evidence record`)
  if (!event.source_url?.startsWith("https://") || internalSourcePattern.test(event.source_url) || platform.includes("seed") || platform.includes("internal")) {
    failures.push(`creator event ${event.id}: internal or non-public evidence marked verified`)
  }
  if (!isDirectCreatorEvidenceSource(event.source_platform, event.source_url, event.source_post_id)) {
    failures.push(`creator event ${event.id}: source is not the direct creator clip or post id does not match`)
  }
  const sourcePost = sourcePostByCreatorAndId.get(`${event.creator_id}:${event.source_post_id}`)
  if (!sourcePost || sourcePost.source_url !== event.source_url) {
    failures.push(`creator event ${event.id}: source URL does not match the archived source post`)
  }
  if (Number(event.confidence_score) < 90) failures.push(`creator event ${event.id}: public confidence below 90`)
  if (event.exact_sku_verified !== true) failures.push(`creator event ${event.id}: exact SKU was not verified`)
  if (!Array.isArray(event.evidence_spans) || event.evidence_spans.length === 0) failures.push(`creator event ${event.id}: missing localized evidence span`)
  if ((event.risk_flags ?? []).some((flag: string) => ["ambiguous_variant", "multi_product_bundle", "product_not_in_catalogue"].includes(flag))) {
    failures.push(`creator event ${event.id}: unresolved identity risk flag`)
  }
}

for (const item of evidence ?? []) {
  if (item.status !== "published") continue
  if (!item.reviewed_by || !item.reviewed_at) failures.push(`evidence ${item.id}: published without reviewer metadata`)
  if (item.requires_human_review !== false) failures.push(`evidence ${item.id}: published while human review is still required`)
  if (Number(item.confidence_score) < 90) failures.push(`evidence ${item.id}: published confidence below 90`)
  if (!item.source_url?.startsWith("https://") || internalSourcePattern.test(item.source_url)) failures.push(`evidence ${item.id}: published from internal/non-public source`)
  if (!isDirectCreatorEvidenceSource(item.source_platform, item.source_url, item.source_post_id)) {
    failures.push(`evidence ${item.id}: source is not the direct creator clip or post id does not match`)
  }
  const sourcePost = sourcePostByCreatorAndId.get(`${item.creator_id}:${item.source_post_id}`)
  if (!sourcePost || sourcePost.source_url !== item.source_url) {
    failures.push(`evidence ${item.id}: source URL does not match the archived source post`)
  }
  if (!Array.isArray(item.evidence_spans) || item.evidence_spans.length === 0) failures.push(`evidence ${item.id}: published without localized evidence span`)
}

for (const candidate of candidates ?? []) {
  if (["ready_to_create", "merged", "rejected"].includes(candidate.status) && (!candidate.reviewed_by || !candidate.reviewed_at)) {
    failures.push(`candidate ${candidate.id}: reviewed state missing reviewer metadata`)
  }
  if (candidate.status === "merged" && !candidate.matched_product_id) failures.push(`candidate ${candidate.id}: merged without product`)
}

const approvedCounts = new Map<string, number>()
for (const rating of ratings ?? []) approvedCounts.set(rating.product_id, (approvedCounts.get(rating.product_id) ?? 0) + 1)
for (const product of products ?? []) {
  if (product.status === "published" && (approvedCounts.get(product.id) ?? 0) === 0 && Number(product.rating) > 0) {
    failures.push(`product ${product.id}: legacy score present with zero approved reviews`)
  }
}

if (failures.length > 0) {
  console.error(`Data integrity failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Data integrity passed: ${offers?.length ?? 0} offers, ${events?.length ?? 0} events, ${evidence?.length ?? 0} evidence rows, ${candidates?.length ?? 0} candidates and ${products?.length ?? 0} products checked.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
