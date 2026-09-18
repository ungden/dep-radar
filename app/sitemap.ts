import type { MetadataRoute } from "next"
import { PROS, WORKS } from "@/lib/data"
import { SITE_URL } from "@/lib/env"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: SITE_URL, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/pros`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/chinh-sach`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    ...PROS.map((p) => ({ url: `${SITE_URL}/pros/${p.id}`, lastModified, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...WORKS.map((w) => ({ url: `${SITE_URL}/works/${w.id}`, lastModified, changeFrequency: "monthly" as const, priority: 0.5 })),
  ]
}
