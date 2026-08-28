import { NextResponse, type NextRequest } from "next/server"

import { analyzePriorityBatch, analyzeSourcePost, collectCreatorAccount } from "@/lib/evidence-radar/pipeline"
import { assertCronSecret, deleteQueueMessage, readQueue } from "@/lib/evidence-radar/server"

export const dynamic = "force-dynamic"
export const maxDuration = 300
const WORKER_VERSION = "evidence-radar-trust-first-v5"
const PRIORITY_BATCH_SIZE = 8

type CreatorMonitorMessage = { creator_account_id: string }
type EvidenceAnalysisMessage = { source_post_id: string }

async function runWorker(request: NextRequest) {
  try {
    assertCronSecret(request.headers.get("authorization"))
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const collectionEnabled = process.env.EVIDENCE_RADAR_COLLECTION_ENABLED === "true"
  const analysisEnabled = process.env.EVIDENCE_RADAR_ANALYSIS_ENABLED === "true"
  if (!collectionEnabled && !analysisEnabled) {
    return NextResponse.json({
      ok: true,
      worker: "evidence-radar",
      workerVersion: WORKER_VERSION,
      paused: true,
      reason: "Collection and analysis kill-switches are off.",
    })
  }

  const results: Array<Record<string, unknown>> = []
  const errors: Array<Record<string, unknown>> = []

  if (collectionEnabled) {
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
  }

  if (analysisEnabled) {
    let priorityResults: Array<Record<string, unknown>> = []
    try {
      priorityResults = await analyzePriorityBatch(PRIORITY_BATCH_SIZE)
      for (const result of priorityResults) {
        if (result.error) errors.push({ kind: "priority_analysis", ...result })
        else results.push({ kind: "priority_analysis", ...result })
      }
    } catch (error) {
      errors.push({
        kind: "analysis_provider",
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Once the priority pool is empty, drain stale queue messages idempotently.
    if (priorityResults.length === 0 && !errors.some((error) => error.kind === "analysis_provider")) {
      const analysisMessages = await readQueue<EvidenceAnalysisMessage>("evidence_analysis", 6, 600)
      for (const queueMessage of analysisMessages) {
        try {
          const result = await analyzeSourcePost(queueMessage.message.source_post_id)
          await deleteQueueMessage("evidence_analysis", queueMessage.msg_id)
          results.push({ kind: "analysis_queue", sourcePostId: queueMessage.message.source_post_id, ...result })
        } catch (error) {
          errors.push({
            kind: "analysis_queue",
            sourcePostId: queueMessage.message.source_post_id,
            attempt: queueMessage.read_ct,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }
  }

  const responseBody = {
    ok: errors.length === 0,
    worker: "evidence-radar",
    workerVersion: WORKER_VERSION,
    collectionEnabled,
    analysisEnabled,
    processed: results.length,
    results,
    errors,
  }
  console.info("evidence-radar-run", JSON.stringify({
    collectionEnabled,
    analysisEnabled,
    processed: results.length,
    errorCount: errors.length,
    errors: errors.map((error) => ({ kind: error.kind, error: error.error })),
  }))
  return NextResponse.json(responseBody, { status: errors.length ? 207 : 200 })
}

export async function GET(request: NextRequest) {
  return runWorker(request)
}

export async function POST(request: NextRequest) {
  return runWorker(request)
}
