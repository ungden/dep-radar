import "./load-local-env"

import assert from "node:assert/strict"
import fs from "node:fs"

import { SYNTHETIC_GOLDEN_CASES } from "../lib/evidence-radar/golden-cases"
import { deriveCreatorProductState, isPublicEvidenceEvent } from "../lib/evidence-radar/state-engine"
import { normalizeTikTokCollectorBatch, TIKTOK_COLLECTOR_MAX_POSTS } from "../lib/evidence-radar/tiktok-collector"
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

const collectorBatch = normalizeTikTokCollectorBatch({
  schema_version: "360dep.tiktok-manifest.v2",
  collector: "downloadtiktok",
  batch_id: "dt-contract-test-123",
  creator_id: "creator-1",
  profile_url: "https://www.tiktok.com/@creator.beauty",
  collected_at: NOW.toISOString(),
  posts: [
    {
      id: "7663466714054659349",
      url: "https://www.tiktok.com/@creator.beauty/video/7663466714054659349",
      title: "Routine có serum",
      timestamp: "2026-07-10T10:00:00Z",
      cover: "https://p16-common-sign.tiktokcdn.com/cover.jpg",
      media_url: "https://v16m-default.tiktokcdn-us.com/video.mp4",
      transcription_status: "ready",
      transcript_text: "Hôm nay mình dùng serum này trong routine buổi sáng.",
      transcript_language: "vi",
      transcript_segments: [{ start: 0.2, end: 3.8, text: "Hôm nay mình dùng serum này." }],
      transcription_provider: "mlx-whisper",
      transcription_model: "mlx-community/whisper-large-v3-turbo",
      archive_video_path: "evidence-radar/tiktok/creator.beauty/7663466714054659349/source.mp4",
      archive_audio_path: "evidence-radar/tiktok/creator.beauty/7663466714054659349/audio.mp3",
      media_sha256: "a".repeat(64),
      audio_sha256: "b".repeat(64),
    },
    {
      id: "7663466714054659350",
      url: "https://www.tiktok.com/@another.creator/video/7663466714054659350",
      title: "Cross creator",
      timestamp: "2026-07-10T10:00:00Z",
    },
  ],
}, {
  creator_id: "creator-1",
  platform: "TikTok",
  profile_url: "https://www.tiktok.com/@creator.beauty",
}, NOW)
assert.equal(TIKTOK_COLLECTOR_MAX_POSTS, 200)
assert.equal(collectorBatch.posts.length, 1)
assert.equal(collectorBatch.rejected[0]?.reason, "creator_profile_mismatch")
assert.equal(collectorBatch.posts[0].media_metadata.collector, "downloadtiktok")
assert.equal(collectorBatch.posts[0].media_metadata.media_resolved, true)
assert.ok(collectorBatch.posts[0].media_url?.includes("tiktokcdn-us.com"))
assert.ok(collectorBatch.posts[0].raw_media_expires_at < "2026-07-11T00:00:00.000Z")
assert.equal(collectorBatch.posts[0].transcription_status, "ready")
assert.ok(collectorBatch.posts[0].transcript_text?.includes("routine buổi sáng"))
assert.equal(collectorBatch.posts[0].vision_fallback_required, false)

const migration = fs.readFileSync("supabase/migrations/20260710092855_evidence_radar_foundation.sql", "utf8")
const queueMigration = fs.readFileSync("supabase/migrations/20260710093313_evidence_radar_service_queue_rpc.sql", "utf8")
const collectorQueueMigration = fs.readFileSync("supabase/migrations/20260718114106_tiktok_collector_media_queue.sql", "utf8")
const queueGrantMigration = fs.readFileSync("supabase/migrations/20260718115329_evidence_queue_service_send_grant.sql", "utf8")
const audioMigration = fs.readFileSync("supabase/migrations/20260719113242_evidence_audio_transcripts.sql", "utf8")
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
assert.ok(collectorQueueMigration.includes("when (new.media_url is not null)"))
assert.ok(collectorQueueMigration.includes("evidence_radar_enqueue_source_posts"))
assert.ok(collectorQueueMigration.includes("security invoker"))
assert.ok(!collectorQueueMigration.includes("to anon"))
assert.ok(queueGrantMigration.includes("grant insert on table pgmq.q_evidence_analysis to service_role"))
assert.ok(!queueGrantMigration.includes("to anon"))
assert.ok(!queueGrantMigration.includes("to authenticated"))
assert.ok(audioMigration.includes("transcript_text"))
assert.ok(audioMigration.includes("archive_video_path"))
assert.ok(audioMigration.includes("transcription_status = 'ready'"))
assert.ok(audioMigration.includes("enable row level security") || migration.includes("alter table public.source_posts enable row level security"))
assert.ok(!audioMigration.includes("to anon"))

console.log(JSON.stringify({
  ok: true,
  stateEngineCases: 10,
  syntheticGoldenCases: SYNTHETIC_GOLDEN_CASES.length,
  syntheticCreators: new Set(SYNTHETIC_GOLDEN_CASES.map((item) => item.creatorId)).size,
  tiktokCollectorAccepted: collectorBatch.posts.length,
  tiktokCollectorRejected: collectorBatch.rejected.length,
  note: "Synthetic cases protect contracts and do not unlock the real auto-publish gate.",
}, null, 2))
