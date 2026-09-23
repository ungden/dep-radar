import { NextResponse } from "next/server"
import { readAuthRequest } from "@/lib/auth/http"
import { requestPasswordReset, throttles } from "@/lib/auth/password"
import { stringField } from "@/lib/auth/password-rules"

/**
 * POST { identifier } → 200 { sent, masked?, message, no_email? }
 *
 * `sent: false` with a message is a normal answer (no account for that number,
 * or an account with no real email yet: `no_email`, show a way to support).
 * The link in the email opens /dat-lai-mat-khau on the website.
 */
export const runtime = "nodejs"

export async function POST(request: Request) {
  const read = await readAuthRequest(request, throttles.forgot)
  if (!read.ok) return NextResponse.json({ sent: false, message: read.error }, { status: read.status })
  const outcome = await requestPasswordReset(stringField(read.body, "identifier"))
  return NextResponse.json(
    { sent: outcome.sent, masked: outcome.masked, message: outcome.message, no_email: outcome.noEmail },
    { status: outcome.status },
  )
}
