import "./load-local-env"

import { buildContentGraphCoverage, buildDailyEditorialPlan, buildRelatedArticles } from "../lib/content-graph"
import { getCreatorProductEvents, getKols, getPosts, getProducts } from "../lib/data"

async function main() {
  const [posts, products, timelineEvents, kols] = await Promise.all([
    getPosts(),
    getProducts(),
    getCreatorProductEvents(),
    getKols(),
  ])
  const publishedPosts = posts.filter((post) => post.status !== "draft" && post.status !== "planned")
  const coverage = buildContentGraphCoverage(publishedPosts)
  const dailyPlan = buildDailyEditorialPlan({ posts: publishedPosts, products, timelineEvents, kols })
  const relatedGaps = publishedPosts
    .map((post) => ({
      slug: post.slug || post.id,
      title: post.title,
      relatedCount: buildRelatedArticles({ post, posts: publishedPosts, limit: 3 }).length,
    }))
    .filter((post) => post.relatedCount < 3)
  const coverageGaps = coverage.filter((hub) => hub.posts > 0 && hub.coverageScore < 65)
  const errors = [
    !dailyPlan.leadStory ? "Daily planner has no lead story" : null,
    dailyPlan.candidates.length < 8 ? `Daily planner has only ${dailyPlan.candidates.length} candidates` : null,
    relatedGaps.length > 0 ? `Published posts with fewer than 3 related reads: ${relatedGaps.map((post) => post.slug).join(", ")}` : null,
    coverageGaps.length > 0 ? `Hub graph coverage below 65%: ${coverageGaps.map((hub) => `${hub.hubSlug}=${hub.coverageScore}%`).join(", ")}` : null,
  ].filter(Boolean)

  console.log(JSON.stringify({
    publishedPosts: publishedPosts.length,
    dailyCandidates: dailyPlan.candidates.length,
    leadStory: dailyPlan.leadStory?.post.slug ?? null,
    hubsWithPosts: coverage.filter((hub) => hub.posts > 0).length,
    minCoverage: Math.min(...coverage.filter((hub) => hub.posts > 0).map((hub) => hub.coverageScore)),
    relatedGaps: relatedGaps.length,
    coverage: coverage
      .filter((hub) => hub.posts > 0)
      .map((hub) => ({
        hub: hub.hubSlug,
        posts: hub.posts,
        nodes: hub.matrixNodes,
        coverageScore: hub.coverageScore,
      })),
  }, null, 2))

  if (errors.length > 0) {
    console.error("\nContent graph errors:")
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
