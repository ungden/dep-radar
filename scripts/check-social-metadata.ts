import "./load-local-env"

import { existsSync } from "node:fs"
import type { Metadata } from "next"

import { generateMetadata as generateBlogMetadata } from "../app/blog/[id]/page"
import { generateMetadata as generateCatalogueDetailMetadata } from "../app/catalogue/[slug]/page"
import { metadata as catalogueMetadata } from "../app/catalogue/page"
import { generateMetadata as generateKolMetadata } from "../app/koc-tracker/[id]/page"
import { generateMetadata as generateProductMetadata } from "../app/products/[id]/page"
import { catalogueSections } from "../lib/catalogue"
import { getKols, getPosts, getProducts } from "../lib/data"
import { absoluteUrl, getSiteUrl, postPath } from "../lib/seo"

type RuntimeSocialMeta = {
  alternates?: {
    canonical?: string | URL
  } | null
  openGraph?: {
    url?: string | URL
    images?: SocialImage[]
  } | null
  twitter?: {
    images?: SocialImage[]
  } | null
}

type SocialImage = string | URL | { url?: string | URL }

interface CheckCase {
  route: string
  metadata: Metadata
  expectedUrl: string
  expectedImage: string
}

const siteUrl = getSiteUrl()
const socialImagePath = "public/brand/social-share.jpg"

function asUrl(value: string | URL | undefined): string {
  return value ? String(value) : ""
}

function collectImageUrls(images: SocialImage[] | undefined): string[] {
  return (images ?? [])
    .map((image) => {
      if (typeof image === "string") return image
      if (image instanceof URL) return image.toString()
      return asUrl(image.url)
    })
    .filter(Boolean)
}

function assertAbsolute(name: string, value: string, errors: string[]) {
  if (!value.startsWith(`${siteUrl}/`) && value !== siteUrl) {
    errors.push(`${name} must be an absolute ${siteUrl} URL, got: ${value || "(empty)"}`)
  }
}

function checkCase(item: CheckCase): string[] {
  const errors: string[] = []
  const metadata = item.metadata as RuntimeSocialMeta
  const canonical = asUrl(metadata.alternates?.canonical)
  const ogUrl = asUrl(metadata.openGraph?.url)
  const ogImages = collectImageUrls(metadata.openGraph?.images)
  const twitterImages = collectImageUrls(metadata.twitter?.images)

  assertAbsolute(`${item.route} canonical`, canonical, errors)
  assertAbsolute(`${item.route} og:url`, ogUrl, errors)
  assertAbsolute(`${item.route} og:image`, ogImages[0], errors)
  assertAbsolute(`${item.route} twitter:image`, twitterImages[0], errors)

  if (canonical !== item.expectedUrl) errors.push(`${item.route} canonical mismatch: expected ${item.expectedUrl}, got ${canonical}`)
  if (ogUrl !== item.expectedUrl) errors.push(`${item.route} og:url mismatch: expected ${item.expectedUrl}, got ${ogUrl}`)
  if (ogImages[0] !== item.expectedImage) errors.push(`${item.route} og:image mismatch: expected ${item.expectedImage}, got ${ogImages[0]}`)
  if (twitterImages[0] !== item.expectedImage) {
    errors.push(`${item.route} twitter:image mismatch: expected ${item.expectedImage}, got ${twitterImages[0]}`)
  }

  return errors
}

async function main() {
  const [products, kols, posts] = await Promise.all([getProducts(), getKols(), getPosts()])
  const product = products.find((item) => item.image)
  const kol = kols.find((item) => item.cover || item.avatar)
  const post = posts.find((item) => item.image)
  const section = catalogueSections[0]

  if (!existsSync(socialImagePath)) {
    throw new Error(`Missing default social image at ${socialImagePath}`)
  }
  if (!product) throw new Error("No product with image found for social metadata check")
  if (!kol) throw new Error("No KOL/KOC with image found for social metadata check")
  if (!post) throw new Error("No blog post with image found for social metadata check")
  if (!section) throw new Error("No catalogue section found for social metadata check")

  const cases: CheckCase[] = [
    {
      route: `/products/${product.id}`,
      metadata: await generateProductMetadata({ params: Promise.resolve({ id: product.id }) }),
      expectedUrl: absoluteUrl(`/products/${product.id}`),
      expectedImage: absoluteUrl(product.image),
    },
    {
      route: `/koc-tracker/${kol.id}`,
      metadata: await generateKolMetadata({ params: Promise.resolve({ id: kol.id }) }),
      expectedUrl: absoluteUrl(`/koc-tracker/${kol.id}`),
      expectedImage: absoluteUrl(kol.cover || kol.avatar),
    },
    {
      route: postPath(post),
      metadata: await generateBlogMetadata({ params: Promise.resolve({ id: post.slug || post.id }) }),
      expectedUrl: absoluteUrl(postPath(post)),
      expectedImage: absoluteUrl(post.image),
    },
    {
      route: "/catalogue",
      metadata: catalogueMetadata,
      expectedUrl: absoluteUrl("/catalogue"),
      expectedImage: absoluteUrl("/brand/social-share.jpg"),
    },
    {
      route: `/catalogue/${section.slug}`,
      metadata: await generateCatalogueDetailMetadata({ params: Promise.resolve({ slug: section.slug }) }),
      expectedUrl: absoluteUrl(`/catalogue/${section.slug}`),
      expectedImage: absoluteUrl("/brand/social-share.jpg"),
    },
  ]

  const errors = cases.flatMap(checkCase)
  console.log(
    JSON.stringify(
      {
        siteUrl,
        checkedRoutes: cases.map((item) => item.route),
        errorCount: errors.length,
      },
      null,
      2
    )
  )

  if (errors.length > 0) {
    console.error("\nSocial metadata errors:")
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
