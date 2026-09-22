import { SUPABASE_ANON_KEY, SUPABASE_URL, backendEnabled } from "@/lib/supabase/env"

/**
 * Whether Google sign-in is switched on in the Supabase project.
 *
 * The provider lives in the Supabase dashboard, not in this repo. Asking Auth
 * itself means the button turns on the minute someone saves the Google client
 * there, and until then the login page says so instead of sending people to an
 * error. Cached for a minute: this is read on every visit to /login.
 */
export async function googleSignInEnabled(): Promise<boolean> {
  if (!backendEnabled) return false
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return false
    const settings = (await res.json()) as { external?: { google?: boolean } }
    return settings.external?.google === true
  } catch {
    return false
  }
}
