import "./load-local-env"

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error("check:data-integrity requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {

const [{ data: offers, error: offerError }, { data: events, error: eventError }, { data: products, error: productError }, { data: ratings, error: ratingError }] = await Promise.all([
  db.from("product_offers").select("*"),
  db.from("creator_product_events").select("*"),
  db.from("radar_products").select("id,name,brand,rating,reviews,status"),
  db.from("user_ratings").select("product_id,rating,status").eq("status", "approved"),
])

for (const error of [offerError, eventError, productError, ratingError]) {
  if (error) throw error
}

const failures: string[] = []
const searchUrlPattern = /(?:\/search|search\?|keyword=|[?&](?:q|query)=)/i
const internalSourcePattern = /^https:\/\/(?:www\.)?360dep\.vn(?:\/|$)/i

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

console.log(`Data integrity passed: ${offers?.length ?? 0} raw offers, ${events?.length ?? 0} raw creator events, ${products?.length ?? 0} products checked.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
