import "./load-local-env"

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { createClient } from "@supabase/supabase-js"

import { buildProductObservationSummary } from "@/lib/product-observation"
import type { CreatorProductEvent, Product } from "@/lib/types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) throw new Error("export:affiliate-evidence requires Supabase URL and service role key")

const db = createClient(url, serviceKey, { auth: { persistSession: false } })

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

async function main() {
  const [{ data: products, error: productError }, { data: events, error: eventError }, { data: offers, error: offerError }] = await Promise.all([
    db.from("radar_products").select("*").eq("status", "published"),
    db.from("creator_product_events").select("*").eq("verification_status", "verified"),
    db.from("product_offers").select("product_id,verification_status,match_status,is_active,affiliate_url"),
  ])
  for (const error of [productError, eventError, offerError]) if (error) throw error

  const verifiedOfferProducts = new Set((offers ?? [])
    .filter((offer) => offer.verification_status === "verified" && offer.match_status === "exact" && offer.is_active && offer.affiliate_url?.startsWith("https://"))
    .map((offer) => offer.product_id))
  const eventsByProduct = new Map<string, CreatorProductEvent[]>()
  for (const event of (events ?? []) as CreatorProductEvent[]) {
    const list = eventsByProduct.get(event.product_id) ?? []
    list.push(event)
    eventsByProduct.set(event.product_id, list)
  }

  const rows = ((products ?? []) as Product[])
    .filter((product) => !verifiedOfferProducts.has(product.id))
    .map((product) => {
      const observation = buildProductObservationSummary(eventsByProduct.get(product.id) ?? [])
      return [product.id, product.brand, product.name, product.category, observation.independentCreatorCount, observation.verifiedClipCount, observation.directUseCount, observation.commercialShare, observation.latestEvidenceAt ?? "", "", "pending"]
    })
    .sort((a, b) => Number(b[4]) - Number(a[4]) || Number(b[5]) - Number(a[5]))

  const outputArg = process.argv.find((arg) => arg.startsWith("--output="))?.slice("--output=".length)
  const output = path.resolve(outputArg || `docs/affiliate/evidence-products-${new Date().toISOString().slice(0, 10)}.csv`)
  await mkdir(path.dirname(output), { recursive: true })
  const header = ["product_id", "brand", "product_name", "category", "independent_creators", "verified_clips", "direct_use_clips", "commercial_share_pct", "latest_evidence_at", "affiliate_url", "offer_status"]
  await writeFile(output, [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n", "utf8")
  console.log(`Exported ${rows.length} products without verified exact-SKU offers to ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
