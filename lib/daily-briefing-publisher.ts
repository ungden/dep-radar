import { buildHomeDailyBriefing, type HomeBriefingItem } from "@/lib/home-briefing"
import { getCreatorProductEvents, getKols, getPosts, getProducts } from "@/lib/data"

const MIN_DAILY_UPDATES = 8
const MIN_EDITORIAL_CANDIDATES = 8

export interface DailyBriefingSnapshot {
  generatedAt: string
  timezone: "Asia/Ho_Chi_Minh"
  publishMode: "curated-approved-data"
  autoPublishCrawlerOutput: false
  runLabel: string
  leadStory: HomeBriefingItem | null
  counts: {
    publishedPosts: number
    dailyUpdates: number
    creatorUpdates: number
    productSignals: number
    editorialCandidates: number
    staleCreators: number
  }
  quality: {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
  dailyUpdates: Pick<HomeBriefingItem, "kind" | "title" | "href" | "date" | "label" | "sourceName">[]
  revalidatePaths: string[]
}

export async function buildDailyBriefingSnapshot(now = new Date()): Promise<DailyBriefingSnapshot> {
  const [posts, products, timelineEvents, kols] = await Promise.all([
    getPosts(),
    getProducts(),
    getCreatorProductEvents(),
    getKols(),
  ])

  const publishedPosts = posts
    .filter((post) => post.status !== "draft" && post.status !== "planned")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const briefing = buildHomeDailyBriefing({
    posts: publishedPosts,
    products,
    timelineEvents,
    kols,
  })

  const errors = [
    !briefing.leadStory ? "Daily briefing has no lead story." : null,
    briefing.dailyUpdates.length < MIN_DAILY_UPDATES ? `Daily briefing has only ${briefing.dailyUpdates.length} updates.` : null,
    briefing.editorialPlan.candidates.length < MIN_EDITORIAL_CANDIDATES ? `Daily planner has only ${briefing.editorialPlan.candidates.length} editorial candidates.` : null,
  ].filter((issue): issue is string => Boolean(issue))
  const warnings = [
    briefing.creatorUpdates.length === 0 ? "No creator updates are available for today's briefing." : null,
    briefing.productSignals.length === 0 ? "No product signals are available for today's briefing." : null,
  ].filter((issue): issue is string => Boolean(issue))

  return {
    generatedAt: now.toISOString(),
    timezone: "Asia/Ho_Chi_Minh",
    publishMode: "curated-approved-data",
    autoPublishCrawlerOutput: false,
    runLabel: formatVietnamDate(now),
    leadStory: briefing.leadStory,
    counts: {
      publishedPosts: publishedPosts.length,
      dailyUpdates: briefing.dailyUpdates.length,
      creatorUpdates: briefing.creatorUpdates.length,
      productSignals: briefing.productSignals.length,
      editorialCandidates: briefing.editorialPlan.candidates.length,
      staleCreators: briefing.staleOrNeedsUpdate.length,
    },
    quality: {
      ok: errors.length === 0,
      errors,
      warnings,
    },
    dailyUpdates: briefing.dailyUpdates.slice(0, 12).map((item) => ({
      kind: item.kind,
      title: item.title,
      href: item.href,
      date: item.date,
      label: item.label,
      sourceName: item.sourceName,
    })),
    revalidatePaths: ["/", "/blog", "/koc-tracker", "/products"],
  }
}

function formatVietnamDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date)
}
