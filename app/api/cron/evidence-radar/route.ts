import { NextResponse, type NextRequest } from "next/server"

import { analyzeSourcePost, collectCreatorAccount } from "@/lib/evidence-radar/pipeline"
import { assertCronSecret, deleteQueueMessage, readQueue } from "@/lib/evidence-radar/server"

export const dynamic = "force-dynamic"
export const maxDuration = 300

type CreatorMonitorMessage = { creator_account_id: string }
type EvidenceAnalysisMessage = { source_post_id: string }

async function runWorker(request: NextRequest) {
  try {
    assertCronSecret(request.headers.get("authorization"))
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  if (process.env.EVIDENCE_RADAR_COLLECTION_ENABLED !== "true") {
    return NextResponse.json({
      ok: true,
      worker: "evidence-radar",
      paused: true,
      reason: "Collection kill-switch is off until provider and Gemini credentials are verified.",
    })
  }

  const results: Array<Record<string, unknown>> = []
  const errors: Array<Record<string, unknown>> = []

  const monitorMessages = await readQueue<CreatorMonitorMessage>("creator_monitor", 2)
  for (const queueMessage of monitorMessages) {
    try {
      const result = await collectCreatorAccount(queueMessage.message.creator_account_id)
      await deleteQueueMessage("creator_monitor", queueMessage.msg_id)
      results.push({ kind: "collection", accountId: queueMessage.message.creator_account_id, ...result })
    } catch (error) {
      errors.push({
        kind: "collection",
        accountId: queueMessage.message.creator_account_id,
        attempt: queueMessage.read_ct,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const analysisMessages = await readQueue<EvidenceAnalysisMessage>("evidence_analysis", 2, 600)
  for (const queueMessage of analysisMessages) {
    try {
      const result = await analyzeSourcePost(queueMessage.message.source_post_id)
      await deleteQueueMessage("evidence_analysis", queueMessage.msg_id)
      results.push({ kind: "analysis", sourcePostId: queueMessage.message.source_post_id, ...result })
    } catch (error) {
      errors.push({
        kind: "analysis",
        sourcePostId: queueMessage.message.source_post_id,
        attempt: queueMessage.read_ct,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    worker: "evidence-radar",
    processed: results.length,
    results,
    errors,
  }, { status: errors.length ? 207 : 200 })
}

export async function GET(request: NextRequest) {
  return runWorker(request)
}

export async function POST(request: NextRequest) {
  return runWorker(request)
}
