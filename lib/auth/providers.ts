import { SUPABASE_ANON_KEY, SUPABASE_URL, backendEnabled } from "@/lib/supabase/env"

export type OAuthProvider = "google" | "apple"

/**
 * Which sign-in providers are switched on in the Supabase project.
 *
 * Providers live in the Supabase dashboard, not in this repo. Asking Auth
 * itself means a button turns on the minute someone saves the provider there:
 * until then Google says it is being set up, and Apple is simply not shown.
 * Cached for a minute: this is read on every visit to /login.
 */
export async function oauthProviders(): Promise<Record<OAuthProvider, boolean>> {
  const none = { google: false, apple: false }
  if (!backendEnabled) return none
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return none
    const settings = (await res.json()) as { external?: Partial<Record<OAuthProvider, boolean>> }
    return { google: settings.external?.google === true, apple: settings.external?.apple === true }
  } catch {
    return none
  }
}

export async function googleSignInEnabled(): Promise<boolean> {
  return (await oauthProviders()).google
}
