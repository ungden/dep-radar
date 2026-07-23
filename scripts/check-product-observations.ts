import assert from "node:assert/strict"

import { buildProductObservationSummary } from "@/lib/product-observation"
import type { CreatorProductEvent } from "@/lib/types"

function event(overrides: Partial<CreatorProductEvent>): CreatorProductEvent {
  return {
    id: crypto.randomUUID(), creator_id: "creator-a", product_id: "sku-a", evidence_id: "evidence-a",
    event_type: "used", event_date: "2026-07-01", observed_at: "2026-07-21T00:00:00Z", source_platform: "tiktok",
    source_url: "https://www.tiktok.com/@creator/video/1", source_title: "Review", source_excerpt: "đã dùng",
    sentiment: "positive", disclosure: "organic", usage_context: "Dùng trong routine tối",
    evidence_note: "human reviewed", confidence: "high", confidence_score: 100, exact_sku_verified: true,
    evidence_spans: [{ kind: "timestamp", value: "đã dùng", timestamp_seconds: 12 }], verification_status: "verified",
    ...overrides,
  }
}

const duplicateCreator = buildProductObservationSummary([
  event({ id: "a", creator_id: "creator-a", event_type: "mentioned" }),
  event({ id: "b", creator_id: "creator-a", event_type: "repurchased" }),
])
assert.equal(duplicateCreator.independentCreatorCount, 1)
assert.equal(duplicateCreator.verifiedClipCount, 2)
assert.equal(duplicateCreator.directUseCount, 1)

const multipleCreators = buildProductObservationSummary([
  event({ id: "c", creator_id: "creator-a" }),
  event({ id: "d", creator_id: "creator-b", disclosure: "affiliate" }),
])
assert.equal(multipleCreators.observationStatus, "multiple_creators")
assert.equal(multipleCreators.commercialShare, 50)

const commercial = buildProductObservationSummary([
  event({ id: "e", creator_id: "creator-a", disclosure: "pr" }),
  event({ id: "f", creator_id: "creator-b", disclosure: "sponsored" }),
  event({ id: "g", creator_id: "creator-c", disclosure: "affiliate" }),
  event({ id: "h", creator_id: "creator-d", disclosure: "organic" }),
])
assert.equal(commercial.hasMostlyCommercialSources, true)
assert.equal(commercial.commercialClipCount, 3)

console.log("Product observation summary checks passed.")
