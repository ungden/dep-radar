import { NextResponse } from "next/server"
import { readAuthRequest } from "@/lib/auth/http"
import { detachedAuthClient, signInWithIdentifier, throttles } from "@/lib/auth/password"
import { stringField } from "@/lib/auth/password-rules"

/**
 * POST { identifier, password } → 200 { access_token, refresh_token } | 4xx { error }
 *
 * For the app, which keeps its own session: it hands these tokens to
 * supabase.auth.setSession(). Same rules as the web form (lib/auth/password.ts).
 */
export const runtime = "nodejs"

export async function POST(request: Request) {
  const read = await readAuthRequest(request, throttles.signIn)
  if (!read.ok) return NextResponse.json({ error: read.error }, { status: read.status })
  const result = await signInWithIdentifier(detachedAuthClient(), stringField(read.body, "identifier"), stringField(read.body, "password"))
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ access_token: result.session.access_token, refresh_token: result.session.refresh_token })
}
