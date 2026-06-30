import fs from "node:fs"

import { catalogueSections } from "@/lib/catalogue"
import { buildDailyEditorialPlan, type ContentGraphCoverage } from "@/lib/content-graph"
import { getCreatorProductEvents, getKols, getPosts, getProductOffers, getProducts } from "@/lib/data"
import { getSiteUrl, postPath } from "@/lib/seo"
import type { Kol, Post, Product, ProductOffer } from "@/lib/types"

export type SeoAuditSeverity = "error" | "warning" | "info"
export type SeoAuditArea = "metadata" | "sitemap" | "blog" | "product" | "catalogue" | "kol" | "analytics" | "admin" | "ai"

export interface SeoAuditIssue {
  severity: SeoAuditSeverity
  area: SeoAuditArea
  title: string
  detail: string
  href?: string
}

export interface SeoAuditReport {
  generatedAt: string
  siteUrl: string
  summary: {
    errors: number
    warnings: number
    infos: number
    publicPages: number
    posts: number
    products: number
    kols: number
    cataloguePages: number
    sitemapUrls: number
    gaConfigured: boolean
  }
  issues: SeoAuditIssue[]
  sections: {
    staleKols: { id: string; name: string; latestEventDate: string | null }[]
    productsMissingOffers: { id: string; name: string; brand: string }[]
    postsMissingAiSignals: { slug: string; title: string; missing: string[] }[]
    contentGraphCoverage: ContentGraphCoverage[]
    dailyEditorialCandidates: { slug: string; title: string; score: number; reason: string }[]
  }
}

const ROUTE_FILES = {
  rootLayout: "app/layout.tsx",
  adminLayout: "app/admin/layout.tsx",
  sitemap: "app/sitemap.ts",
  robots: "app/robots.ts",
  blogDetail: "app/blog/[id]/page.tsx",
  productDetail: "app/products/[id]/page.tsx",
  catalogueDetail: "app/catalogue/[slug]/page.tsx",
  kolDetail: "app/koc-tracker/[id]/page.tsx",
}

export async function buildSeoAuditReport(): Promise<SeoAuditReport> {
  const siteUrl = getSiteUrl()
  const [posts, products, kols, offers, events] = await Promise.all([
    getPosts(),
    getProducts(),
    getKols(),
    getProductOffers(),
    getCreatorProductEvents(),
  ])

  const issues: SeoAuditIssue[] = []

  auditRouteFiles(issues)
  auditPosts(posts, issues)
  auditProducts(products, offers, issues)
  auditCatalogue(issues)
  const staleKols = auditKols(kols, events, issues)
  auditAnalytics(issues)
  const dailyPlan = buildDailyEditorialPlan({ posts, products, timelineEvents: events, kols })
  auditContentGraph(dailyPlan.coverage, dailyPlan.candidates.length, Boolean(dailyPlan.leadStory), issues)

  const publishedPosts = posts.filter((post) => post.status !== "draft" && post.status !== "planned")
  const sitemapUrls = 6 + catalogueSections.length + products.length + publishedPosts.length + kols.length
  const productsWithOffers = new Set(offers.filter((offer) => offer.affiliate_url || offer.seller_url).map((offer) => offer.product_id))
  const productsMissingOffers = products
    .filter((product) => !productsWithOffers.has(product.id))
    .map((product) => ({ id: product.id, name: product.name, brand: product.brand }))
  const postsMissingAiSignals = publishedPosts
    .map((post) => ({
      slug: post.slug || post.id,
      title: post.title,
      missing: [
        !post.takeaways?.length ? "takeaways" : null,
        !post.sourceNotes?.length ? "source notes" : null,
        !post.faq?.length ? "FAQ" : null,
      ].filter((item): item is string => Boolean(item)),
    }))
    .filter((post) => post.missing.length > 0)
    .slice(0, 20)

  const counts = {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    infos: issues.filter((issue) => issue.severity === "info").length,
  }

  return {
    generatedAt: new Date().toISOString(),
    siteUrl,
    summary: {
      ...counts,
      publicPages: sitemapUrls,
      posts: publishedPosts.length,
      products: products.length,
      kols: kols.length,
      cataloguePages: catalogueSections.length,
      sitemapUrls,
      gaConfigured: Boolean(process.env.NEXT_PUBLIC_GA_ID),
    },
    issues,
    sections: {
      staleKols,
      productsMissingOffers,
      postsMissingAiSignals,
      contentGraphCoverage: dailyPlan.coverage,
      dailyEditorialCandidates: dailyPlan.candidates.slice(0, 12).map((candidate) => ({
        slug: candidate.post.slug || candidate.post.id,
        title: candidate.post.title,
        score: Math.round(candidate.score),
        reason: candidate.reason,
      })),
    },
  }
}

function auditRouteFiles(issues: SeoAuditIssue[]) {
  const rootLayout = readFile(ROUTE_FILES.rootLayout)
  const adminLayout = readFile(ROUTE_FILES.adminLayout)
  const sitemap = readFile(ROUTE_FILES.sitemap)
  const robots = readFile(ROUTE_FILES.robots)
  const blogDetail = readFile(ROUTE_FILES.blogDetail)
  const productDetail = readFile(ROUTE_FILES.productDetail)
  const catalogueDetail = readFile(ROUTE_FILES.catalogueDetail)
  const kolDetail = readFile(ROUTE_FILES.kolDetail)

  addIf(issues, !rootLayout.includes("metadataBase") || !rootLayout.includes("openGraph"), "error", "metadata", "Global metadata is incomplete", "Root layout should define metadataBase, canonical metadata, and Open Graph defaults.")
  addIf(issues, !rootLayout.includes("GoogleAnalytics"), "error", "analytics", "GA component missing from root layout", "Root layout should mount the App Router GA page-view tracker.")
  addIf(issues, !adminLayout.includes("index: false") || !adminLayout.includes("follow: false"), "error", "admin", "Admin layout is indexable", "Admin routes must export noindex/nofollow metadata.")
  addIf(issues, !robots.includes("disallow: '/admin/'"), "error", "admin", "robots.txt does not block admin", "robots.ts should disallow /admin/.")
  addIf(issues, sitemap.includes("/blog/${post.id}"), "error", "sitemap", "Blog sitemap still uses id-only URLs", "Sitemap should prefer /blog/${post.slug || post.id}.")
  addIf(issues, !sitemap.includes("postPath(post)") && !sitemap.includes("post.slug || post.id"), "error", "sitemap", "Blog sitemap slug fallback missing", "Blog URLs in sitemap need slug-first fallback.")
  addIf(issues, !sitemap.includes("dateOrNow(post.created_at"), "warning", "sitemap", "Post lastModified may not use real dates", "Use created_at/updated fields where the data model provides them.")
  addIf(issues, !blogDetail.includes('"@type": "Article"'), "error", "blog", "Blog detail missing Article JSON-LD", "Blog posts should emit Article structured data.")
  addIf(issues, !productDetail.includes('"@type": "Product"'), "error", "product", "Product detail missing Product JSON-LD", "Product pages should emit Product structured data.")
  addIf(issues, !catalogueDetail.includes('"@type": "BreadcrumbList"'), "error", "catalogue", "Catalogue detail missing Breadcrumb JSON-LD", "Catalogue pages should emit a BreadcrumbList.")
  addIf(issues, !kolDetail.includes('"@type": "ProfilePage"'), "error", "kol", "KOL detail missing ProfilePage JSON-LD", "KOL pages should emit ProfilePage/Person structured data.")
}

function auditPosts(posts: Post[], issues: SeoAuditIssue[]) {
  for (const post of posts) {
    if (post.status === "draft" || post.status === "planned") continue
    const href = postPath(post)
    addIf(issues, !post.title?.trim(), "error", "blog", "Post missing title", post.id, href)
    addIf(issues, !post.slug?.trim(), "error", "blog", "Post missing slug", post.title || post.id, href)
    addIf(issues, !post.excerpt?.trim(), "error", "blog", "Post missing excerpt", post.title || post.id, href)
    addIf(issues, !post.image?.trim(), "error", "blog", "Post missing image", post.title || post.id, href)
    addIf(issues, !post.author_name?.trim(), "error", "blog", "Post missing author", post.title || post.id, href)
    addIf(issues, !post.tags?.length, "warning", "blog", "Post missing tags", post.title || post.id, href)
    addIf(issues, !post.takeaways?.length, "warning", "ai", "Post missing concise takeaways", post.title || post.id, href)
    addIf(issues, post.medicalDisclaimerLevel === "medical" && !post.sourceNotes?.length, "error", "ai", "Medical/safety post missing sources", post.title || post.id, href)
    addIf(issues, !post.sourceNotes?.length, "warning", "ai", "Post missing source notes", post.title || post.id, href)
  }
}

function auditProducts(products: Product[], offers: ProductOffer[], issues: SeoAuditIssue[]) {
  const offerProductIds = new Set(offers.filter((offer) => offer.affiliate_url || offer.seller_url).map((offer) => offer.product_id))

  for (const product of products) {
    const href = `/products/${product.id}`
    addIf(issues, !product.name?.trim(), "error", "product", "Product missing name", product.id, href)
    addIf(issues, !product.brand?.trim(), "error", "product", "Product missing brand", product.name || product.id, href)
    addIf(issues, !product.description?.trim(), "error", "product", "Product missing description", product.name || product.id, href)
    addIf(issues, !product.image?.trim(), "error", "product", "Product missing image", product.name || product.id, href)
    addIf(issues, !product.category_key, "error", "product", "Product missing category_key", product.name || product.id, href)
    addIf(issues, !product.subcategory_key, "error", "product", "Product missing subcategory_key", product.name || product.id, href)
    addIf(issues, product.status === "pending" || product.status === "archived", "error", "sitemap", "Non-public product appears in public product set", product.name || product.id, href)
    addIf(issues, !offerProductIds.has(product.id), "warning", "product", "Product missing preferred/affiliate offer", product.name || product.id, href)
  }
}

function auditCatalogue(issues: SeoAuditIssue[]) {
  for (const section of catalogueSections) {
    const href = `/catalogue/${section.slug}`
    addIf(issues, !section.title?.trim(), "error", "catalogue", "Catalogue section missing title", section.slug, href)
    addIf(issues, !section.description?.trim(), "error", "catalogue", "Catalogue section missing description", section.slug, href)
    addIf(issues, !section.branches?.length, "error", "catalogue", "Catalogue section missing topical branches", section.title || section.slug, href)
    addIf(issues, !section.productTypes?.length, "warning", "catalogue", "Catalogue section missing product type links", section.title || section.slug, href)
  }
}

function auditKols(kols: Kol[], events: { creator_id: string; event_date: string }[], issues: SeoAuditIssue[]) {
  const latestByCreator = new Map<string, string>()
  for (const event of events) {
    const current = latestByCreator.get(event.creator_id)
    if (!current || event.event_date > current) latestByCreator.set(event.creator_id, event.event_date)
  }

  const staleCutoff = new Date()
  staleCutoff.setDate(staleCutoff.getDate() - 45)
  const stale: { id: string; name: string; latestEventDate: string | null }[] = []

  for (const kol of kols) {
    const href = `/koc-tracker/${kol.id}`
    const latest = latestByCreator.get(kol.id) ?? null
    addIf(issues, !kol.avatar?.trim(), "error", "kol", "KOL missing avatar", kol.name || kol.id, href)
    addIf(issues, !kol.bio?.trim(), "warning", "kol", "KOL missing bio", kol.name || kol.id, href)
    addIf(issues, !kol.socials?.some((social) => social.url), "warning", "kol", "KOL missing public social URL", kol.name || kol.id, href)
    addIf(issues, !latest, "warning", "kol", "KOL has no product timeline event", kol.name || kol.id, href)
    if (!latest || new Date(latest) < staleCutoff) stale.push({ id: kol.id, name: kol.name, latestEventDate: latest })
  }

  return stale.slice(0, 50)
}

function auditAnalytics(issues: SeoAuditIssue[]) {
  addIf(
    issues,
    !process.env.NEXT_PUBLIC_GA_ID,
    "info",
    "analytics",
    "GA is not configured in this environment",
    "NEXT_PUBLIC_GA_ID is empty, so public analytics will no-op."
  )
}

function auditContentGraph(
  coverage: ContentGraphCoverage[],
  candidateCount: number,
  hasLeadStory: boolean,
  issues: SeoAuditIssue[]
) {
  addIf(issues, !hasLeadStory, "error", "ai", "Daily editorial planner has no lead story", "Homepage needs a scored lead story from the content graph.")
  addIf(issues, candidateCount < 8, "warning", "ai", "Daily editorial planner has too few candidates", `Expected at least 8 candidates, found ${candidateCount}.`)

  for (const hub of coverage) {
    if (hub.posts === 0) continue
    addIf(
      issues,
      hub.matrixNodes === 0,
      "warning",
      "ai",
      "Hub has posts but no content matrix",
      `${hub.hubTitle} has ${hub.posts} posts but no matrix nodes to guide next reads.`
    )
    addIf(
      issues,
      hub.coverageScore > 0 && hub.coverageScore < 35,
      "warning",
      "ai",
      "Hub content graph coverage is thin",
      `${hub.hubTitle} coverage is ${hub.coverageScore}%. Add next reads, product groups, and KOL links.`
    )
  }
}

function readFile(path: string) {
  try {
    return fs.readFileSync(path, "utf8")
  } catch {
    return ""
  }
}

function addIf(
  issues: SeoAuditIssue[],
  condition: boolean,
  severity: SeoAuditSeverity,
  area: SeoAuditArea,
  title: string,
  detail: string,
  href?: string
) {
  if (!condition) return
  issues.push({ severity, area, title, detail, href })
}
