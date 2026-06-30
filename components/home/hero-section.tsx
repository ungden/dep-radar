"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Newspaper,
  PackageSearch,
  Radio,
  Sparkles,
  UsersRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { containerVariants, itemVariants } from "@/lib/animations"
import { getHomeRecencyLabel, type HomeBriefingItem, type HomeDailyBriefing } from "@/lib/home-briefing"

type HeroSectionProps = {
  briefing: HomeDailyBriefing
}

const itemIcons: Record<HomeBriefingItem["kind"], LucideIcon> = {
  article: Newspaper,
  creator: UsersRound,
  product: PackageSearch,
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
  })
}

function todayLabel() {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export function HeroSection({ briefing }: HeroSectionProps) {
  const { leadStory, dailyUpdates, creatorUpdates, productSignals, cataloguePrompts } = briefing
  const leadImage = leadStory?.image || "/brand/social-share.jpg"
  const topCreatorUpdates = creatorUpdates.slice(0, 4)
  const topProductSignals = productSignals.slice(0, 4)
  const mixedUpdates = dailyUpdates.filter((item) => item.href !== leadStory?.href).slice(0, 7)

  if (!leadStory) return null

  return (
    <section className="w-full border-b border-slate-100 bg-white py-5 dark:border-slate-800 dark:bg-slate-950 md:py-7">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
          <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                <Radio className="h-3.5 w-3.5" />
                Daily beauty briefing
              </div>
              <h1 className="font-display text-3xl font-black leading-tight tracking-normal text-slate-950 dark:text-slate-50 md:text-5xl">
                Hôm nay trong beauty
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
                Tin mới, động thái từ KOL/KOC và sản phẩm đang được bàn luận, gom lại để mở trang mỗi ngày là thấy có gì đáng theo dõi.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
              <MiniStat label="Tin mới" value={dailyUpdates.filter((item) => item.kind === "article").length} />
              <MiniStat label="KOL/KOC" value={creatorUpdates.length} />
              <MiniStat label="Tín hiệu" value={productSignals.filter((item) => item.mentions > 0).length} />
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(330px,0.95fr)_minmax(290px,0.72fr)]"
          >
            <motion.div variants={itemVariants} className="rounded-lg border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <SectionHeader
                icon={Newspaper}
                title="Bài đáng đọc hôm nay"
                href="/blog"
                action="Xem blog"
                meta={todayLabel()}
              />
              <div className="p-4 pt-0">
                <Link href={leadStory.href} className="group grid gap-4 sm:grid-cols-[168px_minmax(0,1fr)]">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 sm:aspect-square">
                    <Image
                      src={leadImage}
                      alt={leadStory.title}
                      fill
                      sizes="(min-width: 1024px) 168px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    <Badge className="absolute left-3 top-3 border-none bg-white/90 text-slate-900 shadow-sm backdrop-blur hover:bg-white">
                      {getHomeRecencyLabel(leadStory.date)}
                    </Badge>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-500">{leadStory.label}</div>
                    <h2 className="mt-2 font-display text-2xl font-black leading-tight text-slate-950 transition-colors group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                      {leadStory.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-400">
                      {leadStory.excerpt}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-50">
                      Đọc phân tích <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>

                <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {mixedUpdates.slice(0, 4).map((item) => (
                    <BriefingRow key={`${item.kind}-${item.href}-${item.title}`} item={item} compact />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-lg border border-slate-100 bg-slate-950 text-white shadow-sm dark:border-slate-800">
              <SectionHeader
                icon={UsersRound}
                title="Mới cập nhật"
                href="/koc-tracker"
                action="Theo dõi"
                meta="Tin, KOL và sản phẩm"
                inverse
              />
              <div className="space-y-3 p-4 pt-0">
                {mixedUpdates.slice(0, 5).map((item) => (
                  <BriefingCard key={`${item.kind}-${item.href}-${item.title}`} item={item} inverse />
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-lg border border-slate-100 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <SectionHeader
                icon={PackageSearch}
                title="Đang được bàn luận"
                href="/products"
                action="Dữ liệu"
                meta="Tín hiệu đã ghi nhận"
              />
              <div className="space-y-3 p-4 pt-0">
                {topProductSignals.map((signal) => (
                  <Link
                    key={signal.product.id}
                    href={`/products/${signal.product.id}`}
                    className="group grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-lg bg-white p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-950"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      <Image src={signal.product.image} alt={signal.product.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 py-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">{signal.categoryLabel}</span>
                        <span className="shrink-0 text-[11px] font-bold text-slate-400">{signal.mentions || 1} lượt nhắc</span>
                      </div>
                      <h3 className="mt-1 text-sm font-bold leading-tight text-slate-900 line-clamp-2 transition-colors group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                        {signal.product.brand} - {signal.product.name}
                      </h3>
                      <div className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-1 dark:text-slate-400">
                        {signal.creatorNames.length ? signal.creatorNames.slice(0, 2).join(", ") : "Beauty Radar"} đang theo dõi
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              <CalendarDays className="h-4 w-4 text-rose-500" />
              Theo dõi nhanh theo vấn đề
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {cataloguePrompts.map((item) => (
                <Link
                  key={item.slug}
                  href={`/catalogue/${item.slug}`}
                  className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-900 dark:hover:text-rose-300"
                >
                  {item.shortTitle}
                </Link>
              ))}
            </div>
          </motion.div>

          {topCreatorUpdates.length > 0 && (
            <motion.div variants={itemVariants} className="hidden gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900 md:grid md:grid-cols-4">
              {topCreatorUpdates.map((update) => (
                <Link key={`${update.creator.id}-${update.title}`} href={update.href} className="group flex min-w-0 items-center gap-3 rounded-md bg-white p-2 shadow-sm transition-colors hover:text-rose-600 dark:bg-slate-950 dark:hover:text-rose-300">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={update.creator.avatar} alt={update.creator.name} />
                    <AvatarFallback>{update.creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 line-clamp-1 dark:text-slate-50">{update.creator.name}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 dark:text-slate-400">{update.eventLabel}</div>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

function BriefingRow({ item, compact = false }: { item: HomeBriefingItem; compact?: boolean }) {
  const Icon = itemIcons[item.kind]

  return (
    <Link href={item.href} className="group flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Icon className="h-3.5 w-3.5" />
          {item.label}
        </div>
        <h3 className={`mt-1 font-bold leading-tight text-slate-800 transition-colors group-hover:text-rose-600 dark:text-slate-200 dark:group-hover:text-rose-300 ${compact ? "text-sm line-clamp-1" : "text-base line-clamp-2"}`}>
          {item.title}
        </h3>
      </div>
      <span className="shrink-0 text-xs text-slate-400">{formatDate(item.date)}</span>
    </Link>
  )
}

function BriefingCard({ item, inverse = false }: { item: HomeBriefingItem; inverse?: boolean }) {
  const Icon = itemIcons[item.kind]
  const hasAvatar = Boolean(item.avatar)

  return (
    <Link
      href={item.href}
      className={`group block rounded-lg border p-3 transition-colors ${
        inverse
          ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
          : "border-slate-100 bg-white hover:border-rose-100 dark:border-slate-800 dark:bg-slate-950"
      }`}
    >
      <div className="flex items-start gap-3">
        {hasAvatar ? (
          <Avatar className="h-10 w-10 shrink-0 border border-white/10">
            <AvatarImage src={item.avatar} alt={item.sourceName} />
            <AvatarFallback>{item.sourceName[0]}</AvatarFallback>
          </Avatar>
        ) : (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${inverse ? "bg-white/10 text-rose-200" : "bg-rose-50 text-rose-500"}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className={`mb-1 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wider ${inverse ? "text-slate-400" : "text-slate-400"}`}>
            <span className="line-clamp-1">{item.label}</span>
            <span className="shrink-0">{formatDate(item.date)}</span>
          </div>
          <h3 className={`text-sm font-semibold leading-tight line-clamp-2 transition-colors ${inverse ? "text-white group-hover:text-rose-200" : "text-slate-900 group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300"}`}>
            {item.title}
          </h3>
          <p className={`mt-1 text-xs leading-relaxed line-clamp-2 ${inverse ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
            {item.excerpt}
          </p>
        </div>
      </div>
    </Link>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white px-3 py-2 text-center shadow-sm dark:bg-slate-950">
      <div className="font-display text-xl font-black text-slate-950 dark:text-slate-50">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  href,
  action,
  meta,
  inverse = false,
}: {
  icon: LucideIcon
  title: string
  href: string
  action: string
  meta: string
  inverse?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Icon className={`h-4 w-4 ${inverse ? "text-rose-300" : "text-rose-500"}`} />
          {meta}
        </div>
        <h2 className={`font-display text-xl font-black leading-tight ${inverse ? "text-white" : "text-slate-950 dark:text-slate-50"}`}>{title}</h2>
      </div>
      <Link
        href={href}
        className={`inline-flex shrink-0 items-center gap-1 text-sm font-bold transition-colors ${
          inverse ? "text-rose-200 hover:text-white" : "text-rose-600 hover:text-rose-700 dark:text-rose-300"
        }`}
      >
        {action}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
