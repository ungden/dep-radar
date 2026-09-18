import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/env"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/bookings", "/requests", "/me", "/book", "/search", "/api"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
