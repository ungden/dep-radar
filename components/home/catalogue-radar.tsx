"use client"

import Link from "next/link"
import { ArrowRight, Filter } from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { catalogueSections, secondaryFilterGroups, topCatalogueNavigation } from "@/lib/catalogue"
import { containerVariants, itemVariants } from "@/lib/animations"

export function CatalogueRadar() {
  const featured = topCatalogueNavigation.slice(0, 6)

  return (
    <section className="container mx-auto px-4 md:px-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
              Tìm theo nhu cầu, không chia nam/nữ trước
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Chọn vấn đề làm đẹp trước, rồi lọc theo loại da, ngân sách, tuổi hoặc đối tượng.
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
          {featured.map((section) => (
            <motion.div key={section.slug} variants={itemVariants}>
              <Link
                href={`/catalogue/${section.slug}`}
                className="group block h-full rounded-2xl bg-slate-50 p-5 transition-colors hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-950/20"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                    {section.shortTitle}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-rose-500" />
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {section.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {section.branches.slice(0, 3).map((branch) => (
                    <Badge key={branch.title} variant="secondary" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {branch.title}
                    </Badge>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Filter className="h-4 w-4 text-rose-500" />
            Filter phụ:
          </div>
          <div className="flex flex-wrap gap-2">
            {[...secondaryFilterGroups.audience.slice(1, 4), ...secondaryFilterGroups.skinType.slice(1, 4), ...secondaryFilterGroups.budget.slice(1, 3)].map((filter) => (
              <Badge key={filter} variant="outline" className="border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
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
