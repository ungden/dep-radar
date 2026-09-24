import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { runAiReview } from "@/lib/ai/review"

/**
 * The AI reviewer's clock: Vercel Cron calls this every five minutes
 * (vercel.json). Each run decides the profiles waiting for review, checks new
 * posts, and sends the reminders that are due; see lib/ai/review.ts.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when that variable is set
 * on the project. Without it the route is off (503), so an unset secret never
 * means an open endpoint.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

function authorized(header: string | null, secret: string): boolean {
  const given = Buffer.from(header?.trim() ?? "")
  const wanted = Buffer.from(`Bearer ${secret}`)
  if (given.length !== wanted.length) {
    timingSafeEqual(wanted, wanted)
    return false
  }
  return timingSafeEqual(given, wanted)
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return NextResponse.json({ error: "CRON_SECRET chưa được đặt." }, { status: 503 })
  if (!authorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    // Stops starting new work a minute before the function's limit.
    return NextResponse.json(await runAiReview((maxDuration - 60) * 1000))
  } catch (err) {
    // No service key, or no database: nothing ran.
    console.error("ai cron failed:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Không chạy được." }, { status: 500 })
  }
}
