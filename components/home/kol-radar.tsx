"use client"

import Image from "next/image"
import Link from "next/link"
import { CalendarDays, ChevronRight, CircleCheck, Radio } from "lucide-react"
import { motion } from "motion/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PlatformBadge } from "@/components/platform-badge"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { HomeCreatorUpdate } from "@/lib/home-briefing"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
  })
}

export function KolRadar({ creatorUpdates }: { creatorUpdates: HomeCreatorUpdate[] }) {
  const latestUpdates = creatorUpdates.slice(0, 6)

  return (
    <section className="bg-slate-100 py-12 dark:bg-slate-900/50 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 md:mb-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600 shadow-sm dark:bg-slate-900 dark:text-rose-300">
              <Radio className="h-3.5 w-3.5" />
              Luồng KOL/KOC
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
              Tin mới từ KOL/KOC
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
              Video đánh giá, quy trình chăm sóc mới, sản phẩm được nhắc và các nguồn công khai đáng chú ý trong ngày.
            </p>
          </div>
          <Link href="/koc-tracker" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400">
              Xem dòng tin KOL/KOC <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {latestUpdates.map((update) => (
            <motion.div key={`${update.creator.id}-${update.title}`} variants={itemVariants}>
              <Card className="h-full overflow-hidden border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 p-0 dark:border-slate-800">
                  <Link href={update.href} className="group flex items-center gap-4 p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-md ring-2 ring-slate-50 transition-all group-hover:ring-rose-100 dark:border-slate-900 dark:ring-slate-800 dark:group-hover:ring-rose-900/30">
                      <AvatarImage src={update.creator.avatar} alt={update.creator.name} />
                      <AvatarFallback>{update.creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-extrabold text-slate-900 transition-colors group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-400">
                          {update.creator.name}
                        </h3>
                        {update.creator.verified && <CircleCheck aria-label="Kênh public đã được đối chiếu" className="h-4 w-4 shrink-0 text-blue-500" />}
                        <PlatformBadge platform={update.creator.platform} />
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(update.date)}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-rose-500 dark:text-slate-600 dark:group-hover:text-rose-400" />
                  </Link>
                </CardHeader>
                <CardContent className="p-5">
                  {update.product && (
                    <Link href={`/products/${update.product.id}`} className="group mb-4 flex gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                        <Image src={update.product.image} alt={update.product.name} fill sizes="80px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-rose-500">{update.product.brand}</div>
                        <h4 className="font-semibold leading-tight text-slate-900 line-clamp-2 transition-colors group-hover:text-rose-500 dark:text-slate-50 dark:group-hover:text-rose-400">
                          {update.product.name}
                        </h4>
                        <div className="mt-2 text-xs font-semibold text-slate-400">{update.product.category}</div>
                      </div>
                    </Link>
                  )}

                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge className="border-none bg-slate-900 text-white hover:bg-slate-900 dark:bg-slate-50 dark:text-slate-900">
                        {update.eventLabel}
                      </Badge>
                      <Badge className="border-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {update.toneLabel}
                      </Badge>
                      <Badge variant="secondary" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        {update.disclosureLabel}
                      </Badge>
                    </div>
                    <h4 className="mb-2 text-sm font-bold leading-tight text-slate-900 line-clamp-2 dark:text-slate-50">
                      {update.title}
                    </h4>
                    <p className="text-sm italic leading-relaxed text-slate-700 line-clamp-3 dark:text-slate-300">
                      &quot;{update.excerpt}&quot;
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
