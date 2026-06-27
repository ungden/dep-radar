import fs from "node:fs"

const guide = fs.readFileSync("lib/catalogue-guide.ts", "utf8")
const readPosts = fs.readFileSync("lib/catalogue-read-posts.ts", "utf8")
const editorial = fs.readFileSync("lib/editorial.ts", "utf8")
const cataloguePage = fs.readFileSync("app/catalogue/[slug]/page.tsx", "utf8")

const nextReads = [...guide.matchAll(/nextReads:\s*\[([\s\S]*?)\]/g)].flatMap((match) =>
  [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
)
const publishedTitles = [...readPosts.matchAll(/makePost\(\{\s*title:\s*"([^"]+)"/g)].map((item) => item[1])
const missing = nextReads.filter((title) => !publishedTitles.includes(title))

const plannedBlock = editorial.match(/const PLANNED_BY_HUB:[\s\S]*?\n}\n\nfunction plannedBrief/)
const plannedCount = plannedBlock ? (plannedBlock[0].match(/title: "/g) ?? []).length : 0
const hasRegistry = editorial.includes("EDITORIAL_ARTICLE_REGISTRY")
const hasPublishedFilter = editorial.includes('article.status === "published"')
const nextReadUsesBlog = cataloguePage.includes('href={`/blog/${slug}`}')
const nextReadHasSearchFallback = /function NextReadLink[\s\S]*\/search\?q=/.test(cataloguePage)

const errors = [
  missing.length > 0 ? `Missing published article(s) for nextReads: ${missing.join(", ")}` : null,
  plannedCount < 60 ? `Expected at least 60 planned article briefs, found ${plannedCount}` : null,
  !hasRegistry ? "Missing EDITORIAL_ARTICLE_REGISTRY" : null,
  !hasPublishedFilter ? "Editorial registry is not filtering published articles" : null,
  !nextReadUsesBlog ? "NextReadLink must link directly to /blog/${slug}" : null,
  nextReadHasSearchFallback ? "NextReadLink still contains a /search?q= fallback" : null,
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
      plannedBriefs: plannedCount,
      registry: "ok",
    },
    null,
    2
  )
)
