"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { BadgeCheck, Brush, Droplets, Eye, Hand, Heart, MapPin, Scissors } from "lucide-react"
import { Avatar, Rating } from "@/components/ui"
import { CATEGORIES, getPro } from "@/lib/data"
import { actions, findService, servicesFor, useApp } from "@/lib/store"
import type { CategoryId, Pro, Work } from "@/lib/types"
import { cn, formatCompact, formatPrice } from "@/lib/utils"

export const CATEGORY_ICON: Record<CategoryId, React.ComponentType<{ className?: string }>> = {
  nail: Hand,
  makeup: Brush,
  skincare: Droplets,
  hair: Scissors,
  "lash-brow": Eye,
}

export function CategoryRow({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-5 gap-1 md:flex md:gap-8", className)}>
      {CATEGORIES.map((c) => {
        const Icon = CATEGORY_ICON[c.id]
        return (
          <Link key={c.id} href={`/search?category=${c.id}`} className="group flex flex-col items-center gap-2 text-center md:w-20">
            <span className="flex size-14 items-center justify-center rounded-full bg-blush text-rose transition-colors group-hover:bg-blush-strong">
              <Icon className="size-6" />
            </span>
            <span className="text-[11.5px] leading-tight text-ink-soft md:text-xs">{c.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function SaveWorkButton({ workId, className }: { workId: string; className?: string }) {
  const { savedWorks } = useApp()
  const saved = savedWorks.includes(workId)
  return (
    <button
      type="button"
      aria-label={saved ? "Bỏ lưu" : "Lưu mẫu"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        actions.toggleSaveWork(workId)
      }}
      className={cn("inline-flex size-8 items-center justify-center rounded-full transition-colors", className)}
    >
      <Heart className={cn("size-[18px]", saved ? "fill-rose text-rose" : "text-ink-soft")} />
    </button>
  )
}

/** Large cover card used on the explore feed. */
export function WorkFeedCard({ work, priority }: { work: Work; priority?: boolean }) {
  const pro = getPro(work.proId)!
  return (
    <Link href={`/works/${work.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-blush">
        <Image
          src={work.images[0]}
          alt={work.title}
          fill
          priority={priority}
          sizes="(min-width: 768px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 pt-12">
          <p className="text-[13px] font-medium leading-snug text-white">{work.title}</p>
        </div>
        <SaveWorkButton workId={work.id} className="absolute right-2 top-2 bg-white/85 backdrop-blur" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Avatar name={pro.name} tone={pro.tone} size={28} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-medium">{pro.name}</p>
          <p className="truncate text-[11px] text-muted">{pro.title}</p>
        </div>
      </div>
    </Link>
  )
}

/** Compact card with price & rating, used in search results. */
export function WorkCard({ work }: { work: Work }) {
  const state = useApp()
  const pro = getPro(work.proId)!
  const service = findService(state, work.serviceId)
  return (
    <Link href={`/works/${work.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-blush">
        <Image src={work.images[0]} alt={work.title} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-2 flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{work.title}</p>
          <Rating value={pro.rating} count={pro.reviewCount} className="mt-0.5 text-xs" />
          {service && <p className="mt-0.5 text-[13px] font-semibold">{formatPrice(service.price)}</p>}
        </div>
        <SaveWorkButton workId={work.id} className="-mr-1.5 -mt-1.5" />
      </div>
    </Link>
  )
}

export function ProCard({ pro, className }: { pro: Pro; className?: string }) {
  const state = useApp()
  const services = servicesFor(state, pro.id)
  const from = services.length ? Math.min(...services.map((s) => s.price)) : 0
  return (
    <Link
      href={`/pros/${pro.id}`}
      className={cn("flex gap-3 rounded-[var(--radius-card)] bg-surface p-3.5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md", className)}
    >
      <Avatar name={pro.name} tone={pro.tone} size={56} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 font-semibold">
          <span className="truncate">{pro.name}</span>
          {pro.verified && <BadgeCheck className="size-4 shrink-0 fill-rose text-white" aria-label="Đã xác minh" />}
        </p>
        <p className="text-xs text-muted">{pro.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
          <Rating value={pro.rating} count={pro.reviewCount} className="text-xs" />
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {pro.district}, {pro.city}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] text-muted">Từ</p>
        <p className="text-sm font-semibold">{formatPrice(from)}</p>
        <p className="mt-1 text-[11px] text-muted">{formatCompact(pro.followers)} theo dõi</p>
      </div>
    </Link>
  )
}
