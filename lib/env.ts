/**
 * Environment access in one place, so a missing variable fails loudly at build
 * time instead of silently falling back to localhost in production (which is
 * exactly what shipped before: robots.txt and sitemap.xml pointed at localhost).
 */

const isProductionBuild = process.env.VERCEL_ENV === "production"

function readSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (raw) return raw.replace(/\/$/, "")
  if (isProductionBuild) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for production builds (used by metadata, robots.txt and sitemap.xml).")
  }
  // Preview deployments get their own generated URL; local dev falls back to localhost.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

export const SITE_URL = readSiteUrl()

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString()

/** Identity verification is disabled (and says so) when the AI key is missing. */
export const identityCheckEnabled = Boolean(process.env.GEMINI_API_KEY)
