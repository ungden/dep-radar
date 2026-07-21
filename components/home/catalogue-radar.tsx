"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { catalogueGroups, getCatalogueSectionsByGroup, postMatchesCatalogue, productMatchesCatalogue } from "@/lib/catalogue"
import { trackEvent } from "@/lib/analytics"
import type { Post, Product } from "@/lib/types"

const groupImages: Record<string, string> = {
  "skin-treatment": "/images/catalogue/skincare-foundation.jpg",
  "hair-body": "/images/catalogue/hair-body-grooming.jpg",
  "makeup-fragrance": "/images/catalogue/makeup-fragrance-tech.jpg",
  "lifestyle-services-tech": "/images/catalogue/acne-sun-education.jpg",
}

export function CatalogueRadar({ posts, products }: { posts: Post[]; products: Product[] }) {
  return (
    <section className="border-b border-stone-200 bg-[#f7f4f1] py-14 dark:border-slate-800 dark:bg-slate-900/50 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 max-w-2xl md:mb-10">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300">Thư viện 360°</p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white md:text-4xl">
            Đi thẳng vào nhóm kiến thức bạn cần
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
            14 chủ đề được gom thành bốn lối vào rõ ràng. Mỗi chủ đề có lộ trình đọc và sản phẩm đã được phân loại.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {catalogueGroups.map((group) => {
            const sections = getCatalogueSectionsByGroup(group.slug)
            const groupPosts = new Set(sections.flatMap((section) => posts.filter((post) => postMatchesCatalogue(post, section)).map((post) => post.slug))).size
            const groupProducts = new Set(sections.flatMap((section) => products.filter((product) => productMatchesCatalogue(product, section)).map((product) => product.id))).size

            return (
              <Link
                key={group.slug}
                href={`/catalogue#group-${group.slug}`}
                onClick={() => trackEvent("select_catalogue", { group: group.slug, source: "homepage_group" })}
                className="group relative min-h-[290px] overflow-hidden rounded-[1.75rem] bg-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-4 md:min-h-[340px]"
              >
                <Image
                  src={groupImages[group.slug]}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 text-white md:p-8">
                  <span>
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
                      {sections.length} chủ đề · {groupPosts} bài{groupProducts > 0 ? ` · ${groupProducts} sản phẩm` : ""}
                    </span>
                    <span className="mt-2 block max-w-md font-display text-2xl font-black leading-tight tracking-[-0.025em] md:text-3xl">
                      {group.title}
                    </span>
                  </span>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-7 text-center">
          <Link href="/catalogue" className="inline-flex min-h-11 items-center text-sm font-black text-rose-600 hover:text-rose-700">
            Xem toàn bộ 14 chủ đề <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
