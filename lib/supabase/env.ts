/**
 * Which backend the app is talking to.
 *
 * With Supabase configured, the server is the source of truth for prices, fees,
 * availability and statuses. Without it the app runs the labelled in-browser demo
 * it shipped with, so a missing variable degrades honestly instead of crashing.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ""
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ""

export const backendEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/** Server-only. Never import this from a client component. */
export function serviceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server-side writes.")
  return key
}

export function requireBackend(): { url: string; anonKey: string } {
  if (!backendEnabled) {
    throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).")
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY }
}
