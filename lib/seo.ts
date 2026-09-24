import type { Metadata } from "next"

/**
 * A page's `openGraph` object replaces the root one rather than merging with
 * it, which silently dropped the site name on every landing page. Spread this
 * in instead. No default image here: the nearest `opengraph-image` file fills
 * it in, and naming one would hide a page's own share card.
 */
export function openGraph(og: NonNullable<Metadata["openGraph"]>): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    locale: "vi_VN",
    siteName: "360đẹp",
    // An explicit `undefined` would wipe the default image, so drop them.
    ...Object.fromEntries(Object.entries(og).filter(([, value]) => value !== undefined)),
  }
}
