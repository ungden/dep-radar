import type { Metadata } from "next"

/**
 * A page's `openGraph` object replaces the root one rather than merging with
 * it, which silently dropped the share image and site name on every landing
 * page. Spread this in instead.
 */
export function openGraph(og: NonNullable<Metadata["openGraph"]>): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    locale: "vi_VN",
    siteName: "360dep",
    images: ["/opengraph-image"],
    // An explicit `undefined` would wipe the default image, so drop them.
    ...Object.fromEntries(Object.entries(og).filter(([, value]) => value !== undefined)),
  }
}
