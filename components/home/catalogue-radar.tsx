"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Droplets,
  Filter,
  FlaskConical,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import {
  type CatalogueSection,
  catalogueSections,
  postMatchesCatalogue,
  productMatchesCatalogue,
  secondaryFilterGroups,
  topCatalogueNavigation,
} from "@/lib/catalogue"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { Post, Product } from "@/lib/types"

type CatalogueVisual = {
  image: string
  label: string
  Icon: LucideIcon
  accent: string
}

const catalogueVisuals: Record<string, CatalogueVisual> = {
  "da-mat": {
    image: "/images/editorial/huong-dan-nen-skincare-cho-nguoi-moi.jpg",
    label: "Skincare map",
    Icon: Droplets,
    accent: "from-rose-500/85 to-orange-300/70",
  },
  "tri-mun": {
    image: "/images/editorial/ban-do-tri-mun-tu-mun-an-den-mun-nang.jpg",
    label: "Acne care",
    Icon: ShieldCheck,
    accent: "from-red-500/85 to-rose-300/70",
  },
  "sang-da-chong-nang": {
    image: "/images/editorial/pillar-sang-da-va-chong-nang-an-toan.jpg",
    label: "SPF guide",
    Icon: Sparkles,
    accent: "from-amber-500/85 to-rose-300/70",
  },
  "ingredient-radar": {
    image: "/images/editorial/cach-doc-ingredient-list-cho-nguoi-moi.jpg",
    label: "Ingredient check",
    Icon: FlaskConical,
    accent: "from-cyan-600/85 to-emerald-300/70",
  },
  "product-radar": {
    image: "/images/editorial/cach-doc-review-my-pham-dang-tin.jpg",
    label: "Product shortlist",
    Icon: ScanSearch,
    accent: "from-violet-500/85 to-rose-300/70",
  },
  bodycare: {
    image: "/images/editorial/pillar-bodycare-theo-tung-vung-co-the.jpg",
    label: "Body routine",
    Icon: BadgeCheck,
    accent: "from-teal-600/85 to-cyan-300/70",
  },
}

export function CatalogueRadar({ posts, products, prompts }: { posts: Post[]; products: Product[]; prompts?: CatalogueSection[] }) {
  const featured = (prompts?.length ? prompts : topCatalogueNavigation).slice(0, 6)
  const mobileSecondary = featured.slice(3)

  return (
    <section className="container mx-auto px-4 md:px-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:rounded-3xl md:p-8">
        <div className="mb-5 flex flex-col gap-4 md:mb-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
              Tìm đúng vấn đề làm đẹp của bạn
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Bắt đầu từ trị mụn, chống nắng, tóc, makeup hay bodycare, rồi thu hẹp theo loại da và ngân sách.
            </p>
          </div>
          <Link href="/catalogue" className="inline-flex items-center gap-2 text-sm font-bold text-rose-500 hover:text-rose-600">
            Xem catalogue đầy đủ <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {featured.map((section, index) => (
            <motion.div key={section.slug} variants={itemVariants} className={`min-w-0 ${index > 2 ? "hidden sm:block" : ""}`}>
              <Link
                href={`/catalogue/${section.slug}`}
                className="group block h-full overflow-hidden rounded-2xl bg-slate-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg dark:bg-slate-950 dark:hover:bg-slate-900"
              >
                {(() => {
                  const visual = catalogueVisuals[section.slug] ?? catalogueVisuals["da-mat"]
                  const Icon = visual.Icon
                  const postCount = posts.filter((post) => postMatchesCatalogue(post, section)).length
                  const productCount = products.filter((product) => productMatchesCatalogue(product, section)).length

                  return (
                    <>
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={visual.image}
                          alt={visual.label}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-tr ${visual.accent} mix-blend-multiply`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
                        <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/92 text-slate-950 shadow-sm backdrop-blur">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">{visual.label}</div>
                          <h3 className="mt-1 font-display text-xl font-black text-white">
                            {section.shortTitle}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-white/80">
                            <span>{postCount} bài</span>
                            <span>{productCount} sản phẩm</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            {section.description}
                          </p>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-rose-500" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {section.branches.slice(0, 3).map((branch) => (
                            <Badge key={branch.title} variant="secondary" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                              {branch.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {mobileSecondary.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:hidden">
            {mobileSecondary.map((section) => (
              <Link
                key={section.slug}
                href={`/catalogue/${section.slug}`}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                {section.shortTitle}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 hidden gap-3 md:grid md:grid-cols-[1.1fr_1.9fr]">
          <div className="rounded-2xl bg-stone-950 p-5 text-stone-50">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Filter className="h-4 w-4 text-[#d8a48f]" />
              Lọc thêm
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Sau khi chọn vấn đề, thu hẹp theo loại da, ngân sách và thói quen dùng sản phẩm.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            {[...secondaryFilterGroups.audience.slice(1, 4), ...secondaryFilterGroups.skinType.slice(1, 4), ...secondaryFilterGroups.budget.slice(1, 3)].map((filter) => (
              <Badge key={filter} variant="outline" className="border-slate-200 bg-white px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {filter}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          {catalogueSections.length} chuyên mục lớn, từ da mặt và ingredient đến clinic, tools, nails và lifestyle.
        </div>
      </div>
    </section>
  )
}
