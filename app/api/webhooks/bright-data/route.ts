import { NextResponse, type NextRequest } from "next/server"

import { normalizeBrightDataPost } from "@/lib/evidence-radar/providers"
import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import type { CreatorAccount } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function authorized(request: NextRequest) {
  const secret = process.env.BRIGHT_DATA_WEBHOOK_SECRET
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-evidence-radar-secret") === secret
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  const accountId = request.nextUrl.searchParams.get("accountId")
  if (!accountId) return NextResponse.json({ ok: false, error: "Missing accountId" }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: account, error: accountError } = await supabase.from("creator_accounts").select("*").eq("id", accountId).single()
  if (accountError || !account) return NextResponse.json({ ok: false, error: "Creator account not found" }, { status: 404 })

  const body: unknown = await request.json()
  const records = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as Record<string, unknown>).records)
      ? (body as Record<string, unknown>).records as unknown[]
      : []
  const typedAccount = account as CreatorAccount
  const posts = records
    .flatMap((record) => {
      const value = record && typeof record === "object" ? record as Record<string, unknown> : {}
      return Array.isArray(value.posts) ? value.posts : [value]
    })
    .map((record) => normalizeBrightDataPost(typedAccount.platform.toLowerCase(), record))
    .filter((post): post is NonNullable<typeof post> => Boolean(post))

  let inserted = 0
  const errors: string[] = []
  for (const post of posts) {
    const { error } = await supabase.from("source_posts").upsert({
      creator_account_id: typedAccount.id,
      creator_id: typedAccount.creator_id,
      source_platform: typedAccount.platform,
      external_post_id: post.external_post_id,
      source_url: post.source_url,
      published_at: post.published_at,
      title: post.title,
      caption: post.caption,
      media_url: post.media_url,
      media_metadata: post.media_metadata,
      raw_payload: post.raw_payload,
      content_hash: post.content_hash,
    }, { onConflict: "source_url", ignoreDuplicates: true })
    if (error && error.code !== "23505") errors.push(error.message)
    else if (!error) inserted += 1
  }

  await supabase.from("evidence_radar_runs").insert({
    run_type: "collection",
    provider: "bright-data-webhook",
    status: errors.length ? "partial" : "completed",
    records_seen: records.length,
    records_inserted: inserted,
    records_failed: errors.length,
    error_summary: errors.slice(0, 3).join("; ") || null,
    metadata: { account_id: accountId },
    finished_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: errors.length === 0, seen: records.length, normalized: posts.length, inserted, errors }, { status: errors.length ? 207 : 200 })
}
