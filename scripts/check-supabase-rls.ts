import "./load-local-env"

import { createClient } from "@supabase/supabase-js"
import { isDirectCreatorEvidenceSource } from "../lib/evidence-source"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceKey) throw new Error("check:rls requires Supabase URL, anon key and service role key")

const anon = createClient(url, anonKey, { auth: { persistSession: false } })
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {

const [anonOffers, anonEvents, anonStates, anonCreators, anonCandidates, anonCandidateSources, rawOffers, rawEvents, rawCreators, rawCandidates] = await Promise.all([
  anon.from("product_offers").select("*"),
  anon.from("creator_product_events").select("*"),
  anon.from("creator_product_states").select("*"),
  anon.from("kols").select("id,directory_status"),
  anon.from("product_candidates").select("id"),
  anon.from("product_candidate_sources").select("candidate_id"),
  admin.from("product_offers").select("id"),
  admin.from("creator_product_events").select("id"),
  admin.from("kols").select("id,directory_status"),
  admin.from("product_candidates").select("id"),
])

for (const result of [anonOffers, anonEvents, anonStates, anonCreators, rawOffers, rawEvents, rawCreators, rawCandidates]) {
  if (result.error) throw result.error
}

function assertPrivateTable(result: { data: unknown[] | null; error: { code?: string; message?: string } | null }, table: string) {
  if (result.error) {
    if (!["42501", "PGRST301"].includes(result.error.code ?? "")) throw result.error
    return
  }
  if ((result.data?.length ?? 0) > 0) throw new Error(`RLS leaked private ${table} rows`)
}

assertPrivateTable(anonCandidates, "product_candidates")
assertPrivateTable(anonCandidateSources, "product_candidate_sources")

const invalidOffer = (anonOffers.data ?? []).find((offer) => offer.verification_status !== "verified" || offer.match_status !== "exact" || offer.is_active !== true || !offer.verified_by || !offer.verified_at)
const invalidEvent = (anonEvents.data ?? []).find((event) => event.verification_status !== "verified" || !event.verified_by || !event.verified_at || !event.evidence_id || event.exact_sku_verified !== true || Number(event.confidence_score) < 90 || !Array.isArray(event.evidence_spans) || event.evidence_spans.length === 0 || !isDirectCreatorEvidenceSource(event.source_platform, event.source_url, event.source_post_id))
if (invalidOffer) throw new Error(`RLS leaked unqualified offer ${invalidOffer.id}`)
if (invalidEvent) throw new Error(`RLS leaked unqualified creator event ${invalidEvent.id}`)
if ((anonStates.data?.length ?? 0) > (anonEvents.data?.length ?? 0)) throw new Error("RLS leaked a creator state without a readable audited event")
if ((anonCreators.data ?? []).some((creator) => creator.directory_status !== "active")) throw new Error("RLS leaked a non-active creator profile")
if ((anonCreators.data ?? []).some((creator) => ["3", "13", "16"].includes(creator.id))) throw new Error("RLS leaked an explicitly excluded creator profile")
if ((rawCreators.data?.length ?? 0) <= (anonCreators.data?.length ?? 0)) throw new Error("Admin cannot see historical creator remediation rows")
if ((rawOffers.data?.length ?? 0) === 0 && (rawEvents.data?.length ?? 0) === 0) throw new Error("Admin/service role could not read remediation rows")

console.log(`RLS passed: anon sees ${anonOffers.data?.length ?? 0} offers, ${anonEvents.data?.length ?? 0} events, ${anonStates.data?.length ?? 0} states and ${anonCreators.data?.length ?? 0} active creators; admin sees ${rawCreators.data?.length ?? 0} total creator rows.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
