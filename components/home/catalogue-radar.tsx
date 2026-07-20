"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { catalogueGroups, getCatalogueSectionsByGroup, postMatchesCatalogue, productMatchesCatalogue } from "@/lib/catalogue"
import { trackEvent } from "@/lib/analytics"
import type { CatalogueSection } from "@/lib/catalogue"
import type { Post, Product } from "@/lib/types"

export function CatalogueRadar({ posts, products }: { posts: Post[]; products: Product[]; prompts?: CatalogueSection[] }) {
  return (
    <section className="container mx-auto px-4 md:px-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">Thư viện chính</div>
          <h2 className="mt-2 font-display text-3xl font-black text-slate-950 dark:text-white">Toàn bộ catalogue kiến thức</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">14 hub được nhóm theo cách bạn ra quyết định, không xếp thành một danh sách phẳng.</p>
        </div>
        <Link href="/catalogue" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-rose-600 hover:text-rose-700">Xem trang catalogue <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {catalogueGroups.map((group) => (
          <div key={group.slug} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <h3 className="font-display text-xl font-black text-slate-950 dark:text-white">{group.title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.description}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {getCatalogueSectionsByGroup(group.slug).map((section) => {
                const postCount = posts.filter((post) => postMatchesCatalogue(post, section)).length
                const productCount = products.filter((product) => productMatchesCatalogue(product, section)).length
                return (
                  <Link key={section.slug} href={`/catalogue/${section.slug}`} onClick={() => trackEvent("select_catalogue", { hub: section.slug, source: "homepage_group" })} className="group flex min-h-20 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-950/30">
                    <span>
                      <span className="block font-bold text-slate-900 group-hover:text-rose-700 dark:text-white dark:group-hover:text-rose-300">{section.shortTitle}</span>
                      <span className="mt-1 block text-xs text-slate-400">{postCount} bài{productCount > 0 ? ` · ${productCount} sản phẩm` : ""}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-rose-500" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
