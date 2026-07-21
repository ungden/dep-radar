import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Layers3 } from "lucide-react"

import { CatalogueFinder } from "@/components/catalogue/catalogue-finder"
import { catalogueGroups, getCatalogueSectionsByGroup } from "@/lib/catalogue"
import { absoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Chủ đề kiến thức làm đẹp",
  description: "Tìm kiến thức, lộ trình đọc và sản phẩm theo tình trạng, mong muốn và bối cảnh cá nhân.",
  alternates: { canonical: absoluteUrl("/catalogue") },
  openGraph: {
    title: "Chủ đề kiến thức làm đẹp",
    description: "Tìm kiến thức, lộ trình đọc và sản phẩm theo tình trạng, mong muốn và bối cảnh cá nhân.",
    url: absoluteUrl("/catalogue"),
    images: [absoluteUrl("/brand/social-share.jpg")],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chủ đề kiến thức làm đẹp",
    description: "Tìm kiến thức, lộ trình đọc và sản phẩm theo tình trạng, mong muốn và bối cảnh cá nhân.",
    images: [absoluteUrl("/brand/social-share.jpg")],
  },
}

export default function CataloguePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950 md:py-14">
      <div className="container mx-auto px-4 md:px-6">
        <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full bg-rose-50 px-3 text-xs font-black uppercase tracking-[0.18em] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <Layers3 className="h-4 w-4" /> 14 chủ đề · 4 nhóm
            </div>
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-6xl">Bắt đầu từ nhu cầu, không phải từ tên sản phẩm.</h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">Trả lời vài câu ngắn nếu bạn chưa rõ nên đọc gì, hoặc duyệt toàn bộ chủ đề theo bốn nhóm bên dưới.</p>
          </div>
          <a href="#all-catalogues" className="inline-flex min-h-12 items-center gap-2 text-sm font-black text-rose-600 hover:text-rose-700">Duyệt toàn bộ <ArrowRight className="h-4 w-4" /></a>
        </header>

        <section className="mt-8"><CatalogueFinder /></section>

        <div id="all-catalogues" className="mt-14 scroll-mt-36 space-y-12">
          {catalogueGroups.map((group) => {
            const sections = getCatalogueSectionsByGroup(group.slug)
            return (
              <section id={`group-${group.slug}`} key={group.slug} aria-labelledby={`group-title-${group.slug}`} className="scroll-mt-36">
                <div className="mb-5 max-w-3xl">
                  <h2 id={`group-title-${group.slug}`} className="font-display text-2xl font-black text-slate-950 dark:text-white md:text-3xl">{group.title}</h2>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">{group.description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sections.map((section) => (
                    <Link data-testid="catalogue-card" key={section.slug} href={`/catalogue/${section.slug}`} className="group flex min-h-52 flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-900">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">{group.title}</div>
                      <h3 className="mt-2 font-display text-2xl font-black text-slate-950 transition-colors group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-300">{section.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{section.description}</p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <span className="text-xs font-bold text-slate-400">{section.conditions?.length ?? section.branches.length} nhánh tình trạng</span>
                        <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-rose-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
