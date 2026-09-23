import { SUPABASE_URL } from "./supabase"

/** The live web app. Some things (account deletion, full settings) still happen there. */
export const WEB_URL = "https://www.360dep.vn"

/**
 * Image columns hold either a full URL (uploaded to Storage) or a path like
 * "/images/pros/x.webp" for the demo pictures that live in the web repo.
 */
export function imageUrl(path: string | null | undefined, bucket = "works"): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  if (path.startsWith("/")) return `${WEB_URL}${path}`
  // A bare storage path ("<uid>/<file>.jpg").
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

export const webLink = (path: string) => `${WEB_URL}${path.startsWith("/") ? path : `/${path}`}`
