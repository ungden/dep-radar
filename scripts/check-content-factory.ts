import assert from "node:assert/strict"
import fs from "node:fs"

import {
  classifyRisk,
  contentSimilarity,
  deterministicQuality,
  publicationPolicy,
  sourcePolicy,
  stableHash,
} from "../lib/content-factory/policy"
import { getPublishedEditorialPosts } from "../lib/editorial"
import type { BudgetStatus, FactorySource, StructuredDraft, VerificationResult } from "../lib/content-factory/types"

const migration = fs.readFileSync("supabase/migrations/20260828095919_content_factory_foundation.sql", "utf8")
const collectorPilotMigration = fs.readFileSync("supabase/migrations/20260828102613_activate_cost_safe_collector_pilot.sql", "utf8")
const pipeline = fs.readFileSync("lib/content-factory/pipeline.ts", "utf8")
const gemini = fs.readFileSync("lib/content-factory/gemini.ts", "utf8")
const route = fs.readFileSync("app/api/cron/content-factory/route.ts", "utf8")
const vercel = fs.readFileSync("vercel.json", "utf8")
const data = fs.readFileSync("lib/data.ts", "utf8")
const adminLayout = fs.readFileSync("app/admin/layout.tsx", "utf8")

for (const table of ["content_signals", "content_jobs", "content_versions", "content_sources", "content_claims", "content_runs", "content_performance_daily"]) {
  assert.match(migration, new RegExp(`create table if not exists public\\.${table}`), `missing ${table}`)
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`), `RLS missing for ${table}`)
}
assert.ok(migration.includes("pgmq.create('content_pipeline')"))
assert.ok(migration.includes("content_versions are append-only"))
assert.ok(migration.includes("status = 'published'"))
assert.ok(migration.includes("for select to anon, authenticated using (status = 'published')"))
assert.ok(!migration.includes("grant execute on all functions in schema pgmq"))
assert.ok(migration.includes("revoke all on function public.content_factory_queue_read"))
assert.ok(migration.includes("grant execute on function public.content_factory_queue_read(integer, integer) to service_role"))
assert.ok(collectorPilotMigration.includes("collection_mode = 'webhook'"))
assert.ok(collectorPilotMigration.includes("collection_mode in ('youtube_api', 'paid_provider')"))
assert.ok(!collectorPilotMigration.includes("collection_mode in ('webhook', 'paid_provider')"))
assert.ok(collectorPilotMigration.includes("ranked.pilot_rank <= 20"))

assert.equal(classifyRisk("Son dưỡng dùng hằng ngày"), "low")
assert.equal(classifyRisk("So sánh retinol cho da mụn"), "medium")
assert.equal(classifyRisk("Laser điều trị nám khi mang thai"), "high")
assert.equal(sourcePolicy("https://www.fda.gov/cosmetics").tier, "A")
assert.equal(stableHash("same"), stableHash("same"))
assert.ok(contentSimilarity("routine da mun nhay cam", "routine da mun nhay cam") > 0.99)

const draft: StructuredDraft = {
  title: "Cách đọc bằng chứng sản phẩm làm đẹp", slug: "cach-doc-bang-chung-san-pham-lam-dep", excerpt: "Hướng dẫn ra quyết định dựa trên nguồn.",
  content: Array.from({ length: 720 }, (_, index) => `từ${index}`).join(" "), hubSlug: "product-radar", intent: "decision", contentFormat: "guide", category: "Product Radar",
  tags: ["evidence", "sản phẩm", "quyết định"], image: "/brand/social-share.jpg", takeaways: ["Một", "Hai", "Ba"],
  faq: [{ question: "A?", answer: "A." }, { question: "B?", answer: "B." }], medicalDisclaimerLevel: "light", productIds: [], internalLinkSlugs: [],
  claims: [{ key: "c1", text: "Claim", type: "fact", riskLevel: "medium", sourceUrls: ["https://www.fda.gov/cosmetics"] }],
}
const sources: FactorySource[] = [
  { url: "https://www.fda.gov/cosmetics", title: "FDA", publisher: "FDA", sourceType: "regulator", tier: "A", accessible: true, official: true, regulatorOrProfessional: true, excerpt: "Evidence" },
  { url: "https://www.aad.org/public", title: "AAD", publisher: "AAD", sourceType: "professional", tier: "A", accessible: true, official: true, regulatorOrProfessional: true, excerpt: "Evidence" },
]
const verifier: VerificationResult = { score: 97, summary: "pass", claims: [{ key: "c1", text: "Claim", type: "fact", riskLevel: "high", sourceUrls: [sources[0].url], status: "supported", confidence: 98 }], unsupportedClaims: [], contradictoryClaims: [], policyFlags: [] }
const budget: BudgetStatus = { monthlyLimitUsd: 25, warningRatio: 0.8, spentUsd: 2, ratio: 0.08, categorySpend: { ai_text: 2, collection: 0, image: 0, reserve: 0 }, stopNewPaidWork: false, stopAllPaidWork: false }
const deterministic = deterministicQuality({ draft, sources, similarity: 0.2, duplicateSlug: false, invalidAffiliateLinks: [] })
assert.equal(deterministic.score, 100)
assert.equal(publicationPolicy({ riskLevel: "high", sources, deterministicScore: deterministic.score, deterministicReasons: [], verifier, similarity: 0.2, budget }).pass, true)
assert.equal(publicationPolicy({ riskLevel: "high", sources: sources.slice(0, 1), deterministicScore: 100, deterministicReasons: [], verifier, similarity: 0.2, budget }).pass, false)
assert.equal(publicationPolicy({ riskLevel: "medium", sources, deterministicScore: 100, deterministicReasons: [], verifier: { ...verifier, score: 89 }, similarity: 0.2, budget }).pass, false)
assert.equal(publicationPolicy({ riskLevel: "low", sources, deterministicScore: 100, deterministicReasons: [], verifier, similarity: 0.2, budget: { ...budget, stopAllPaidWork: true } }).pass, false)

assert.ok(gemini.includes(":generateContent"))
assert.ok(!gemini.includes("/v1beta/interactions"))
assert.ok(gemini.includes("assertContentProviderReady"))
assert.ok(gemini.includes("idempotencyKey"))
assert.ok(pipeline.includes("generateDraft"))
assert.ok(pipeline.includes("verifyDraft"))
assert.ok(pipeline.indexOf("generateDraft") < pipeline.lastIndexOf("verifyDraft"))
assert.ok(pipeline.includes("invalidAffiliateLinks"))
assert.ok(pipeline.includes('match_status === "exact"'))
assert.ok(pipeline.includes("minimumSourcesSatisfied"))
assert.ok(route.includes("assertCronSecret"))
assert.ok(route.includes("revalidatePath"))
assert.ok(vercel.includes('"schedule": "15 * * * *"'))
assert.ok(!data.includes("CANONICAL_EDITORIAL_SLUGS.has(post.slug)"))
assert.ok(adminLayout.includes("auth.getUser"))
assert.ok(adminLayout.includes('rpc("is_admin")'))

const posts = getPublishedEditorialPosts()
assert.equal(posts.length, 112)
assert.equal(new Set(posts.map((post) => post.slug)).size, 112)
assert.equal(new Set(posts.map((post) => post.hubSlug)).size, 14)
assert.ok(posts.every((post) => post.image && post.sourceNotes?.length))

console.log(JSON.stringify({
  ok: true,
  registryPosts: posts.length,
  hubs: new Set(posts.map((post) => post.hubSlug)).size,
  stages: ["signal", "queue", "research", "draft", "verify", "publishable", "publish"],
  policy: { low: 85, medium: 90, high: 95, maxSimilarity: 0.82, budgetUsd: 25 },
}, null, 2))
