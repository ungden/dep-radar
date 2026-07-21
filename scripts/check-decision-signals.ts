import assert from "node:assert/strict"

import { buildProductDecisionSignal, eventDecisionWeight } from "@/lib/product-decision-signal"
import type { CreatorProductEvent } from "@/lib/types"

const now = new Date("2026-07-21T00:00:00Z")

function event(overrides: Partial<CreatorProductEvent>): CreatorProductEvent {
  return {
    id: crypto.randomUUID(), creator_id: "creator-a", product_id: "sku-a", evidence_id: "evidence-a",
    event_type: "used", event_date: "2026-07-01", observed_at: now.toISOString(), source_platform: "tiktok",
    source_url: "https://www.tiktok.com/@creator/video/1", source_title: "Review", source_excerpt: "đã dùng",
    sentiment: "positive", disclosure: "organic", usage_context: "Dùng trong routine tối",
    evidence_note: "human reviewed", confidence: "high", confidence_score: 100, exact_sku_verified: true,
    evidence_spans: [{ kind: "timestamp", value: "đã dùng", timestamp_seconds: 12 }], verification_status: "verified",
    ...overrides,
  }
}

const repurchased = event({ event_type: "repurchased" })
assert.equal(eventDecisionWeight(repurchased, now), 1)

const duplicateCreator = buildProductDecisionSignal([
  event({ id: "a", creator_id: "creator-a", event_type: "mentioned" }),
  event({ id: "b", creator_id: "creator-a", event_type: "repurchased" }),
], now)
assert.equal(duplicateCreator.independentCreatorCount, 1)
assert.equal(duplicateCreator.supportScore, 100)

const crossChecked = buildProductDecisionSignal([
  event({ id: "c", creator_id: "creator-a" }),
  event({ id: "d", creator_id: "creator-b", disclosure: "affiliate" }),
], now)
assert.equal(crossChecked.evidenceStatus, "cross_checked")
assert.equal(crossChecked.commercialShare, 50)

const commercial = buildProductDecisionSignal([
  event({ id: "e", creator_id: "creator-a", disclosure: "pr" }),
  event({ id: "f", creator_id: "creator-b", disclosure: "sponsored" }),
  event({ id: "g", creator_id: "creator-c", disclosure: "affiliate" }),
  event({ id: "h", creator_id: "creator-d", disclosure: "organic" }),
], now)
assert.equal(commercial.commercialBuzz, true)
assert.equal(commercial.cautionCount, 3)

const negative = buildProductDecisionSignal([event({ event_type: "disliked", sentiment: "negative" })], now)
assert.equal(negative.supportScore, 0)
assert.equal(negative.cautionCount, 1)

console.log("Product decision signal checks passed.")
