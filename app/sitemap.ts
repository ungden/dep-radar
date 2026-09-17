import type { MetadataRoute } from "next"
import { PROS, WORKS } from "@/lib/data"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/pros`, changeFrequency: "daily", priority: 0.8 },
    ...PROS.map((p) => ({ url: `${siteUrl}/pros/${p.id}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...WORKS.map((w) => ({ url: `${siteUrl}/works/${w.id}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ]
}
