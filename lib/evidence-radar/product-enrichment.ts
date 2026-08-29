import "server-only"

import { createHash } from "node:crypto"

import { getProductCategory } from "@/lib/product-taxonomy"
import { getBudgetStatus } from "@/lib/content-factory/budget"
import { publishVerifiedClaim } from "@/lib/evidence-radar/publisher"
import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import type { EvidenceClaim, ProductCandidate, SourcePost } from "@/lib/types"

const MAX_ATTEMPTS = 3

type ResolvedSource = {
  officialUrl: string
  imageUrl: string
  sourceDomain: string
  facts: Record<string, unknown>
  citations: Array<Record<string, unknown>>
  usage: Record<string, unknown>
}

function normalized(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, " ").trim()
}

function slug(value: string) {
  return normalized(value).replace(/\s+/g, "-").replace(/^-|-$/g, "").slice(0, 120)
}

function responseText(payload: unknown) {
  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })?.candidates
  return candidates?.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").join("") ?? ""
}

function safePublicUrl(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== "https:" || host === "localhost" || host.endsWith(".local") || /^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null
    return url
  } catch {
    return null
  }
}

function findMetaImage(html: string, base: URL) {
  const match = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/iu)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/iu)
  if (!match?.[1]) return null
  try {
    const image = new URL(match[1], base)
    return image.protocol === "https:" ? image.toString() : null
  } catch {
    return null
  }
}

function exactCandidateOnPage(candidate: Pick<ProductCandidate, "brand" | "product_name" | "variant">, html: string) {
  const page = normalized(html.slice(0, 120_000))
  const brand = normalized(candidate.brand)
  const productTokens = normalized(candidate.product_name).split(" ").filter((token) => token.length >= 3)
  const variantTokens = normalized(candidate.variant ?? "").split(" ").filter((token) => token.length >= 2)
  return Boolean(brand) && page.includes(brand) && productTokens.length > 0 && productTokens.every((token) => page.includes(token))
    && (variantTokens.length === 0 || variantTokens.every((token) => page.includes(token)))
}

async function fetchOfficialPage(candidate: Pick<ProductCandidate, "brand" | "product_name" | "variant">, urlValue: string, citations: Array<Record<string, unknown>>, usage: Record<string, unknown>): Promise<ResolvedSource | null> {
  const url = safePublicUrl(urlValue)
  if (!url) return null
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "360dep-ProductVerifier/1.0 (+https://www.360dep.vn)" },
    signal: AbortSignal.timeout(20_000),
  })
  const contentType = response.headers.get("content-type") ?? ""
  if (!response.ok || !/text\/html|application\/ld\+json/i.test(contentType)) return null
  const html = (await response.text()).slice(0, 120_000)
  if (!exactCandidateOnPage(candidate, html)) return null
  const imageUrl = findMetaImage(html, response.url ? new URL(response.url) : url)
  if (!imageUrl) return null
  const officialUrl = response.url || url.toString()
  return {
    officialUrl,
    imageUrl,
    sourceDomain: new URL(officialUrl).hostname.toLowerCase(),
    facts: { brand: candidate.brand, product_name: candidate.product_name, variant: candidate.variant, title: html.match(/<title[^>]*>([^<]+)/iu)?.[1]?.trim() ?? null },
    citations,
    usage,
  }
}

async function discoverOfficialSource(candidate: Pick<ProductCandidate, "brand" | "product_name" | "variant">): Promise<ResolvedSource | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key || process.env.PRODUCT_ENRICHMENT_SEARCH_ENABLED !== "true") return null
  const model = (process.env.PRODUCT_ENRICHMENT_GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "")
  const prompt = [
    "Find one official brand product page for this exact beauty SKU. Return JSON only: {\"official_url\":string|null}.",
    "Reject retailers, marketplaces, social profiles, category pages, and a different size/shade/variant.",
    `Brand: ${candidate.brand}`,
    `Product: ${candidate.product_name}`,
    `Variant: ${candidate.variant ?? "(none)"}`,
  ].join("\n")
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(90_000),
  })
  if (!response.ok) return null
  const payload = await response.json() as Record<string, unknown>
  let officialUrl = ""
  try { officialUrl = String((JSON.parse(responseText(payload)) as { official_url?: unknown }).official_url ?? "") } catch { return null }
  const metadata = (payload.candidates as Array<{ groundingMetadata?: { groundingChunks?: Array<Record<string, unknown>> } }> | undefined)?.[0]?.groundingMetadata
  const citations = metadata?.groundingChunks ?? []
  return fetchOfficialPage(candidate, officialUrl, citations, { model, grounding_used: true, usage: payload.usageMetadata ?? {} })
}

export async function enqueueProductEnrichment(candidateId: string, sourcePostId: string | null, versionKey: string) {
  const supabase = getSupabaseAdmin()
  const idempotencyKey = `product-enrichment:${candidateId}:${versionKey}`
  const { data, error } = await supabase.from("product_enrichment_jobs").upsert({
    candidate_id: candidateId,
    source_post_id: sourcePostId,
    idempotency_key: idempotencyKey,
    status: "queued",
    max_attempts: MAX_ATTEMPTS,
  }, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("id").maybeSingle()
  if (error) throw new Error(`Cannot enqueue product enrichment: ${error.message}`)
  if (data?.id) {
    const { error: queueError } = await supabase.rpc("product_enrichment_queue_send", { job_id: data.id, idempotency_key: idempotencyKey })
    if (queueError) throw new Error(`Cannot send product enrichment queue message: ${queueError.message}`)
  }
  return data?.id ?? null
}

async function setJobState(jobId: string, candidateId: string, status: string, values: Record<string, unknown> = {}) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from("product_enrichment_jobs").update({ status, completed_at: ["verified", "needs_official_source", "policy_blocked"].includes(status) ? new Date().toISOString() : null, ...values }).eq("id", jobId)
  if (error) throw new Error(error.message)
  const { error: candidateError } = await supabase.from("product_candidates").update({ status, ...(status === "verified" ? { system_verified_at: new Date().toISOString() } : {}), last_enrichment_error: typeof values.last_error === "string" ? values.last_error : null, updated_at: new Date().toISOString() }).eq("id", candidateId)
  if (candidateError) throw new Error(candidateError.message)
}

function autoPublishEnabled() {
  return process.env.PRODUCT_ENRICHMENT_AUTO_PUBLISH === "true"
    && process.env.EVIDENCE_RADAR_AUTO_PUBLISH === "true"
    && Number(process.env.EVIDENCE_RADAR_GOLDEN_SAMPLE_COUNT || 0) >= 500
    && Boolean(process.env.EVIDENCE_RADAR_SYSTEM_REVIEWER_ID)
}

function matchesCandidate(claim: EvidenceClaim, candidate: Pick<ProductCandidate, "brand" | "product_name" | "variant">) {
  return normalized(claim.brand) === normalized(candidate.brand)
    && normalized(claim.product_name) === normalized(candidate.product_name)
    && normalized(claim.variant ?? "") === normalized(candidate.variant ?? "")
}

async function publishCandidateEvidence(candidate: ProductCandidate, productId: string) {
  const reviewerId = process.env.EVIDENCE_RADAR_SYSTEM_REVIEWER_ID
  if (!reviewerId) return 0
  const supabase = getSupabaseAdmin()
  const { data: sources, error: sourcesError } = await supabase
    .from("product_candidate_sources")
    .select("evidence_id,source_post_id")
    .eq("candidate_id", candidate.id)
    .not("evidence_id", "is", null)
  if (sourcesError) throw new Error(`Cannot read candidate evidence: ${sourcesError.message}`)

  let published = 0
  for (const source of sources ?? []) {
    if (!source.evidence_id || !source.source_post_id) continue
    const [{ data: evidence, error: evidenceError }, { data: post, error: postError }] = await Promise.all([
      supabase.from("creator_evidence_items").select("extracted_claims").eq("id", source.evidence_id).maybeSingle(),
      supabase.from("source_posts").select("*").eq("id", source.source_post_id).maybeSingle(),
    ])
    if (evidenceError || postError) throw new Error(evidenceError?.message || postError?.message || "Cannot load candidate source")
    const claims = Array.isArray(evidence?.extracted_claims) ? evidence.extracted_claims as EvidenceClaim[] : []
    const matchingClaims = claims.filter((claim) => matchesCandidate(claim, candidate))
    if (!post || matchingClaims.length === 0) continue
    // Do not change a shared evidence record while it still contains another
    // unresolved candidate. The resolved product can be requeued later.
    if (claims.some((claim) => !matchesCandidate(claim, candidate) && !claim.matched_product_id)) continue
    const enrichedClaims = claims.map((claim) => matchesCandidate(claim, candidate)
      ? { ...claim, matched_product_id: productId, risk_flags: claim.risk_flags.filter((flag) => flag !== "product_not_in_catalogue") }
      : claim)
    const { error: evidenceUpdateError } = await supabase.from("creator_evidence_items").update({
      extracted_claims: enrichedClaims,
      candidate_product_ids: Array.from(new Set(enrichedClaims.map((claim) => claim.matched_product_id).filter(Boolean))),
      candidate_product_names: Array.from(new Set(enrichedClaims.map((claim) => `${claim.brand} ${claim.product_name}`.trim()))),
    }).eq("id", source.evidence_id)
    if (evidenceUpdateError) throw new Error(`Cannot update enriched evidence: ${evidenceUpdateError.message}`)
    for (const claim of enrichedClaims.filter((item) => matchesCandidate(item, candidate))) {
      await publishVerifiedClaim(source.evidence_id, post as SourcePost, claim, "system", reviewerId)
      published += 1
    }
  }
  return published
}

async function materializeVerifiedProduct(candidate: ProductCandidate, job: Record<string, unknown>) {
  if (!autoPublishEnabled() || !candidate.official_product_url || !candidate.image_source_url) return null
  const supabase = getSupabaseAdmin()
  const productId = productIdForCandidate(candidate)
  const category = getProductCategory("skincare")
  const fullName = `${candidate.product_name}${candidate.variant ? ` ${candidate.variant}` : ""}`.trim()
  const provenance = candidate.verification_metadata ?? {}
  const { error: productError } = await supabase.from("radar_products").upsert({
    id: productId,
    name: fullName,
    brand: candidate.brand,
    image: candidate.image_source_url,
    rating: null,
    reviews: 0,
    sold: "Đang cập nhật",
    price: "Đang cập nhật",
    category: category?.displayCategory ?? "Skincare",
    tags: [],
    description: "Sản phẩm được xác minh từ evidence creator và trang chính thức của thương hiệu.",
    affiliate_url: null,
    category_key: "skincare",
    subcategory_key: category?.subcategories[0]?.key ?? null,
    concern_tags: [],
    ingredient_tags: [],
    aliases: Array.from(new Set([...(candidate.aliases ?? []), candidate.product_name, `${candidate.brand} ${fullName}`])),
    status: "published",
    source_label: `${candidate.brand} official product page`,
    source_url: candidate.official_product_url,
    source_type: "official",
    source_last_verified_at: new Date().toISOString(),
    provenance,
  }, { onConflict: "id" })
  if (productError) throw new Error(`Cannot create verified product: ${productError.message}`)
  const sourceDomain = new URL(candidate.official_product_url).hostname.toLowerCase()
  const { error: provenanceError } = await supabase.from("product_source_provenance").upsert({
    product_id: productId,
    candidate_id: candidate.id,
    enrichment_job_id: job.id,
    source_url: candidate.official_product_url,
    source_domain: sourceDomain,
    source_type: "official",
    image_url: candidate.image_source_url,
    extracted_facts: (provenance.facts as Record<string, unknown> | undefined) ?? {},
    citations: Array.isArray(provenance.citations) ? provenance.citations : [],
    content_hash: createHash("sha256").update(JSON.stringify(provenance)).digest("hex"),
  }, { onConflict: "product_id,source_url" })
  if (provenanceError) throw new Error(`Cannot store product provenance: ${provenanceError.message}`)
  const { error: candidateError } = await supabase.from("product_candidates").update({ matched_product_id: productId, updated_at: new Date().toISOString() }).eq("id", candidate.id)
  if (candidateError) throw new Error(candidateError.message)
  await publishCandidateEvidence(candidate, productId)
  return productId
}

export async function processProductEnrichment(jobId: string) {
  const supabase = getSupabaseAdmin()
  const { data: job, error: jobError } = await supabase.from("product_enrichment_jobs").select("*").eq("id", jobId).maybeSingle()
  if (jobError || !job) throw new Error(jobError?.message || "Product enrichment job not found")
  const { data: candidate, error: candidateError } = await supabase.from("product_candidates").select("*").eq("id", job.candidate_id).single()
  if (candidateError || !candidate) throw new Error(candidateError?.message || "Product candidate not found")
  if (job.status === "verified") {
    const productId = await materializeVerifiedProduct(candidate as ProductCandidate, job as Record<string, unknown>)
    return { skipped: !productId, status: "verified", productId }
  }
  if (job.status === "policy_blocked") return { skipped: true, status: job.status }
  const budget = await getBudgetStatus()
  if (budget.stopNewPaidWork) {
    await setJobState(job.id, candidate.id, "policy_blocked", { last_error: "monthly_budget_warning" })
    return { skipped: true, status: "policy_blocked", reason: "monthly_budget_warning" }
  }
  const nextAttempt = Number(job.attempt_count ?? 0) + 1
  await supabase.from("product_enrichment_jobs").update({ status: "processing", attempt_count: nextAttempt, lease_expires_at: new Date(Date.now() + 10 * 60_000).toISOString() }).eq("id", job.id).eq("status", job.status)
  await supabase.from("product_candidates").update({ status: "enriching", updated_at: new Date().toISOString() }).eq("id", candidate.id)
  try {
    const existingUrl = typeof candidate.official_product_url === "string" ? candidate.official_product_url : ""
    const source = (existingUrl ? await fetchOfficialPage(candidate, existingUrl, [], { cache_hit: true }) : null) ?? await discoverOfficialSource(candidate)
    if (!source) {
      const status = nextAttempt >= Math.min(Number(job.max_attempts ?? MAX_ATTEMPTS), MAX_ATTEMPTS) ? "policy_blocked" : "needs_official_source"
      await setJobState(job.id, candidate.id, status, { last_error: "exact_official_source_not_found" })
      return { status, candidateId: candidate.id }
    }
    const metadata = { source_domain: source.sourceDomain, facts: source.facts, citations: source.citations, usage: source.usage }
    await supabase.from("product_candidates").update({
      status: "verified", official_product_url: source.officialUrl, image_source_url: source.imageUrl,
      verification_metadata: metadata, system_verified_at: new Date().toISOString(), last_enrichment_error: null, updated_at: new Date().toISOString(),
    }).eq("id", candidate.id)
    await supabase.from("product_enrichment_jobs").update({ status: "verified", official_url: source.officialUrl, image_url: source.imageUrl, source_domain: source.sourceDomain, extracted_facts: source.facts, citations: source.citations, usage_metadata: source.usage, completed_at: new Date().toISOString(), lease_expires_at: null }).eq("id", job.id)
    const productId = await materializeVerifiedProduct({ ...candidate, official_product_url: source.officialUrl, image_source_url: source.imageUrl, verification_metadata: metadata } as ProductCandidate, job as Record<string, unknown>)
    return { status: "verified", candidateId: candidate.id, source: source.officialUrl, productId }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status = nextAttempt >= Math.min(Number(job.max_attempts ?? MAX_ATTEMPTS), MAX_ATTEMPTS) ? "failed" : "queued"
    await supabase.from("product_enrichment_jobs").update({ status, last_error: message, lease_expires_at: null }).eq("id", job.id)
    await supabase.from("product_candidates").update({ status: status === "failed" ? "failed" : "needs_official_source", last_enrichment_error: message, updated_at: new Date().toISOString() }).eq("id", candidate.id)
    throw error
  }
}

export function productIdForCandidate(candidate: Pick<ProductCandidate, "brand" | "product_name" | "variant">) {
  const value = slug([candidate.brand, candidate.product_name, candidate.variant ?? ""].filter(Boolean).join("-"))
  return value || createHash("sha256").update(JSON.stringify(candidate)).digest("hex").slice(0, 24)
}
