import fs from "node:fs"
import path from "node:path"

import { RESEARCHED_PRODUCT_REFERENCES } from "../lib/product-research"

interface ManifestPost {
  id: string
  url: string
  caption?: string
  title?: string
}

interface Manifest {
  creator_id: string
  profile_url: string
  posts: ManifestPost[]
}

const CORE_PRODUCTS = [
  { id: "1", brand: "The Ordinary", name: "Hyaluronic Acid 2% + B5 Serum" },
  { id: "2", brand: "Maybelline New York", name: "Fit Me Matte + Poreless Foundation" },
  { id: "3", brand: "Bioderma", name: "Sensibio H2O Micellar Water" },
  { id: "4", brand: "MAC Cosmetics", name: "Powder Kiss Lip + Cheek Mousse" },
  { id: "5", brand: "Mise-en-Scene", name: "Perfect Serum Original" },
  { id: "6", brand: "CeraVe", name: "Hydrating Facial Cleanser" },
  { id: "7", brand: "Dior Beauty", name: "Miss Dior Eau de Parfum" },
  { id: "8", brand: "Vaseline", name: "Gluta-Hya Serum Burst Lotion Dewy Radiance" },
]

const PRODUCTS = [...CORE_PRODUCTS, ...RESEARCHED_PRODUCT_REFERENCES]

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function includesPhrase(haystack: string, needle: string) {
  return needle.length >= 4 && ` ${haystack} `.includes(` ${needle} `)
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function top(map: Map<string, number>, limit = 10) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, posts]) => ({ name, posts }))
}

const manifestDir = process.argv[2]
if (!manifestDir) throw new Error("Usage: tsx scripts/analyze-tiktok-manifests.ts /path/to/manifests")

const files = fs.readdirSync(manifestDir)
  .filter((file) => /^\d+-dt-.*\.json$/.test(file))
  .sort()
const manifests = files.map((file) => JSON.parse(
  fs.readFileSync(path.join(manifestDir, file), "utf8"),
) as Manifest)
const creatorPosts = new Map<string, { profileUrl: string; posts: Map<string, ManifestPost> }>()
for (const manifest of manifests) {
  const creator = creatorPosts.get(manifest.creator_id) ?? {
    profileUrl: manifest.profile_url,
    posts: new Map<string, ManifestPost>(),
  }
  for (const post of manifest.posts) creator.posts.set(post.id || post.url, post)
  creatorPosts.set(manifest.creator_id, creator)
}

const globalBrands = new Map<string, number>()
const globalProducts = new Map<string, number>()
let totalPosts = 0
let postsWithBrand = 0
let postsWithUseLanguage = 0
let postsWithCommercialLanguage = 0

const creators = [...creatorPosts.entries()].map(([creatorId, creator]) => {
  const brands = new Map<string, number>()
  const products = new Map<string, number>()
  let candidatePosts = 0
  let useLanguagePosts = 0
  let commercialLanguagePosts = 0

  for (const post of creator.posts.values()) {
    totalPosts += 1
    const caption = normalize(`${post.title ?? ""} ${post.caption ?? ""}`)
    const matchedBrands = new Set<string>()
    const matchedProducts = new Set<string>()
    for (const product of PRODUCTS) {
      const brand = normalize(product.brand)
      const productName = normalize(product.name)
      if (includesPhrase(caption, brand)) matchedBrands.add(product.brand)
      if (productName.length >= 8 && includesPhrase(caption, productName)) {
        matchedProducts.add(`${product.brand} — ${product.name}`)
      }
    }
    if (matchedBrands.size) {
      candidatePosts += 1
      postsWithBrand += 1
      matchedBrands.forEach((brand) => {
        increment(brands, brand)
        increment(globalBrands, brand)
      })
    }
    matchedProducts.forEach((product) => {
      increment(products, product)
      increment(globalProducts, product)
    })
    if (/\b(dung|xai|thoa|boi|tan|danh|test|routine|finish|het chai|mua lai)\b/.test(caption)) {
      useLanguagePosts += 1
      postsWithUseLanguage += 1
    }
    if (/\b(quang cao|tai tro|affiliate|booking|ma giam|gio hang|livestream|live)\b|#ad\b/.test(caption)) {
      commercialLanguagePosts += 1
      postsWithCommercialLanguage += 1
    }
  }

  return {
    creatorId,
    profileUrl: creator.profileUrl,
    posts: creator.posts.size,
    candidatePosts,
    useLanguagePosts,
    commercialLanguagePosts,
    topBrands: top(brands),
    exactProductNameCandidates: top(products),
  }
})

console.log(JSON.stringify({
  scope: {
    manifests: manifests.length,
    creators: creatorPosts.size,
    posts: totalPosts,
    postsWithCatalogueBrand: postsWithBrand,
    postsWithUseLanguage,
    postsWithCommercialLanguage,
  },
  topBrands: top(globalBrands, 20),
  exactProductNameCandidates: top(globalProducts, 20),
  creators,
  interpretation: "Caption matches are discovery candidates, not proof that a creator used a product. Video/frame evidence and human review remain required.",
}, null, 2))
