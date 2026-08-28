import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import { runContentFactory } from "@/lib/content-factory/pipeline"
import { assertCronSecret } from "@/lib/evidence-radar/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300

const WORKER_VERSION = "360dep-content-factory-v1"

async function handle(request: NextRequest) {
  try {
    assertCronSecret(request.headers.get("authorization"))
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runContentFactory()
    const revalidated: string[] = []
    if (result.publishedSlug) {
      for (const path of ["/", "/blog", `/blog/${result.publishedSlug}`, "/products", "/koc-tracker", "/sitemap.xml"]) {
        revalidatePath(path)
        revalidated.push(path)
      }
    }
    console.info("content-factory-run", JSON.stringify({
      workerVersion: WORKER_VERSION,
      paused: result.paused,
      reason: result.reason,
      slot: result.slot,
      seededSignals: result.seededSignals,
      enqueuedJobId: result.enqueuedJobId,
      processedJobId: result.processedJobId,
      status: result.status,
      shadowMode: result.shadowMode,
      spentUsd: result.budget?.spentUsd,
      budgetRatio: result.budget?.ratio,
      warnings: result.warnings,
    }))
    return NextResponse.json({ ok: true, worker: "content-factory", workerVersion: WORKER_VERSION, ...result, revalidated })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("content-factory-failed", JSON.stringify({ workerVersion: WORKER_VERSION, error: message }))
    return NextResponse.json({ ok: false, worker: "content-factory", workerVersion: WORKER_VERSION, error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
