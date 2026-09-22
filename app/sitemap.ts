import type { MetadataRoute } from "next"
import { listPublishedSlugs } from "@/lib/api/pros"
import { CATEGORIES } from "@/lib/catalog"
import { SITE_URL } from "@/lib/env"
import { CITIES } from "@/lib/geo"
import { OCCASIONS } from "@/lib/occasions"
import { backendEnabled } from "@/lib/supabase/env"

const citySlug = (city: string) =>
  city
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const base: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/pros`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/chinh-sach`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/tro-giup`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    // Occasions: what people book together for a day ("Áo dài Tết").
    ...OCCASIONS.map((o) => ({
      url: `${SITE_URL}/dip/${o.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    // The searches people actually type, one page per city and category in
    // every trade: "nail tại nhà Hà Nội", "chụp ảnh điện thoại ở Hà Nội".
    ...CITIES.flatMap((city) =>
      CATEGORIES.map((c) => ({
        url: `${SITE_URL}/${citySlug(city)}/${c.id}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ),
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
