import { showsAverage } from "./connection"

/**
 * The aggregateRating of a profile, or nothing. Search engines get the same
 * rule as the page: no average until there are MIN_REVIEWS_FOR_AVERAGE real
 * reviews behind it (lib/connection.ts), and none at all over sample data.
 */
export function aggregateRatingFor(rating: { average: number; count: number }, sample = false) {
  if (sample || !showsAverage(rating.count)) return undefined
  return {
    "@type": "AggregateRating",
    ratingValue: rating.average.toFixed(2),
    reviewCount: rating.count,
    bestRating: 5,
    worstRating: 1,
  }
}

/** Serializes JSON-LD without allowing user content to close its script tag. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}
