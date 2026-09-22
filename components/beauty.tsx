"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Brush, Camera, Clapperboard, Droplets, Eye, Flower2, Hand, Heart, MapPin, Package, Scissors, Smartphone, UserRound, Video } from "lucide-react"
import { VerifiedMark } from "@/components/trust"
import { Avatar, Rating } from "@/components/ui"
import { CATEGORIES } from "@/lib/catalog"
import { actions, useAct } from "@/lib/client-actions"
import { distanceToCustomer, fromPrice, proView, useApp } from "@/lib/store"
import type { CategoryId, Pro, Work } from "@/lib/types"
import { cn, formatCompact, formatPrice } from "@/lib/utils"

export const CATEGORY_ICON: Record<CategoryId, React.ComponentType<{ className?: string }>> = {
  nail: Hand,
  makeup: Brush,
  skincare: Droplets,
  hair: Scissors,
  "lash-brow": Eye,
  massage: Flower2,
  photophone: Smartphone,
  camera: Camera,
  "short-video": Clapperboard,
  "product-photo": Package,
  "model-photo": UserRound,
  "model-video": Video,
}

export function CategoryRow({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-6 gap-1 md:flex md:gap-8", className)}>
      {CATEGORIES.map((c) => {
        const Icon = CATEGORY_ICON[c.id]
        return (
          <Link key={c.id} href={`/search?category=${c.id}`} className="group flex flex-col items-center gap-2 text-center md:w-20">
            <span className="flex size-12 items-center justify-center rounded-full bg-subtle text-accent transition-colors group-hover:bg-subtle-strong md:size-14">
              <Icon className="size-5 md:size-6" />
            </span>
            <span className="text-[11px] leading-tight text-ink-soft md:text-xs">{c.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function SaveWorkButton({ workId, className }: { workId: string; className?: string }) {
  const { savedWorks, session } = useApp()
  const act = useAct()
  const saved = savedWorks.includes(workId)
  return (
    <button
      type="button"
      aria-label={saved ? "Bỏ lưu" : "Lưu mẫu"}
      aria-pressed={saved}
      // Saving needs an account, so send a visitor to sign in rather than
      // pretending the heart stuck.
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!session) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
          return
        }
        void act(() => actions.toggleSaveWork(workId), saved ? "Đã bỏ lưu" : "Đã lưu mẫu")
      }}
      className={cn("inline-flex size-8 items-center justify-center rounded-full transition-colors", className)}
    >
      <Heart className={cn("size-[18px]", saved ? "fill-accent text-accent" : "text-ink-soft")} />
    </button>
  )
}

/** Large cover card used on the explore feed. */
export function WorkFeedCard({ work, priority }: { work: Work; priority?: boolean }) {
  const state = useApp()
  const pro = proView(state, work.proId)
  if (!pro) return null
  return (
    <Link href={`/works/${work.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-subtle">
        <Image
          src={work.images[0]}
          alt={work.title}
          fill
          priority={priority}
          sizes="(min-width: 768px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-12">
          <p className="text-[13px] font-medium leading-snug text-white">{work.title}</p>
        </div>
        <SaveWorkButton workId={work.id} className="absolute right-2 top-2 bg-white/85 backdrop-blur" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={28} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="flex items-center gap-1 truncate text-[13px] font-medium">
            <span className="truncate">{pro.name}</span>
            <VerifiedMark pro={pro} className="size-3.5" />
          </p>
          <p className="text-[11px] text-muted">
            <span className="text-ink">★ {pro.rating.average.toFixed(1)}</span> · {pro.stats.completedJobs} job
          </p>
        </div>
      </div>
    </Link>
  )
}

/** Compact card with price & rating, used in search results. */
export function WorkCard({ work }: { work: Work }) {
  const state = useApp()
  const pro = proView(state, work.proId)
  const price = fromPrice(state, work.proId, work.templateId)
  if (!pro) return null
  return (
    <Link href={`/works/${work.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-subtle">
        <Image src={work.images[0]} alt={work.title} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-2 flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{work.title}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted">
            {pro.name} <VerifiedMark pro={pro} className="size-3" />
          </p>
          <Rating value={pro.rating.average} count={pro.rating.count} className="mt-0.5 text-xs" />
          {price !== null && <p className="mt-0.5 text-[13px] font-semibold">Từ {formatPrice(price)}</p>}
        </div>
        <SaveWorkButton workId={work.id} className="-mr-1.5 -mt-1.5" />
      </div>
    </Link>
  )
}

export function ProCard({ pro: basePro, className }: { pro: Pro; className?: string }) {
  const state = useApp()
  const pro = proView(state, basePro.id) ?? basePro
  const from = fromPrice(state, pro.id)
  const km = state.session?.role !== "pro" ? distanceToCustomer(state, pro.id) : null
  return (
    <Link
      href={`/pros/${pro.id}`}
      className={cn("block rounded-[var(--radius-card)] bg-surface p-3.5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md", className)}
    >
      <div className="flex gap-3">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={60} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-semibold">
            <span className="truncate">{pro.name}</span>
            <VerifiedMark pro={pro} />
          </p>
          <p className="text-xs text-muted">{pro.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-soft">
            <Rating value={pro.rating.average} count={pro.rating.count} className="text-xs" />
            <span>{formatCompact(pro.stats.completedJobs)} job</span>
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="size-3.5" />
              {km !== null ? `${km.toLocaleString("vi-VN")} km` : `${pro.district}, ${pro.city}`}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] text-muted">Từ</p>
          <p className="text-sm font-semibold">{from !== null ? formatPrice(from) : "—"}</p>
        </div>
      </div>
    </Link>
  )
}
