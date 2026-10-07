import { NextResponse } from "next/server"
import { readAuthRequest } from "@/lib/auth/http"
import { createThrottle } from "@/lib/auth/throttle"
import { supabaseAdmin } from "@/lib/supabase/server"

/**
 * POST { id, helpful: boolean } → 200 { ok }
 *
 * The thumbs under an assistant answer. Recorded once per question: a later
 * click does not overwrite the first.
 */
export const runtime = "nodejs"

const throttle = createThrottle({ limit: 30, windowMs: 10 * 60 * 1000 })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const read = await readAuthRequest(request, throttle)
  if (!read.ok) return NextResponse.json({ ok: false }, { status: read.status })
  const id = typeof read.body.id === "string" && UUID.test(read.body.id) ? read.body.id : null
  if (!id || typeof read.body.helpful !== "boolean") return NextResponse.json({ ok: false }, { status: 400 })
  const { error } = await supabaseAdmin().from("help_questions").update({ helpful: read.body.helpful }).eq("id", id).is("helpful", null)
  if (error) console.error("help feedback failed:", error.message)
  return NextResponse.json({ ok: !error })
}
