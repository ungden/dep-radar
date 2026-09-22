import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { SUPABASE_ANON_KEY, SUPABASE_URL, backendEnabled } from "@/lib/supabase/env"

/** Signed-in-only areas. The server decides, not the rendered page. */
const PRIVATE = ["/studio", "/bookings", "/requests", "/me", "/book", "/tin-nhan", "/thong-bao"]
const ADMIN = "/admin"
/** Signed-in areas that assume the account has a phone number. */
const NEEDS_PHONE = ["/studio", "/bookings", "/requests", "/book", "/tin-nhan"]

export async function middleware(request: NextRequest) {
  // Without a backend the app is the labelled browser demo: nothing to guard.
  if (!backendEnabled) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of list) response.cookies.set(name, value, options)
      },
    },
  })

  // Also refreshes an expiring session, which is why it runs on every request.
  const { data } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (!data.user && PRIVATE.some((p) => path === p || path.startsWith(`${p}/`))) {
    const login = request.nextUrl.clone()
    login.pathname = "/login"
    login.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`
    return NextResponse.redirect(login)
  }

  // Google never provides a phone number, and everything past this point can end
  // in a call. /me stays open so settings and account deletion are reachable.
  if (data.user && NEEDS_PHONE.some((p) => path === p || path.startsWith(`${p}/`))) {
    const { data: account } = await supabase.from("accounts").select("phone").eq("id", data.user.id).maybeSingle()
    if (account && !account.phone) {
      const ask = request.nextUrl.clone()
      ask.pathname = "/me/so-dien-thoai"
      ask.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`
      return NextResponse.redirect(ask)
    }
  }

  if (path === ADMIN || path.startsWith(`${ADMIN}/`)) {
    if (!data.user) {
      const login = request.nextUrl.clone()
      login.pathname = "/login"
      login.search = `?next=${encodeURIComponent(path)}`
      return NextResponse.redirect(login)
    }
    const { data: account } = await supabase
      .from("accounts")
      .select("is_admin")
      .eq("id", data.user.id)
      .maybeSingle()
    if (!account?.is_admin) {
      const home = request.nextUrl.clone()
      home.pathname = "/"
      home.search = ""
      return NextResponse.redirect(home)
    }
  }

  return response
}

export const config = {
  // Everything but static assets and images.
  matcher: ["/((?!_next/static|_next/image|images/|favicon|icon|apple-icon|manifest|robots.txt|sitemap.xml).*)"],
}
