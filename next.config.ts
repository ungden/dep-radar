import type { NextConfig } from "next"

/** Sent on every response. No inline-script CSP yet: Next injects inline bootstrap scripts. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // The identity flow opens the camera through file inputs; nothing else is needed.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The share image reads its fonts from disk; ship them with that route.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./app/_og/*.ttf"],
    "/pros/[id]/opengraph-image": ["./app/_og/*.ttf"],
    "/dich-vu/[id]/opengraph-image": ["./app/_og/*.ttf"],
    "/works/[id]/opengraph-image": ["./app/_og/*.ttf"],
    "/pros/[id]/portfolio/[format]": ["./app/_og/*.ttf"],
    "/works/[id]/portfolio/[format]": ["./app/_og/*.ttf"],
  },
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Portfolio photos and avatars come from Supabase Storage.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // The local stack serves the same files over http on a port.
      { protocol: "http", hostname: "127.0.0.1", port: "54321", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Identity verification must never be cached or indexed.
      { source: "/api/identity", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex" }] },
    ]
  },
}

export default nextConfig
