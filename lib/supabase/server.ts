import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./database.types"
import { requireBackend, serviceRoleKey } from "./env"

/**
 * Request-scoped client that carries the signed-in user, for server components,
 * route handlers and server actions. RLS applies, which is the point.
 */
export async function supabaseServer() {
  const { url, anonKey } = requireBackend()
  const store = await cookies()
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options)
        } catch {
          // Server components cannot set cookies; the middleware refreshes the session.
        }
      },
    },
  })
}

/**
 * Service-role client: bypasses RLS. Only for work the platform owns, such as
 * writing the result of an identity check. Never reachable from the browser.
 */
export function supabaseAdmin() {
  const { url } = requireBackend()
  return createServerClient<Database>(url, serviceRoleKey(), {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** The signed-in account, or null. */
export async function currentAccount() {
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  const { data: account } = await supabase
    .from("accounts")
    .select("id, full_name, phone, avatar_path, active_role, is_admin")
    .eq("id", data.user.id)
    .maybeSingle()
  if (!account) return null
  const { data: pro } = await supabase.from("pros").select("id, slug").eq("id", data.user.id).maybeSingle()
  return { ...account, proSlug: pro?.slug ?? null, isPro: Boolean(pro) }
}
