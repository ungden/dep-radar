import type { MetadataRoute } from "next"
import { listPublishedSlugs } from "@/lib/api/pros"
import { SITE_URL } from "@/lib/env"
import { backendEnabled } from "@/lib/supabase/env"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const base: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/pros`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/chinh-sach`, lastModified, changeFrequency: "monthly", priority: 0.3 },
  ]
  if (!backendEnabled) return base

  // Only what is actually published: an unlisted profile has nothing to index.
  const { pros, works } = await listPublishedSlugs()
  return [
    ...base,
    ...pros.map((slug) => ({
      url: `${SITE_URL}/pros/${slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...works.map((slug) => ({
      url: `${SITE_URL}/works/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ]
}
