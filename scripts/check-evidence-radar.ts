import assert from "node:assert/strict"
import fs from "node:fs"

import { SYNTHETIC_GOLDEN_CASES } from "../lib/evidence-radar/golden-cases"
import { deriveCreatorProductState, isPublicEvidenceEvent } from "../lib/evidence-radar/state-engine"
import type { CreatorProductEvent, CreatorProductEventType } from "../lib/types"

const NOW = new Date("2026-07-10T12:00:00Z")

function event(overrides: Partial<CreatorProductEvent> & { event_type: CreatorProductEventType; event_date: string }): CreatorProductEvent {
  return {
    id: crypto.randomUUID(),
    creator_id: "creator-1",
    product_id: "product-1",
    observed_at: `${overrides.event_date}T12:00:00Z`,
    source_platform: "TikTok",
    source_url: "https://www.tiktok.com/@creator/video/1",
    source_title: "Evidence",
    source_excerpt: "Direct public evidence",
    sentiment: "neutral",
    disclosure: "organic",
    usage_context: null,
    evidence_note: "Golden check",
    confidence: "high",
    confidence_score: 95,
    verification_status: "verified",
    ...overrides,
  }
}

assert.equal(deriveCreatorProductState([event({ event_type: "used", event_date: "2026-06-20" })], NOW).state, "current")
assert.equal(deriveCreatorProductState([event({ event_type: "repurchased", event_date: "2026-04-20" })], NOW).state, "current")
assert.equal(deriveCreatorProductState([event({ event_type: "reviewed", event_date: "2026-07-01" })], NOW).state, "reviewed_only")
assert.equal(deriveCreatorProductState([event({ event_type: "sponsored", event_date: "2026-07-01" })], NOW).state, "promoted_only")
assert.equal(deriveCreatorProductState([event({ event_type: "stopped_using", event_date: "2026-07-01" })], NOW).state, "past")
assert.equal(deriveCreatorProductState([event({ event_type: "used", event_date: "2026-02-01" })], NOW).state, "recently_used")
assert.equal(deriveCreatorProductState([event({ event_type: "used", event_date: "2025-12-01" })], NOW).state, "past")
assert.equal(isPublicEvidenceEvent(event({ event_type: "used", event_date: "2026-07-01", confidence_score: 69 })), false)
assert.equal(isPublicEvidenceEvent(event({ event_type: "used", event_date: "2026-07-01", source_url: null })), false)
assert.equal(isPublicEvidenceEvent(event({ event_type: "used", event_date: "2026-07-01" })), true)

assert.equal(SYNTHETIC_GOLDEN_CASES.length, 500)
assert.equal(new Set(SYNTHETIC_GOLDEN_CASES.map((item) => item.creatorId)).size, 50)
for (const scenario of ["explicit-current-routine", "review-only", "sponsored", "background-only", "ambiguous-bundle", "stopped"]) {
  assert.ok(SYNTHETIC_GOLDEN_CASES.some((item) => item.scenario === scenario), `Missing scenario ${scenario}`)
}

const migration = fs.readFileSync("supabase/migrations/20260710092855_evidence_radar_foundation.sql", "utf8")
const queueMigration = fs.readFileSync("supabase/migrations/20260710093313_evidence_radar_service_queue_rpc.sql", "utf8")
for (const required of [
  "creator_accounts", "source_posts", "creator_product_states", "evidence_audit_log",
  "pgmq.create('creator_monitor')", "pgmq.create('evidence_analysis')",
  "enable row level security", "private.recompute_creator_product_state",
  "evidence-radar-enqueue-due-accounts", "evidence-radar-run-worker",
]) {
  assert.ok(migration.includes(required), `Migration missing ${required}`)
}
assert.ok(!migration.includes("grant execute on all functions in schema pgmq_public to anon"))
assert.ok(!migration.includes("grant execute on all functions in schema pgmq_public to authenticated"))
assert.ok(queueMigration.includes("security invoker"))
assert.ok(queueMigration.includes("evidence_radar_queue_read"))
assert.ok(queueMigration.includes("evidence_radar_queue_delete"))
assert.ok(!queueMigration.includes("security definer"))
assert.ok(!queueMigration.includes("to anon"))

console.log(JSON.stringify({
  ok: true,
  stateEngineCases: 10,
  syntheticGoldenCases: SYNTHETIC_GOLDEN_CASES.length,
  syntheticCreators: new Set(SYNTHETIC_GOLDEN_CASES.map((item) => item.creatorId)).size,
  note: "Synthetic cases protect contracts and do not unlock the real auto-publish gate.",
}, null, 2))
