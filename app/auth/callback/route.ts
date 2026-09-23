import { NextResponse, type NextRequest } from "next/server"
import { safeNext } from "@/lib/auth/credentials"
import { supabaseServer } from "@/lib/supabase/server"

/**
 * Where Google and Apple send people back, and where the link confirming a new
 * email lands (`loai=email`, from addRecoveryEmail). Exchanges the one-time
 * code for a session, then asks for a phone number if this account does not
 * have one yet: neither provider gives it, and a booking needs it.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const next = safeNext(params.get("next"))
  const code = params.get("code")
  const origin = request.nextUrl.origin
  // The email link can be opened in another browser than the one that asked for
  // it; the code cannot be exchanged there, but the change itself is done.
  const failure = params.get("loai") === "email" ? "email" : "oauth"

  // A cancelled consent screen comes back as ?error=access_denied.
  if (!code) return NextResponse.redirect(new URL(`/login?loi=${failure}&next=${encodeURIComponent(next)}`, origin))

  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    console.error("exchangeCodeForSession failed:", error?.code, error?.message)
    return NextResponse.redirect(new URL(`/login?loi=${failure}&next=${encodeURIComponent(next)}`, origin))
  }

  const { data: account } = await supabase.from("accounts").select("phone").eq("id", data.user.id).maybeSingle()
  const target = account?.phone ? next : `/me/so-dien-thoai?next=${encodeURIComponent(next)}`
  return NextResponse.redirect(new URL(target, origin))
}
