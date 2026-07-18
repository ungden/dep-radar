import "./load-local-env"

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceKey) throw new Error("check:rls requires Supabase URL, anon key and service role key")

const anon = createClient(url, anonKey, { auth: { persistSession: false } })
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {

const [anonOffers, anonEvents, anonStates, rawOffers, rawEvents] = await Promise.all([
  anon.from("product_offers").select("*"),
  anon.from("creator_product_events").select("*"),
  anon.from("creator_product_states").select("*"),
  admin.from("product_offers").select("id"),
  admin.from("creator_product_events").select("id"),
])

for (const result of [anonOffers, anonEvents, anonStates, rawOffers, rawEvents]) {
  if (result.error) throw result.error
}

const invalidOffer = (anonOffers.data ?? []).find((offer) => offer.verification_status !== "verified" || offer.match_status !== "exact" || offer.is_active !== true || !offer.verified_by || !offer.verified_at)
const invalidEvent = (anonEvents.data ?? []).find((event) => event.verification_status !== "verified" || !event.verified_by || !event.verified_at || !event.evidence_id)
if (invalidOffer) throw new Error(`RLS leaked unqualified offer ${invalidOffer.id}`)
if (invalidEvent) throw new Error(`RLS leaked unqualified creator event ${invalidEvent.id}`)
if ((anonStates.data?.length ?? 0) > (anonEvents.data?.length ?? 0)) throw new Error("RLS leaked a creator state without a readable audited event")
if ((rawOffers.data?.length ?? 0) === 0 && (rawEvents.data?.length ?? 0) === 0) throw new Error("Admin/service role could not read remediation rows")

console.log(`RLS passed: anon sees ${anonOffers.data?.length ?? 0} offers, ${anonEvents.data?.length ?? 0} events, ${anonStates.data?.length ?? 0} states; admin sees raw rows.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
