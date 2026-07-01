import fs from "node:fs"
import path from "node:path"

import { SAMPLE_PRODUCTS } from "../lib/data"
import { SAMPLE_PRODUCT_OFFERS } from "../lib/timeline-data"
import { RESEARCHED_PRODUCT_SOURCES } from "../lib/product-research"

const productIds = new Set<string>()
const sourceProductIds = new Set(RESEARCHED_PRODUCT_SOURCES.map((source) => source.productId))
const offerProductIds = new Set(SAMPLE_PRODUCT_OFFERS.filter((offer) => offer.seller_url || offer.affiliate_url).map((offer) => offer.product_id))
const errors: string[] = []

for (const product of SAMPLE_PRODUCTS) {
  if (productIds.has(product.id)) errors.push(`Duplicate product id: ${product.id}`)
  productIds.add(product.id)

  if (!product.name.trim()) errors.push(`${product.id} missing name`)
  if (!product.brand.trim()) errors.push(`${product.id} missing brand`)
  if (!product.description.trim()) errors.push(`${product.id} missing description`)
  if (!product.image.trim()) errors.push(`${product.id} missing image`)
  if (!product.category_key) errors.push(`${product.id} missing category_key`)
  if (!product.subcategory_key) errors.push(`${product.id} missing subcategory_key`)
  if (!offerProductIds.has(product.id)) errors.push(`${product.id} missing source/offer URL`)

  if (product.image.startsWith("/")) {
    const assetPath = path.join(process.cwd(), "public", product.image)
    if (!fs.existsSync(assetPath)) errors.push(`${product.id} local image does not exist: ${product.image}`)
    if (fs.existsSync(assetPath)) {
      const bytes = fs.readFileSync(assetPath)
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      if (!isJpeg) errors.push(`${product.id} local image is not a JPEG: ${product.image}`)
    }
  }
}

for (const productId of sourceProductIds) {
  if (!productIds.has(productId)) errors.push(`Research source references missing product: ${productId}`)
}

console.log(JSON.stringify({
  products: SAMPLE_PRODUCTS.length,
  researchedProducts: sourceProductIds.size,
  sourceBackedOffers: offerProductIds.size,
  categories: [...new Set(SAMPLE_PRODUCTS.map((product) => product.category_key))].sort(),
}, null, 2))

if (errors.length > 0) {
  console.error("\nProduct catalogue errors:")
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}
