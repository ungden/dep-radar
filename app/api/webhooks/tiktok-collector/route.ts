import { timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { normalizeTikTokCollectorBatch } from "@/lib/evidence-radar/tiktok-collector"
import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import type { CreatorAccount } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function sameSecret(provided: string, expected: string) {
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

function authorized(request: NextRequest) {
  const expected = process.env.TIKTOK_COLLECTOR_WEBHOOK_SECRET
  if (!expected || expected.length < 24) return false
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  const header = request.headers.get("x-evidence-radar-secret") ?? ""
  return sameSecret(bearer, expected) || sameSecret(header, expected)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const envelope = asRecord(body)
  const creatorId = typeof envelope.creator_id === "string" ? envelope.creator_id.trim() : ""
  const profileUrl = typeof envelope.profile_url === "string" ? envelope.profile_url.trim() : ""
  if (!creatorId || !profileUrl) {
    return NextResponse.json({ ok: false, error: "Missing creator_id or profile_url" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: account, error: accountError } = await supabase
    .from("creator_accounts")
    .select("*")
    .eq("creator_id", creatorId)
    .ilike("platform", "%tiktok%")
    .eq("profile_url", profileUrl)
    .maybeSingle()
  if (accountError || !account) {
    return NextResponse.json({ ok: false, error: "TikTok creator account not found" }, { status: 404 })
  }

  let normalized
  try {
    normalized = normalizeTikTokCollectorBatch(body, account as CreatorAccount)
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Invalid collector batch",
    }, { status: 422 })
  }
  if (normalized.posts.length === 0) {
    return NextResponse.json({ ok: false, error: "No valid posts", rejected: normalized.rejected }, { status: 422 })
  }

  const sourceUrls = normalized.posts.map((post) => post.source_url)
  const { data: existingRows, error: existingError } = await supabase
    .from("source_posts")
    .select("source_url")
    .in("source_url", sourceUrls)
  if (existingError) return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 })
  const existingUrls = new Set((existingRows ?? []).map((row) => row.source_url))

  const rows = normalized.posts.map((post) => ({
    creator_account_id: account.id,
    creator_id: account.creator_id,
    source_platform: "TikTok",
    ...post,
  }))
  const { error: upsertError } = await supabase
    .from("source_posts")
    .upsert(rows, { onConflict: "source_url" })
  if (upsertError) return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 })

  const mediaSourceUrls = normalized.posts.filter((post) => post.media_url).map((post) => post.source_url)
  let queuedForPrivateAnalysis = 0
  if (mediaSourceUrls.length) {
    const { data: mediaRows, error: mediaRowsError } = await supabase
      .from("source_posts")
      .select("id,analysis_status")
      .in("source_url", mediaSourceUrls)
    if (mediaRowsError) return NextResponse.json({ ok: false, error: mediaRowsError.message }, { status: 500 })
    const pendingIds = (mediaRows ?? [])
      .filter((row) => row.analysis_status !== "queued" && row.analysis_status !== "processing")
      .map((row) => row.id)
    if (pendingIds.length) {
      const { error: queueError } = await supabase.rpc("evidence_radar_enqueue_source_posts", {
        source_post_ids: pendingIds,
      })
      if (queueError) return NextResponse.json({ ok: false, error: queueError.message }, { status: 500 })
    }
    queuedForPrivateAnalysis = mediaRows?.length ?? 0
  }

  const inserted = normalized.posts.filter((post) => !existingUrls.has(post.source_url)).length
  const updated = normalized.posts.length - inserted
  const errors = normalized.rejected.map((item) => `post[${item.index}]: ${item.reason}`)
  await Promise.all([
    supabase.from("creator_accounts").update({
      cursor: normalized.posts.slice(0, 100).map((post) => post.external_post_id).join(","),
      last_polled_at: normalized.collectedAt,
      last_error: errors.slice(0, 3).join("; ") || null,
      updated_at: new Date().toISOString(),
    }).eq("id", account.id),
    supabase.from("evidence_radar_runs").insert({
      run_type: "collection",
      provider: "downloadtiktok-channel",
      status: errors.length ? "partial" : "completed",
      records_seen: normalized.recordsSeen,
      records_inserted: inserted,
      records_failed: errors.length,
      error_summary: errors.slice(0, 3).join("; ") || null,
      metadata: {
        account_id: account.id,
        creator_id: account.creator_id,
        batch_id: normalized.batchId,
        updated,
        public_publish_enabled: false,
      },
      finished_at: new Date().toISOString(),
    }),
  ])

  return NextResponse.json({
    ok: errors.length === 0,
    batchId: normalized.batchId,
    seen: normalized.recordsSeen,
    accepted: normalized.posts.length,
    inserted,
    updated,
    rejected: normalized.rejected,
    queuedForPrivateAnalysis,
    publicPublishEnabled: false,
  }, { status: errors.length ? 207 : 200 })
}
