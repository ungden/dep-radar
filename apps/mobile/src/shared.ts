/**
 * The only door from the app into the web repo's `lib/`. Everything here is
 * pure TypeScript with no dependency but each other, so web and app rank the
 * feed, price a booking and name a category the same way.
 *
 * Not imported, on purpose: lib/utils.ts (pulls in clsx/tailwind-merge),
 * lib/supabase/*, lib/api/*, lib/auth/* (Next.js server code). The app's own
 * versions live in src/data/*.
 */
export * from "@shared/design/tokens"
export type * from "@shared/types"
export * from "@shared/catalog"
export * from "@shared/feed"
export * from "@shared/occasions"
export * from "@shared/pricing"
export * from "@shared/geo"
export * from "@shared/trust"
export * from "@shared/video-meta"
export * from "@shared/offers"
export * from "@shared/trade"
