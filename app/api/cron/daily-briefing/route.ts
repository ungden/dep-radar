import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import { buildDailyBriefingSnapshot } from "@/lib/daily-briefing-publisher"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const snapshot = await buildDailyBriefingSnapshot()
  for (const path of snapshot.revalidatePaths) {
    revalidatePath(path)
  }

  return NextResponse.json({
    ok: snapshot.quality.ok,
    job: "daily-briefing",
    revalidated: snapshot.revalidatePaths,
    snapshot,
  }, { status: snapshot.quality.ok ? 200 : 500 })
}
