import { timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { isTikTokWebhookPilot } from "@/lib/evidence-radar/focus"
import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import type { CreatorAccount } from "@/lib/types"

export const dynamic = "force-dynamic"

function authorized(request: NextRequest) {
  const expected = process.env.TIKTOK_COLLECTOR_WEBHOOK_SECRET
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  if (!expected || expected.length < 24) return false
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  const { data, error } = await getSupabaseAdmin().from("creator_accounts")
    .select("creator_id,profile_url,cursor,priority_tier,source_quality_score")
    .eq("active", true).eq("collection_mode", "webhook").ilike("platform", "%tiktok%")
    .order("source_quality_score", { ascending: false }).limit(20)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  const accounts = (data ?? []).filter((account) => isTikTokWebhookPilot({ ...account, platform: "TikTok", active: true, collection_mode: "webhook" } as CreatorAccount))
  return NextResponse.json({
    ok: true,
    schema_version: "360dep.tiktok-roster.v1",
    automation_cohort: process.env.EVIDENCE_RADAR_AUTOMATION_COHORT || "shadow-20260829",
    accounts,
  }, { headers: { "cache-control": "no-store" } })
}
