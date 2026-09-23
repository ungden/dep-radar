import { NextResponse } from "next/server"
import { readAuthRequest } from "@/lib/auth/http"
import { detachedAuthClient, signUpWithIdentifier, throttles } from "@/lib/auth/password"
import { stringField } from "@/lib/auth/password-rules"

/**
 * POST { identifier, password, fullName } → 200 { access_token, refresh_token } | 400/409/429 { error }
 *
 * `identifier` is a Vietnamese mobile number or an email. Email confirmation
 * is off in Supabase, so a session comes straight back. A number already on an
 * account is 409, with the words to show.
 */
export const runtime = "nodejs"

export async function POST(request: Request) {
  const read = await readAuthRequest(request, throttles.signUp)
  if (!read.ok) return NextResponse.json({ error: read.error }, { status: read.status })
  const result = await signUpWithIdentifier(detachedAuthClient(), {
    identifier: stringField(read.body, "identifier"),
    password: stringField(read.body, "password"),
    fullName: stringField(read.body, "fullName"),
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ access_token: result.session.access_token, refresh_token: result.session.refresh_token })
}
