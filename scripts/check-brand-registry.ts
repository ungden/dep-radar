import {
  BEAUTY_BRANDS,
  BRAND_REGISTRY_SOURCES,
  findBeautyBrand,
  getListingSeedBrands,
} from "../lib/brand-registry"

const sourceIds = new Set(BRAND_REGISTRY_SOURCES.map((source) => source.id))
const slugs = new Set<string>()
const errors: string[] = []

for (const brand of BEAUTY_BRANDS) {
  if (slugs.has(brand.slug)) errors.push(`Duplicate brand slug: ${brand.slug}`)
  slugs.add(brand.slug)

  if (brand.categories.length === 0) errors.push(`${brand.slug} has no categories`)
  if (brand.sourceIds.length === 0) errors.push(`${brand.slug} has no sources`)

  for (const sourceId of brand.sourceIds) {
    if (!sourceIds.has(sourceId)) errors.push(`${brand.slug} references missing source: ${sourceId}`)
  }
}

const aliasChecks = [
  ["LRP", "la-roche-posay"],
  ["BOJ", "beauty-of-joseon"],
  ["Romand", "romand"],
  ["Goodn Doc", "goodndoc"],
  ["Ofélia", "ofelia"],
] as const

for (const [input, expectedSlug] of aliasChecks) {
  const match = findBeautyBrand(input)
  if (match?.slug !== expectedSlug) errors.push(`Alias "${input}" resolved to ${match?.slug ?? "none"}, expected ${expectedSlug}`)
}

const listingSeeds = getListingSeedBrands()
if (listingSeeds.length < 60) errors.push(`Seed/high brand queue is too small: ${listingSeeds.length}`)

console.log(JSON.stringify({
  brands: BEAUTY_BRANDS.length,
  seedNow: BEAUTY_BRANDS.filter((brand) => brand.listingPriority === "seed-now").length,
  seedAndHigh: listingSeeds.length,
  sources: BRAND_REGISTRY_SOURCES.length,
  categories: [...new Set(BEAUTY_BRANDS.flatMap((brand) => brand.categories))].sort(),
}, null, 2))

if (errors.length > 0) {
  console.error("\nBrand registry errors:")
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}
