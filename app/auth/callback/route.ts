import { NextResponse, type NextRequest } from "next/server"
import { safeNext } from "@/lib/auth/credentials"
import { supabaseServer } from "@/lib/supabase/server"

/**
 * Where Google sends people back. Exchanges the one-time code for a session,
 * then asks for a phone number if this account does not have one yet: Google
 * never provides it, and nothing that involves a call can happen without it.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const next = safeNext(params.get("next"))
  const code = params.get("code")
  const origin = request.nextUrl.origin

  // Google reports a cancelled consent screen as ?error=access_denied.
  if (!code) return NextResponse.redirect(new URL(`/login?loi=google&next=${encodeURIComponent(next)}`, origin))

  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    console.error("exchangeCodeForSession failed:", error?.code, error?.message)
    return NextResponse.redirect(new URL(`/login?loi=google&next=${encodeURIComponent(next)}`, origin))
  }

  const { data: account } = await supabase.from("accounts").select("phone").eq("id", data.user.id).maybeSingle()
  const target = account?.phone ? next : `/me/so-dien-thoai?next=${encodeURIComponent(next)}`
  return NextResponse.redirect(new URL(target, origin))
}
