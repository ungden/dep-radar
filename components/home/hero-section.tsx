"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, Layers3, ShieldCheck } from "lucide-react"

import { CatalogueFinder } from "@/components/catalogue/catalogue-finder"
import type { HomeDailyBriefing } from "@/lib/home-briefing"

export function HeroSection({ briefing }: { briefing: HomeDailyBriefing }) {
  const articleCount = briefing.dailyUpdates.filter((item) => item.kind === "article").length

  return (
    <section className="border-b border-slate-100 bg-gradient-to-b from-white to-slate-50 py-8 dark:border-slate-800 dark:from-slate-950 dark:to-slate-950 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.72fr)_minmax(640px,1.28fr)] xl:items-start">
          <div className="pt-2">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full bg-rose-50 px-3 text-xs font-black uppercase tracking-[0.18em] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <Layers3 className="h-4 w-4" /> Catalogue kiến thức làm đẹp
            </div>
            <h1 className="mt-5 font-display text-4xl font-black leading-[1.05] tracking-tight text-slate-950 dark:text-white md:text-6xl">
              Tìm đúng kiến thức cho tình trạng của bạn.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
              Chọn một nhu cầu, thu hẹp theo tình trạng và bối cảnh cá nhân, rồi đi theo lộ trình đọc trước khi cân nhắc sản phẩm.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#finder" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-black text-white hover:bg-rose-700">
                Tìm theo tình trạng <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/catalogue" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-900 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                Xem toàn bộ catalogue
              </Link>
            </div>
            <div className="mt-7 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3 xl:grid-cols-1">
              <div className="flex min-h-11 items-center gap-2"><BookOpen className="h-4 w-4 text-rose-500" /> {articleCount} bài mới trong briefing</div>
              <div className="flex min-h-11 items-center gap-2"><Layers3 className="h-4 w-4 text-rose-500" /> 14 catalogue có lộ trình</div>
              <div className="flex min-h-11 items-center gap-2"><ShieldCheck className="h-4 w-4 text-rose-500" /> Kiến thức trước sản phẩm</div>
            </div>
          </div>
          <div id="finder" className="scroll-mt-40"><CatalogueFinder compact /></div>
        </div>
      </div>
    </section>
  )
}
