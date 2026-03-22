import { HeroSection } from "@/components/home/hero-section"
import { TrendingSection } from "@/components/home/trending-section"
import { KolRadar } from "@/components/home/kol-radar"
import { CommunityHighlights } from "@/components/home/community-highlights"

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      <HeroSection />
      <TrendingSection />
      <KolRadar />
      <CommunityHighlights />
    </div>
  )
}
