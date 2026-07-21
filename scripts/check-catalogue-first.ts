import assert from "node:assert/strict"

import {
  buildCatalogueHref,
  catalogueGroups,
  catalogueSections,
  getProductCatalogueMappingStatus,
  getProductCatalogueSlugs,
  productMatchesCatalogue,
} from "../lib/catalogue"
import { getPosts, getProducts } from "../lib/data"

async function main() {
  const allGroupedSlugs = catalogueGroups.flatMap((group) => group.sectionSlugs)
  assert.equal(catalogueGroups.length, 4, "Catalogue must have four browse groups")
  assert.equal(new Set(allGroupedSlugs).size, 14, "All 14 catalogue hubs must appear exactly once")
  assert.deepEqual(new Set(allGroupedSlugs), new Set(catalogueSections.map((section) => section.slug)))

  for (const section of catalogueSections) {
    assert.ok(section.group, `${section.slug} is missing group`)
    assert.ok(section.conditions?.length, `${section.slug} is missing conditions`)
    assert.equal(section.filterDefinitions?.length, 4, `${section.slug} must expose four finder filters`)
  }

  assert.equal(
    buildCatalogueHref("tri-mun", { condition: "mun-an", skin: "da-nhay-cam", audience: "pregnancy-safe", budget: "duoi-200k" }),
    "/catalogue/tri-mun?condition=mun-an&skin=da-nhay-cam&audience=pregnancy-safe&budget=duoi-200k"
  )

  const [products, posts] = await Promise.all([getProducts(), getPosts()])
  const publishedPosts = posts.filter((post) => post.status !== "draft" && post.status !== "planned")
  assert.ok(publishedPosts.every((post) => post.hubSlug && catalogueSections.some((section) => section.slug === post.hubSlug)), "Every published article needs a canonical hub")
  assert.ok(publishedPosts.every((post) => post.intent && post.researchStage && Array.isArray(post.conditionSlugs) && Array.isArray(post.nextArticleSlugs) && post.medicalDisclaimerLevel), "Every published article needs the catalogue-first editorial contract")
  assert.ok(products.every((product) => ["mapped", "unmapped"].includes(getProductCatalogueMappingStatus(product))), "Every product needs an approved mapping or unmapped state")

  const vaseline = products.find((product) => product.brand === "Vaseline")
  const hairSerum = products.find((product) => product.brand === "Mise-en-Scene")
  const foundation = products.find((product) => product.brand === "Maybelline New York" && product.subcategory_key === "foundation")
  const acneHub = catalogueSections.find((section) => section.slug === "tri-mun")!
  const nailsHub = catalogueSections.find((section) => section.slug === "nails-mi-long-may")!
  const brighteningHub = catalogueSections.find((section) => section.slug === "sang-da-chong-nang")!
  assert.ok(vaseline && !productMatchesCatalogue(vaseline, acneHub), "Vaseline body lotion must not map to acne")
  assert.ok(hairSerum && !productMatchesCatalogue(hairSerum, nailsHub), "Hair serum must not map to nails/lash/brow")
  assert.ok(foundation && !productMatchesCatalogue(foundation, brighteningHub), "Foundation must not map to brightening/sunscreen")

  console.log(JSON.stringify({
    catalogueGroups: catalogueGroups.length,
    catalogueHubs: catalogueSections.length,
    publishedPosts: publishedPosts.length,
    products: products.length,
    mappedProducts: products.filter((product) => getProductCatalogueSlugs(product).length > 0).length,
    unmappedProducts: products.filter((product) => getProductCatalogueMappingStatus(product) === "unmapped").length,
    regressions: "passed",
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
