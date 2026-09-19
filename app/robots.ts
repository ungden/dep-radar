import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/env"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything behind a sign-in, plus search pages whose parameters would
      // otherwise be indexed as thousands of near-duplicate URLs.
      disallow: [
        "/studio",
        "/bookings",
        "/requests",
        "/me",
        "/book",
        "/tin-nhan",
        "/thong-bao",
        "/search",
        "/admin",
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
