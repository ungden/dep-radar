import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { RESET_COOKIE, RESET_COOKIE_MAX_AGE, safeNext } from "@/lib/auth/credentials"
import { supabaseServer } from "@/lib/supabase/server"

/**
 * Where the links in 360dep's emails land.
 *
 * Two shapes arrive here. The template in docs/AUDIT_2026-09-22.md sends
 * `token_hash` + `type`, which works on any device. Supabase's default template
 * sends a PKCE `code`, which only works in the browser that asked for the email;
 * it is handled too, so a reset still works before the template is changed.
 */
const TYPES: EmailOtpType[] = ["recovery", "signup", "email", "email_change", "invite", "magiclink"]

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const next = safeNext(params.get("next"))
  const tokenHash = params.get("token_hash")
  const type = params.get("type") as EmailOtpType | null
  const code = params.get("code")

  const supabase = await supabaseServer()
  let userId: string | null = null
  let isRecovery = false

  if (tokenHash && type && TYPES.includes(type)) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) userId = data.user?.id ?? null
    isRecovery = type === "recovery"
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) userId = data.user?.id ?? null
    // A PKCE link carries no type; the reset request is the only one that
    // points at the set-a-new-password page.
    isRecovery = next === "/dat-lai-mat-khau"
  }

  const origin = request.nextUrl.origin
  if (!userId) return NextResponse.redirect(new URL("/login?loi=link", origin))

  // `next` may carry its own query string, so resolve it rather than assign a pathname.
  const response = NextResponse.redirect(new URL(next, origin))
  if (isRecovery) {
    response.cookies.set(RESET_COOKIE, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: RESET_COOKIE_MAX_AGE,
    })
  }
  return response
}
