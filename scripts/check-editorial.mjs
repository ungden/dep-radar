import fs from "node:fs"
import path from "node:path"

const guide = fs.readFileSync("lib/catalogue-guide.ts", "utf8")
const readPosts = fs.readFileSync("lib/catalogue-read-posts.ts", "utf8")
const editorial = fs.readFileSync("lib/editorial.ts", "utf8")
const cataloguePage = fs.readFileSync("app/catalogue/[slug]/page.tsx", "utf8")
const data = fs.readFileSync("lib/data.ts", "utf8")
const kolsData = fs.readFileSync("lib/kols-data.ts", "utf8")
const contentMatrix = fs.existsSync("lib/content-matrix.ts") ? fs.readFileSync("lib/content-matrix.ts", "utf8") : ""

const nextReads = [...guide.matchAll(/nextReads:\s*\[([\s\S]*?)\]/g)].flatMap((match) =>
  [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
)
const publishedTitles = [...readPosts.matchAll(/makePost\(\{\s*title:\s*"([^"]+)"/g)].map((item) => item[1])
const publishedSlugs = [...readPosts.matchAll(/makePost\(\{\s*title:\s*"[^"]+"[\s\S]*?slug:\s*"([^"]+)"/g)].map((item) => item[1])
const missing = nextReads.filter((title) => !publishedTitles.includes(title))

const plannedBlock = editorial.match(/const PLANNED_BY_HUB:[\s\S]*?\n}\n\nfunction plannedBrief/)
const plannedCount = plannedBlock ? (plannedBlock[0].match(/title: "/g) ?? []).length : 0
const plannedSlugs = plannedBlock
  ? [...plannedBlock[0].matchAll(/title:\s*"([^"]+)"/g)].map((item) => slugify(item[1]))
  : []
const allArticleSlugs = [...new Set([...publishedSlugs, ...plannedSlugs])]
const missingImages = allArticleSlugs.filter((slug) => !fs.existsSync(path.join("public/images/editorial", `${slug}.jpg`)))
const hasRegistry = editorial.includes("EDITORIAL_ARTICLE_REGISTRY")
const hasPublishedFilter = editorial.includes('article.status === "published"')
const publishesPlannedContent = editorial.includes('status: seed.status ?? "published"')
const hasGeneratedContentBuilder = editorial.includes("function buildGeneratedContent")
const nextReadUsesBlog = cataloguePage.includes('href={`/blog/${slug}`}')
const nextReadFunction = cataloguePage.match(/function NextReadLink[\s\S]*?\n}\n\nfunction /)?.[0] ?? ""
const nextReadHasSearchFallback = /\/search\?q=/.test(nextReadFunction)
const matrixCardFunction = cataloguePage.match(/function ResearchMatrixCard[\s\S]*?\n}\n\nfunction MatrixInfoBlock/)?.[0] ?? ""
const matrixCardHasSearchFallback = /\/search\?q=/.test(matrixCardFunction)
const matrixArticleSlugs = [...contentMatrix.matchAll(/articleSlug:\s*"([^"]+)"/g)].map((item) => item[1])
const matrixNextSlugs = [...contentMatrix.matchAll(/nextArticleSlugs:\s*\[([\s\S]*?)\]/g)].flatMap((match) =>
  [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
)
const matrixProductGroupRefs = [...contentMatrix.matchAll(/productGroupKeys:\s*\[([\s\S]*?)\]/g)].flatMap((match) =>
  [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
)
const productGroupBlocks = [...contentMatrix.matchAll(/"([^"]+)":\s*\{\s*key:\s*"([^"]+)"([\s\S]*?)\n  \}/g)]
const productGroupKeys = productGroupBlocks.map((match) => match[2])
const localProductIds = [...data.matchAll(/\{\s*id:\s*"([^"]+)"/g)].map((item) => item[1])
const localKolIds = [...kolsData.matchAll(/"id":\s*"([^"]+)"/g)].map((item) => item[1])
const matrixProductIds = [
  ...[...contentMatrix.matchAll(/productIds:\s*\[([\s\S]*?)\]/g)].flatMap((match) =>
    [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
  ),
  ...[...contentMatrix.matchAll(/comparisonProductIds:\s*\[([\s\S]*?)\]/g)].flatMap((match) =>
    [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
  ),
]
const matrixKolIds = [
  ...[...contentMatrix.matchAll(/kolIds:\s*\[([\s\S]*?)\]/g)].flatMap((match) =>
    [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
  ),
  ...[...contentMatrix.matchAll(/recommendedKolIds:\s*\[([\s\S]*?)\]/g)].flatMap((match) =>
    [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
  ),
]
const productGroupIssues = productGroupBlocks.flatMap((match) => {
  const key = match[2]
  const block = match[3]
  const productIds = block.match(/productIds:\s*\[([\s\S]*?)\]/)?.[1] ?? ""
  const hasProductId = /"[^"]+"/.test(productIds)
  const hasShopeeQuery = /shopeeQuery:\s*"[^"]+"/.test(block)
  const recommendedKolIds = [...(block.match(/recommendedKolIds:\s*\[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((item) => item[1])
  return [
    !hasShopeeQuery ? `${key} missing shopeeQuery` : null,
    !hasProductId && !hasShopeeQuery ? `${key} missing both productIds and shopeeQuery` : null,
    !/affiliateDisclosure:\s*"[^"]+"/.test(block) ? `${key} missing affiliateDisclosure` : null,
    ...recommendedKolIds
      .filter((id) => !new RegExp(`recommendedKolReasons:\\s*\\{[\\s\\S]*"${id}":`).test(block))
      .map((id) => `${key} missing display reason for recommendedKolIds ${id}`),
  ].filter(Boolean)
})
const nodeBlocks = [...contentMatrix.matchAll(/\{\s*key:\s*"([^"]+)"[\s\S]*?sourceRefs:\s*\[[^\]]*\],?\s*\n      \}/g)]
const nodeKolReasonIssues = nodeBlocks.flatMap((match) => {
  const key = match[1]
  const block = match[0]
  const kolIds = [...(block.match(/kolIds:\s*\[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((item) => item[1])
  return kolIds
    .filter((id) => !new RegExp(`kolReasons:\\s*\\{[\\s\\S]*"${id}":`).test(block))
    .map((id) => `${key} missing display reason for kolIds ${id}`)
})
const missingMatrixArticles = [...new Set(matrixArticleSlugs.filter((slug) => !allArticleSlugs.includes(slug)))]
const missingMatrixNextReads = [...new Set(matrixNextSlugs.filter((slug) => !allArticleSlugs.includes(slug)))]
const missingProductGroups = [...new Set(matrixProductGroupRefs.filter((key) => !productGroupKeys.includes(key)))]
const missingMatrixProducts = [...new Set(matrixProductIds.filter((id) => !localProductIds.includes(id)))]
const missingMatrixKols = [...new Set(matrixKolIds.filter((id) => !localKolIds.includes(id)))]
const medicalMatrixBlocks = [...contentMatrix.matchAll(/\{\s*[\s\S]*?safetyLevel:\s*"medical"[\s\S]*?\n      \}/g)]
const medicalNodesWithoutSources = medicalMatrixBlocks
  .filter((match) => !/sourceRefs:\s*\[[^\]]+\]/.test(match[0]))
  .map((match) => match[0].match(/key:\s*"([^"]+)"/)?.[1] ?? "unknown")

const errors = [
  missing.length > 0 ? `Missing published article(s) for nextReads: ${missing.join(", ")}` : null,
  plannedCount < 60 ? `Expected at least 60 planned article briefs, found ${plannedCount}` : null,
  missingImages.length > 0 ? `Missing editorial image(s): ${missingImages.join(", ")}` : null,
  allArticleSlugs.length < 100 ? `Expected at least 100 editorial articles, found ${allArticleSlugs.length}` : null,
  !hasRegistry ? "Missing EDITORIAL_ARTICLE_REGISTRY" : null,
  !hasPublishedFilter ? "Editorial registry is not filtering published articles" : null,
  !publishesPlannedContent ? "Planned roadmap briefs are not published into public posts" : null,
  !hasGeneratedContentBuilder ? "Missing generated full-content builder for roadmap briefs" : null,
  !nextReadUsesBlog ? "NextReadLink must link directly to /blog/${slug}" : null,
  nextReadHasSearchFallback ? "NextReadLink still contains a /search?q= fallback" : null,
  matrixCardHasSearchFallback ? "ResearchMatrixCard still contains a /search?q= fallback for primary graph links" : null,
  contentMatrix.length === 0 ? "Missing lib/content-matrix.ts" : null,
  missingMatrixArticles.length > 0 ? `Content matrix articleSlug points to missing article(s): ${missingMatrixArticles.join(", ")}` : null,
  missingMatrixNextReads.length > 0 ? `Content matrix nextArticleSlugs point to missing article(s): ${missingMatrixNextReads.join(", ")}` : null,
  missingProductGroups.length > 0 ? `Content matrix references missing product group(s): ${missingProductGroups.join(", ")}` : null,
  missingMatrixProducts.length > 0 ? `Content matrix productIds point to missing product(s): ${missingMatrixProducts.join(", ")}` : null,
  missingMatrixKols.length > 0 ? `Content matrix kolIds point to missing KOL(s): ${missingMatrixKols.join(", ")}` : null,
  productGroupIssues.length > 0 ? `Product group issue(s): ${productGroupIssues.join(", ")}` : null,
  nodeKolReasonIssues.length > 0 ? `Matrix node KOL reason issue(s): ${nodeKolReasonIssues.join(", ")}` : null,
  medicalNodesWithoutSources.length > 0 ? `Medical matrix node(s) missing sources: ${medicalNodesWithoutSources.join(", ")}` : null,
].filter(Boolean)

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      nextReads: nextReads.length,
      publishedReadPosts: publishedTitles.length,
      totalEditorialArticles: allArticleSlugs.length,
      editorialImages: allArticleSlugs.length - missingImages.length,
      plannedBriefs: plannedCount,
      matrixNodes: matrixArticleSlugs.length,
      matrixProductGroups: productGroupKeys.length,
      matrixProductLinks: matrixProductIds.length,
      matrixKolLinks: matrixKolIds.length,
      registry: "ok",
    },
    null,
    2
  )
)

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}
