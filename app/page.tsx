import { HeroSection } from "@/components/home/hero-section"
import { CatalogueRadar } from "@/components/home/catalogue-radar"
import { TrendingSection } from "@/components/home/trending-section"
import { KolRadar } from "@/components/home/kol-radar"
import { CommunityHighlights } from "@/components/home/community-highlights"
import { getCreatorProductEvents, getKols, getPosts, getProducts } from "@/lib/data"
import { buildHomeDailyBriefing } from "@/lib/home-briefing"

export const revalidate = 3600

export default async function HomePage() {
  const [posts, products, timelineEvents, kols] = await Promise.all([
    getPosts(),
    getProducts(),
    getCreatorProductEvents(),
    getKols(),
  ])

  const publishedPosts = posts
    .filter((post) => post.status !== "draft" && post.status !== "planned")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const latestPosts = publishedPosts.slice(0, 6)
  const briefing = buildHomeDailyBriefing({
    posts: publishedPosts,
    products,
    timelineEvents,
    kols,
  })

  return (
    <div className="flex flex-col gap-10 pb-16 md:gap-14">
      <HeroSection briefing={briefing} />
      <CatalogueRadar posts={publishedPosts} products={products} prompts={briefing.cataloguePrompts} />
      {briefing.productSignals.length > 0 && <TrendingSection productSignals={briefing.productSignals} />}
      {briefing.creatorUpdates.length > 0 && <KolRadar creatorUpdates={briefing.creatorUpdates} />}
      {briefing.dailyUpdates.length > 0 && <CommunityHighlights posts={latestPosts} dailyUpdates={briefing.dailyUpdates} />}
    </div>
  )
}
