"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Layers, Play } from "lucide-react"
import { CategoryIcon } from "@/components/category-icon"
import { VerifiedMark } from "@/components/trust"
import { Avatar } from "@/components/ui"
import { CATEGORIES, VERTICALS, categoryLabel } from "@/lib/catalog"
import { actions, useAct } from "@/lib/client-actions"
import { trackWork } from "@/lib/feed-events"
import type { VerticalFilter } from "@/lib/feed"
import { serviceOffers } from "@/lib/offers"
import { distanceToCustomer, fromPrice, proView, useApp, worksOf, type AppState } from "@/lib/store"
import type { CategoryId, Pro, Work } from "@/lib/types"
import { showsAverage } from "@/lib/connection"
import { cn, formatPrice, ratingText } from "@/lib/utils"

/** Each category's icon as a component, for places that take one (lib/design/category-icons.ts). */
export const CATEGORY_ICON = Object.fromEntries(
  CATEGORIES.map((c) => {
    const Icon = ({ className }: { className?: string }) => <CategoryIcon id={c.id} className={className} />
    Icon.displayName = `CategoryIcon(${c.id})`
    return [c.id, Icon]
  }),
) as Record<CategoryId, React.ComponentType<{ className?: string }>>

/**
 * "2,4 km" when we know where the customer is; otherwise the district, plus
 * the city when browsing the whole country ("Ba Đình" alone could be anywhere).
 */
export function whereLabel(state: AppState, pro: Pro) {
  const km = state.session?.role !== "pro" ? distanceToCustomer(state, pro.id) : null
  if (km !== null) return `${km.toLocaleString("vi-VN")} km`
  return state.city ? pro.district : `${pro.district}, ${pro.city}`
}

// ---------------------------------------------------------------------------
// Trade switch and categories

export function VerticalSwitch({
  value,
  onChange,
  className,
}: {
  value: VerticalFilter
  onChange: (v: VerticalFilter) => void
  className?: string
}) {
  const items: { id: VerticalFilter; label: string }[] = [{ id: "all", label: "Tất cả" }, ...VERTICALS]
  return (
    // Four equal places on a phone, so all trades fit without a sideways
    // scroll. A trade nobody offers yet is not flagged here: its category
    // tiles say "Sắp có".
    <div role="radiogroup" aria-label="Ngành" className={cn("grid grid-cols-4 gap-1 sm:flex sm:gap-2", className)}>
      {items.map((it) => {
        const active = value === it.id
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(it.id)}
            className={cn(
              "inline-flex h-10 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-0.5 text-[clamp(12px,3.5vw,13px)] font-semibold tracking-[-0.01em] transition-colors sm:shrink-0 sm:px-4 sm:text-[14px] sm:tracking-normal",
              active ? "bg-accent text-white" : "bg-subtle text-ink hover:bg-subtle-strong",
            )}
          >
            {it.id !== "all" && (
              <span
                aria-hidden
                className={cn(
                  "hidden size-2 rounded-full sm:block",
                  it.id === "beauty" && "bg-beauty",
                  it.id === "photo" && "bg-photo",
                  it.id === "model" && "bg-model",
                  active && "ring-2 ring-white/30",
                )}
              />
            )}
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Categories as small round photos of real work, the way people already scan
 * stories. A category with no work yet shows its icon instead of a stock image.
 */
export function CategoryBubbles({ vertical = "all", className }: { vertical?: VerticalFilter; className?: string }) {
  const state = useApp()
  const list = CATEGORIES.filter((c) => vertical === "all" || c.vertical === vertical)
  const cover = (id: CategoryId) => state.works.find((w) => w.category === id && w.images[0])?.images[0]
  return (
    <div className={cn("no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:gap-6 md:px-0", className)}>
      {list.map((c) => {
        const Icon = CATEGORY_ICON[c.id]
        const src = cover(c.id)
        return (
          <Link key={c.id} href={`/search?category=${c.id}`} className="group flex w-[68px] shrink-0 flex-col items-center gap-1.5 text-center">
            <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-subtle ring-1 ring-line transition-transform group-active:scale-95">
              {src ? (
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <Icon className="size-7 text-accent" />
              )}
            </span>
            <span className="text-[12.5px] font-medium leading-tight text-ink">{c.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

/** Kept for pages that still show the old compact row. */
export const CategoryRow = CategoryBubbles

// ---------------------------------------------------------------------------
// Posts

export function SaveWorkButton({ workId, className }: { workId: string; className?: string }) {
  const state = useApp()
  const { savedWorks, session } = state
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
        const work = state.works.find((w) => w.id === workId)
        if (work && !saved) trackWork(work.dbId, "save")
        void act(() => actions.toggleSaveWork(workId), saved ? "Đã bỏ lưu" : "Đã lưu mẫu")
      }}
      // 44px to tap, 34px to see.
      className={cn("group/save inline-flex size-11 items-center justify-center", className)}
    >
      <span className="inline-flex size-[34px] items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform group-active/save:scale-90">
        <Heart className={cn("size-[18px]", saved ? "fill-accent text-accent" : "text-ink")} />
      </span>
    </button>
  )
}

/** Counts an impression once, when at least half the card has been on screen. */
function useImpression(work: Work) {
  const ref = React.useRef<HTMLAnchorElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackWork(work.dbId, "impression")
          io.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [work.dbId])
  return ref
}

function MediaBadge({ work }: { work: Work }) {
  if (work.video)
    return (
      <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
        <Play className="size-3 fill-white" /> Clip
      </span>
    )
  if (work.kind === "before_after")
    return (
      <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
        Trước / sau
      </span>
    )
  if (work.images.length > 1)
    return (
      <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
        <Layers className="size-3" /> {work.images.length}
      </span>
    )
  return null
}

/**
 * The feed card. The photo carries it and nothing is written over it; under it,
 * the three things a customer needs before tapping: what it is, what it costs,
 * who does it and where.
 */
export function PostCard({ work, priority, className }: { work: Work; priority?: boolean; className?: string }) {
  const state = useApp()
  const pro = proView(state, work.proId)
  const ref = useImpression(work)
  if (!pro) return null
  const price = fromPrice(state, work.proId, work.templateId)
  const cover = work.kind === "before_after" && work.images[1] ? work.images[1] : work.images[0]
  return (
    <Link
      ref={ref}
      href={`/works/${work.id}`}
      className={cn(
        "group block animate-fade-up overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-raised)]",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-subtle">
        {cover && (
          <Image
            src={cover}
            alt={work.title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 290px, (min-width: 1024px) 31vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {/* A fact, not a slogan: the person has bookings switched on. */}
        {pro.acceptingJobs && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-accent backdrop-blur">
            Có thể đặt
          </span>
        )}
        <MediaBadge work={work} />
        <SaveWorkButton workId={work.id} className="absolute right-0.5 top-0.5" />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{work.title}</p>
        <p className="mt-0.5 text-[14px] text-ink">
          {price !== null ? (
            <>
              <span className="text-muted">Từ </span>
              <span className="font-semibold text-accent-dark">{formatPrice(price)}</span>
            </>
          ) : (
            <span className="text-muted">{categoryLabel(work.category)}</span>
          )}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={28} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="flex items-center gap-1 text-[13px] font-semibold text-ink">
              <span className="truncate">{pro.name}</span>
              <VerifiedMark pro={pro} className="size-3.5" />
            </p>
            <p className="truncate text-[12.5px] text-ink-soft">
              {pro.rating.count > 0 ? `${ratingText(pro.rating)} · ` : ""}
              {whereLabel(state, pro)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

/** Older names still imported by some pages. */
export const WorkFeedCard = PostCard
export const WorkCard = PostCard

// ---------------------------------------------------------------------------
// People

function TrustLine({ pro, state }: { pro: Pro; state: AppState }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-ink-soft">
      {showsAverage(pro.rating.count) ? (
        <span>
          <span className="font-semibold text-ink">★ {pro.rating.average.toFixed(1)}</span> ({pro.rating.count})
        </span>
      ) : (
        <span>{ratingText(pro.rating)}</span>
      )}
      {pro.stats.completedJobs > 0 && (
        <>
          <span aria-hidden className="text-line">•</span>
          <span>{pro.stats.completedJobs.toLocaleString("vi-VN")} lịch đã làm</span>
        </>
      )}
      <span aria-hidden className="text-line">•</span>
      <span>{whereLabel(state, pro)}</span>
    </p>
  )
}

/**
 * A person, for lists: who they are, three recent pieces of work, and the
 * facts that decide a booking. Used where a customer compares people.
 */
export function ProCard({ pro: basePro, className }: { pro: Pro; className?: string }) {
  const state = useApp()
  const pro = proView(state, basePro.id) ?? basePro
  const from = fromPrice(state, pro.id)
  const photos = worksOf(state, pro.id)
    .map((w) => w.images[0])
    .filter(Boolean)
    .slice(0, 3)
  return (
    <Link
      href={`/pros/${pro.id}`}
      className={cn("group block rounded-[var(--radius-lg)] bg-surface p-3 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-raised)]", className)}
    >
      <div className="flex items-center gap-3">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={52} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[16px] font-bold">
            <span className="truncate">{pro.name}</span>
            <VerifiedMark pro={pro} />
          </p>
          <p className="truncate text-[13px] text-muted">{pro.title || pro.categories.map(categoryLabel).join(" · ")}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted">Từ</p>
          <p className="text-[15px] font-bold">{from !== null ? formatPrice(from) : "—"}</p>
        </div>
      </div>
      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {photos.map((src, i) => (
            <span key={i} className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-sm)] bg-subtle">
              <Image src={src} alt="" fill sizes="(min-width: 768px) 140px, 30vw" className="object-cover" />
            </span>
          ))}
        </div>
      )}
      <div className="mt-2.5">
        <TrustLine pro={pro} state={state} />
      </div>
    </Link>
  )
}

/** The same person, narrower, for a horizontal row on the home page. */
export function ProTile({ pro, className }: { pro: Pro; className?: string }) {
  return <ProCard pro={pro} className={cn("w-[300px] shrink-0 md:w-auto", className)} />
}
