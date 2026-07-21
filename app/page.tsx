import { HeroSection } from "@/components/home/hero-section"
import { HomeKnowledgeDesk } from "@/components/home/home-knowledge-desk"
import { CatalogueRadar } from "@/components/home/catalogue-radar"
import { TrendingSection } from "@/components/home/trending-section"
import { KolRadar } from "@/components/home/kol-radar"
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
  const briefing = buildHomeDailyBriefing({
    posts: publishedPosts,
    products,
    timelineEvents,
    kols,
  })

  return (
    <div className="flex flex-col bg-white pb-16 dark:bg-slate-950">
      <HeroSection />
      <HomeKnowledgeDesk posts={publishedPosts} />
      <CatalogueRadar posts={publishedPosts} products={products} />
      {briefing.productSignals.length > 0 && <TrendingSection productSignals={briefing.productSignals} />}
      {briefing.creatorUpdates.length > 0 && <KolRadar creatorUpdates={briefing.creatorUpdates} />}
    </div>
  )
}
