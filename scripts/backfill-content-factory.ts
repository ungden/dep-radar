import { createHash } from "node:crypto"

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

import { getCanonicalPostSlug, SAMPLE_PRODUCTS } from "../lib/data"
import { getPublishedEditorialPosts } from "../lib/editorial"

dotenv.config({ path: ".env.local" })

const apply = process.argv.includes("--apply")
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const posts = getPublishedEditorialPosts()

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function sourcePolicy(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase()
    const tierA = ["fda.gov", "ftc.gov", "aad.org", "who.int", "nhs.uk", "mayoclinic.org", "ncbi.nlm.nih.gov"]
      .some((domain) => host === domain || host.endsWith(`.${domain}`))
    return { tier: tierA ? "A" : host.endsWith(".edu") || host.endsWith(".org") ? "B" : "C", professional: tierA }
  } catch {
    return { tier: "D", professional: false }
  }
}

const hubs = new Map<string, number>()
for (const post of posts) hubs.set(post.hubSlug ?? "unmapped", (hubs.get(post.hubSlug ?? "unmapped") ?? 0) + 1)

async function main() {
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", registryPosts: posts.length, hubs: Object.fromEntries(hubs) }, null, 2))
if (!apply) return
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply")

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const existingResult = await db.from("posts").select("*")
if (existingResult.error) throw new Error(`Cannot load existing posts: ${existingResult.error.message}`)
const existing = existingResult.data ?? []
const bySlug = new Map(existing.map((post) => [post.slug as string, post]))

const liveProducts = await db.from("radar_products").select("id")
if (liveProducts.error) throw new Error(`Cannot load live products: ${liveProducts.error.message}`)
const sourcedProducts = new Map(SAMPLE_PRODUCTS.filter((product) => product.source_url).map((product) => [product.id, product]))
const PRODUCT_SOURCE_ALIASES: Record<string, string> = {
  "paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-118ml": "paulas-choice-skin-perfecting-2-bha-liquid-exfoliant",
}
let productSourcesUpdated = 0
for (const row of liveProducts.data ?? []) {
  const product = sourcedProducts.get(PRODUCT_SOURCE_ALIASES[String(row.id)] ?? String(row.id))
  if (!product?.source_url) continue
  const update = await db.from("radar_products").update({
    source_label: product.source_label,
    source_url: product.source_url,
    source_type: product.source_type,
    source_last_verified_at: new Date().toISOString(),
  }).eq("id", row.id)
  if (update.error) throw new Error(`Cannot import source for product ${row.id}: ${update.error.message}`)
  productSourcesUpdated += 1
}

const legacyAliases = existing.filter((post) => getCanonicalPostSlug(String(post.slug)) || getCanonicalPostSlug(String(post.id)))
if (legacyAliases.length > 0) {
  const archive = await db.from("posts").update({
    status: "archived",
    provenance: { migration: "content_factory_backfill", reason: "legacy_alias", canonicalized_at: new Date().toISOString() },
  }).in("id", legacyAliases.map((post) => post.id))
  if (archive.error) throw new Error(`Cannot archive legacy alias posts: ${archive.error.message}`)
}

const canonicalIds: string[] = []
for (const article of posts) {
  const existingPost = bySlug.get(article.slug)
  const id = String(existingPost?.id ?? article.id)
  canonicalIds.push(id)
  const payload = {
    id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    author_name: article.author_name,
    author_avatar: article.author_avatar,
    category: article.category,
    tags: article.tags,
    image: article.image,
    likes: Number(existingPost?.likes ?? article.likes ?? 0),
    comments: Number(existingPost?.comments ?? article.comments ?? 0),
    created_at: article.created_at,
    product_ids: article.product_ids,
    hub_slug: article.hubSlug ?? null,
    intent: article.intent ?? "problem-solving",
    risk_level: article.medicalDisclaimerLevel === "medical" ? "high" : article.intent === "safety" ? "high" : "medium",
    content_format: article.contentFormat ?? null,
    condition_slugs: article.conditionSlugs ?? [],
    status: "published",
    takeaways: article.takeaways ?? [],
    faq: article.faq ?? [],
    source_notes: article.sourceNotes ?? [],
    structured_content: {
      takeaways: article.takeaways ?? [],
      faq: article.faq ?? [],
      internalLinkSlugs: article.nextArticleSlugs ?? [],
      productIds: article.product_ids,
    },
    medical_disclaimer_level: article.medicalDisclaimerLevel ?? "none",
    research_stage: article.researchStage ?? null,
    user_question: article.userQuestion ?? null,
    next_article_slugs: article.nextArticleSlugs ?? [],
    product_group_keys: article.productGroupKeys ?? [],
    matrix_product_ids: article.matrixProductIds ?? [],
    kol_ids: article.kolIds ?? [],
    kol_reasons: article.kolReasons ?? {},
    related_node_keys: article.relatedNodeKeys ?? [],
    generation_method: "legacy_registry",
    provenance: { origin: "lib/editorial.ts", import_batch: "content_factory_v1", imported_at: new Date().toISOString() },
    published_at: article.created_at,
    refresh_due_at: new Date(Math.max(Date.now(), new Date(article.created_at).getTime() + 180 * 86_400_000)).toISOString(),
  }
  const upsert = await db.from("posts").upsert(payload, { onConflict: "id" })
  if (upsert.error) throw new Error(`Cannot import ${article.slug}: ${upsert.error.message}`)
}

const versionResult = await db.from("content_versions").select("id,post_id,version_number,snapshot_stage,content_hash").in("post_id", canonicalIds)
if (versionResult.error) throw new Error(`Cannot load imported versions: ${versionResult.error.message}`)
const versionsByPost = new Map<string, Array<Record<string, unknown>>>()
for (const version of versionResult.data ?? []) {
  versionsByPost.set(String(version.post_id), [...(versionsByPost.get(String(version.post_id)) ?? []), version])
}

for (const article of posts) {
  const postId = String(bySlug.get(article.slug)?.id ?? article.id)
  const contentHash = hash({ title: article.title, content: article.content, structured: { takeaways: article.takeaways, faq: article.faq } })
  const existingVersions = versionsByPost.get(postId) ?? []
  let publishedVersion = existingVersions.find((version) => version.snapshot_stage === "published" && version.content_hash === contentHash)
  if (!publishedVersion) {
    const versionNumber = Math.max(0, ...existingVersions.map((version) => Number(version.version_number ?? 0))) + 1
    const inserted = await db.from("content_versions").insert({
      post_id: postId,
      version_number: versionNumber,
      snapshot_stage: "published",
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      structured_content: { takeaways: article.takeaways ?? [], faq: article.faq ?? [], productIds: article.product_ids },
      metadata: { category: article.category, tags: article.tags, image: article.image, medicalDisclaimerLevel: article.medicalDisclaimerLevel ?? "none" },
      risk_level: article.medicalDisclaimerLevel === "medical" || article.intent === "safety" ? "high" : "medium",
      provenance: { origin: "legacy_registry", import_batch: "content_factory_v1" },
      quality_report: { imported: true, pending_refresh_verification: true },
      content_hash: contentHash,
      created_at: article.created_at,
    }).select("id").single()
    if (inserted.error) throw new Error(`Cannot snapshot ${article.slug}: ${inserted.error.message}`)
    publishedVersion = inserted.data
  }
  const point = await db.from("posts").update({ current_version_id: publishedVersion.id }).eq("id", postId)
  if (point.error) throw new Error(`Cannot point ${article.slug} to its version: ${point.error.message}`)

  const sources = (article.sourceNotes ?? []).map((source) => {
    const policy = sourcePolicy(source.url)
    return {
      version_id: publishedVersion.id,
      canonical_url: source.url,
      source_title: source.label,
      publisher: new URL(source.url).hostname,
      source_type: "legacy_editorial_source",
      source_tier: policy.tier,
      accessible: false,
      official: policy.tier === "A",
      regulator_or_professional: policy.professional,
      metadata: { requires_accessibility_refresh: true },
    }
  })
  if (sources.length > 0) {
    const sourceInsert = await db.from("content_sources").upsert(sources, { onConflict: "version_id,canonical_url" })
    if (sourceInsert.error) throw new Error(`Cannot import sources for ${article.slug}: ${sourceInsert.error.message}`)
  }
}

const verification = await db.from("posts").select("id,slug,hub_slug,status,current_version_id").eq("status", "published").in("id", canonicalIds)
if (verification.error) throw new Error(`Cannot verify imported posts: ${verification.error.message}`)
const finalHubs = new Set((verification.data ?? []).map((post) => post.hub_slug))
if ((verification.data ?? []).length !== posts.length) throw new Error(`Backfill count mismatch: expected ${posts.length}, received ${verification.data?.length ?? 0}`)
if (finalHubs.size !== hubs.size) throw new Error(`Hub count mismatch: expected ${hubs.size}, received ${finalHubs.size}`)
if ((verification.data ?? []).some((post) => !post.current_version_id)) throw new Error("At least one imported post has no published version")

console.log(JSON.stringify({ imported: verification.data?.length, archivedAliases: legacyAliases.length, productSourcesUpdated, hubs: finalHubs.size, ok: true }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
