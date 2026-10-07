import { NextResponse } from "next/server"
import { readAuthRequest } from "@/lib/auth/http"
import { createThrottle } from "@/lib/auth/throttle"
import { QUESTION_MAX, askHelp } from "@/lib/help/assistant"
import { isHelpAudience } from "@/lib/help/knowledge"
import { maskPersonal } from "@/lib/help/search"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server"

/**
 * POST { question, audience: "khach" | "doi-tac" }
 *   → 200 { id, answer, sources, covered, handoff }
 *
 * The help assistant (lib/help/assistant.ts). Anyone may ask, signed in or
 * not; each IP gets 15 questions per 10 minutes on this instance. Every
 * question is kept for the staff (help_questions, admin only), with phone
 * numbers and e-mails masked.
 */
export const runtime = "nodejs"
export const maxDuration = 30

const throttle = createThrottle({ limit: 15, windowMs: 10 * 60 * 1000 })

export async function POST(request: Request) {
  const read = await readAuthRequest(request, throttle)
  if (!read.ok) {
    const error = read.status === 429 ? "Bạn hỏi hơi nhanh, thử lại sau vài phút nhé." : read.error
    return NextResponse.json({ error }, { status: read.status })
  }
  const question = typeof read.body.question === "string" ? read.body.question.trim().slice(0, QUESTION_MAX) : ""
  const audience = isHelpAudience(read.body.audience) ? read.body.audience : "khach"
  if (question.length < 3) return NextResponse.json({ error: "Bạn gõ câu hỏi đầy đủ hơn giúp mình nhé." }, { status: 400 })

  const result = await askHelp(audience, question)

  let id: string | null = null
  try {
    const { data: auth } = await (await supabaseServer()).auth.getUser()
    const { data } = await supabaseAdmin()
      .from("help_questions")
      .insert({
        account_id: auth.user?.id ?? null,
        audience,
        question: maskPersonal(question),
        answer: result.answer,
        sources: result.sources,
        covered: result.covered,
        handoff: result.handoff,
        model: result.model,
      })
      .select("id")
      .single()
    id = data?.id ?? null
  } catch (err) {
    // Logging is for the staff; the person still gets the answer.
    console.error("help question not logged:", err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ id, answer: result.answer, sources: result.sources, covered: result.covered, handoff: result.handoff })
}
