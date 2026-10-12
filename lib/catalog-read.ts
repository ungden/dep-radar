/** Public status only: database error messages never cross into the page data. */
export function catalogReadStatus(results: {
  pros: { error: unknown }
  prices: { error: unknown }
  listings: { error: unknown }
  works: { error: unknown }
}) {
  return {
    catalogError: Boolean(results.pros.error || results.prices.error || results.listings.error),
    worksError: Boolean(results.works.error || results.pros.error),
  }
}
