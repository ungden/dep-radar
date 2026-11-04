"use client"

import { isNewArtist } from "@/lib/discovery"
import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, MapPin, Star } from "lucide-react"
import { CATALOG, getTemplate, serviceDuration, serviceQuantity } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import { showsAverage } from "@/lib/connection"
import { CATEGORY_TINTS } from "@/lib/design/category-icons"
import { categoryPhoto } from "@/lib/design/photos"
import { CITIES } from "@/lib/geo"
import { serviceLocationOpen } from "@/lib/launch"
import type { ServiceOffer } from "@/lib/offers"
import type { Category, CategoryId, Pro, ProService, ServiceTemplate } from "@/lib/types"
import { cn, formatDuration, formatPrice } from "@/lib/utils"

/**
 * The pieces the customer's pages share with the app: flat white cards on the
 * grouped background, photos first (apps/mobile/src/components/tiles.tsx).
 */

/** What an Artist with no picture of their own shows. Never initials. */
export const DEFAULT_ARTIST_AVATAR = "/brand/icon-512-maskable.png"

/** A word over an illustration, so it is never taken for someone's work. */
export function IllustrationBadge({ className }: { className?: string }) {
  return <span className={cn("absolute z-10 rounded-full bg-black/55 px-2.5 py-0.5 text-[13px] font-semibold leading-[18px] text-white", className)}>Ảnh minh hoạ</span>
}

/** The tile's label: two short lines fit, and the English shorts read worse than these two Vietnamese names. */
export const categoryName = (c: Category) => (c.id === "photophone" || c.id === "skincare" ? c.label : (c.short ?? c.label))

/** A category as a round photo in its own coloured ring. A link on the home page, a choice in the order flow. */
export function CategoryBubble({
  category,
  photo,
  href,
  onClick,
  active,
  className,
  radio,
}: {
  category: Category
  photo: string
  href?: string
  onClick?: () => void
  active?: boolean
  className?: string
  /** Inside a radiogroup: the props that make it a keyboard-reachable choice. */
  radio?: React.ButtonHTMLAttributes<HTMLButtonElement>
}) {
  const inner = (
    <>
      <span
        className="block rounded-full border-2 p-[3px] transition-transform duration-200 group-hover:-translate-y-0.5"
        style={{ borderColor: active ? "var(--color-ink)" : CATEGORY_TINTS[category.id].fg }}
      >
        <span className="relative block size-[66px] overflow-hidden rounded-full md:size-[80px]" style={{ background: CATEGORY_TINTS[category.id].bg }}>
          <Image src={photo} alt="" fill sizes="160px" className="object-cover" />
        </span>
      </span>
      <span className={cn("block text-center text-meta leading-[20px] md:text-[16px]", active ? "font-bold text-ink" : "font-medium text-ink")}>{categoryName(category)}</span>
    </>
  )
  const classes = cn("group flex w-[84px] shrink-0 flex-col items-center gap-2 md:w-[100px]", className)
  if (href)
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    )
  return (
    <button type="button" onClick={onClick} className={classes} {...radio}>
      {inner}
    </button>
  )
}

const tileClass = "group flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-surface transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"

function TilePhoto({ src, illustration, priority }: { src: string; illustration: boolean; priority?: boolean }) {
  return (
    <span className="relative block aspect-[6/5] overflow-hidden bg-subtle">
      <Image src={src} alt="" fill priority={priority} sizes="(min-width: 1024px) 280px, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      {illustration && <IllustrationBadge className="bottom-2.5 left-2.5" />}
    </span>
  )
}

function TileText({ name, price, duration }: { name: string; price: string; duration: string }) {
  return (
    <span className="block p-3.5 md:px-[18px] md:py-4">
      <span className="line-clamp-2 block text-body font-bold leading-snug tracking-[-0.01em]">{name}</span>
      <span className="mt-1 block text-meta tabular-nums text-ink-soft">
        Từ <b className="font-bold text-accent-dark">{price}</b> · {duration}
      </span>
    </span>
  )
}

/** A service someone here offers: its real lowest price, and a real photo when there is one. */
export function ServiceTile({ offer, index = 0, priority }: { offer: ServiceOffer; index?: number; priority?: boolean }) {
  const { template, fromPrice, variant, durationMin, minimumQuantity } = offer
  return (
    <Link href={`/dich-vu/${template.id}`} className={tileClass}>
      <TilePhoto src={offer.photo ?? categoryPhoto(template.category, index)} illustration={!offer.photo} priority={priority} />
      <TileText
        name={template.name}
        price={`${formatPrice(fromPrice)}${variant.perPerson ? "/người" : ""}`}
        duration={`${formatDuration(durationMin)}${minimumQuantity > 1 ? ` · tối thiểu ${minimumQuantity} người` : ""}`}
      />
    </Link>
  )
}

/** A catalogue service nobody here offers yet. 360đẹp sets the price bands, so "từ" is true; it can still be requested. */
export function CatalogTile({ template, index = 0, priority }: { template: ServiceTemplate; index?: number; priority?: boolean }) {
  const start = [...template.variants].sort((a, b) => a.tiers[0] - b.tiers[0])[0]
  return (
    <Link href={`/dich-vu/${template.id}`} className={tileClass}>
      <TilePhoto src={categoryPhoto(template.category, index)} illustration priority={priority} />
      <TileText name={template.name} price={`${formatPrice(start.tiers[0])}${start.perPerson ? "/người" : ""}`} duration={formatDuration(serviceDuration(start, serviceQuantity(start)))} />
    </Link>
  )
}

/** Catalogue services nobody here offers yet, to fill a grid: one per category first, so it shows the range. */
export function notYetOffered(offers: readonly ServiceOffer[], categories: readonly Category[], studioBookingOpen: boolean | undefined, limit: number): ServiceTemplate[] {
  const offered = new Set(offers.map((o) => o.template.id))
  const inScope = new Set(categories.map((c) => c.id))
  const open = CATALOG.filter((t) => inScope.has(t.category) && !t.addon && !offered.has(t.id) && serviceLocationOpen(t, studioBookingOpen))
  const firsts: ServiceTemplate[] = []
  const seen = new Set<CategoryId>()
  for (const t of open) {
    if (seen.has(t.category)) continue
    seen.add(t.category)
    firsts.push(t)
  }
  return [...firsts, ...open.filter((t) => !firsts.includes(t))].slice(0, Math.max(0, limit))
}

/** Where the customer is looking, on a white field. The whole site reads this choice (a cookie). */
export function CitySelect({ value, variant = "field", className }: { value: string | null; variant?: "field" | "chip" | "bar"; className?: string }) {
  return (
    <label
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
        variant === "field" && "h-[46px] w-full justify-between rounded-xl bg-surface px-3.5 text-body",
        variant === "chip" && "h-10 gap-1 rounded-full bg-surface pl-3 pr-2.5 text-meta font-semibold",
        variant === "bar" && "h-11 min-w-0 gap-1 px-1.5 text-meta font-semibold text-accent-dark",
        className,
      )}
    >
      {variant !== "field" && <MapPin className="size-4 shrink-0 text-accent" aria-hidden />}
      <span className="truncate">{value ?? "Toàn quốc"}</span>
      <ChevronDown className="size-4 shrink-0" aria-hidden />
      <select
        aria-label="Chọn khu vực"
        value={value ?? ""}
        onChange={(e) => void actions.setCity(e.target.value || null)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">Toàn quốc</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  )
}

/** The lowest listed price of a person, for one service or across what they offer. */
export function artistFromPrice(services: readonly ProService[], proId: string, templateId: string | undefined, studioBookingOpen: boolean | undefined): number | null {
  let min: number | null = null
  for (const s of services) {
    if (s.proId !== proId || !s.active) continue
    const template = getTemplate(s.templateId)
    if (!serviceLocationOpen(template, studioBookingOpen)) continue
    if (templateId ? s.templateId !== templateId : template?.addon) continue
    for (const price of Object.values(s.prices)) if (min === null || price < min) min = price
  }
  return min
}

export const formatKm = (km: number) => `${km.toFixed(1).replace(".", ",")} km`

function CardTag({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={cn("inline-flex max-w-full rounded-full px-3 py-1 text-[15px] font-semibold leading-[20px]", className)}>{children}</span>
}

/**
 * An Artist in a list: their own work on top, then who they are, real reviews
 * and their price. A picture under a name reads as that person's work, so with
 * nothing posted yet the card says so and labels the illustration.
 */
export function ArtistCard({
  pro,
  photos,
  photoCount,
  services,
  illustrationOf,
  price,
  km,
  href,
  priority,
}: {
  pro: Pro
  /** Their own work, up to three, the chosen service's first. */
  photos: string[]
  /** All their posts, for "+12 ảnh". */
  photoCount: number
  /** What they offer, the chosen service first. */
  services: string[]
  illustrationOf: CategoryId
  price: number | null
  km: number | null
  href: string
  /** In the first screenful. */
  priority?: boolean
}) {
  const reviewed = showsAverage(pro.rating.count)
  const isNew = isNewArtist(pro)
  const extra = photoCount - photos.length
  const facts = [pro.stats.completedJobs > 0 ? `${pro.stats.completedJobs} lịch` : null, km !== null ? `Cách bạn ${formatKm(km)}` : pro.district].filter(Boolean).join(" · ")
  return (
    <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] bg-surface transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
      {photos.length ? (
        <span className="flex h-[196px] gap-[3px]">
          <span className="relative flex-[2] bg-subtle">
            <Image src={photos[0]} alt="" fill priority={priority} sizes="(min-width: 1280px) 180px, (min-width: 640px) 30vw, 66vw" className="object-cover" />
          </span>
          {photos.length > 1 && (
            <span className="flex flex-1 flex-col gap-[3px]">
              <span className="relative flex-1 bg-subtle">
                <Image src={photos[1]} alt="" fill sizes="(min-width: 1280px) 90px, 33vw" className="object-cover" />
              </span>
              {photos[2] && (
                <span className="relative flex-1 bg-subtle">
                  <Image src={photos[2]} alt="" fill sizes="(min-width: 1280px) 90px, 33vw" className="object-cover" />
                  {extra > 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[15px] font-bold text-white">+{extra} ảnh</span>}
                </span>
              )}
            </span>
          )}
        </span>
      ) : (
        <span className="relative block h-[196px] bg-subtle">
          <Image src={categoryPhoto(illustrationOf, pro.name.length % 3)} alt="" fill priority={priority} sizes="(min-width: 1280px) 280px, (min-width: 640px) 45vw, 100vw" className="object-cover" />
          <IllustrationBadge className="right-3 top-3" />
        </span>
      )}

      <span className="flex flex-1 flex-col gap-3.5 px-5 pb-5">
        <span className="-mt-9 flex items-end justify-between gap-2">
          <span className="relative z-10 block size-[72px] shrink-0 rounded-full bg-surface p-[3px]">
            <span className="relative block size-full overflow-hidden rounded-full" style={{ background: pro.tone }}>
              <Image src={pro.avatar || DEFAULT_ARTIST_AVATAR} alt="" fill sizes="132px" className="object-cover" />
            </span>
          </span>
          {pro.identity === "verified" ? (
            <CardTag className="bg-success-soft text-success">Đã xác minh</CardTag>
          ) : isNew ? (
            <CardTag className="bg-highlight-soft text-ink">Artist mới</CardTag>
          ) : null}
        </span>

        <span className="block">
          <span className="block truncate text-[22px] font-bold leading-tight tracking-[-0.02em]">{pro.name}</span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-meta text-ink-soft">
            {reviewed && (
              <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
                <Star className="size-3.5 fill-highlight text-[#D9A21F]" aria-hidden />
                <b className="font-semibold text-ink">{pro.rating.average.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b>({pro.rating.count})
              </span>
            )}
            <span className="truncate">
              {reviewed && facts ? "· " : ""}
              {facts}
            </span>
          </span>
          {photos.length === 0 && <span className="mt-0.5 block text-meta text-muted">Chưa đăng tác phẩm</span>}
        </span>

        {services.length > 0 && (
          <span className="flex flex-wrap gap-2">
            {services.slice(0, 2).map((name) => (
              <CardTag key={name} className="bg-accent-soft text-accent-dark">
                {name}
              </CardTag>
            ))}
            {services.length > 2 && <CardTag className="bg-accent-soft text-accent-dark">+{services.length - 2} dịch vụ</CardTag>}
          </span>
        )}

        <span className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3.5">
          {price !== null ? (
            <span className="block min-w-0">
              <span className="block text-meta text-muted">Giá từ</span>
              <span className="block whitespace-nowrap text-[22px] font-bold leading-tight tabular-nums tracking-[-0.02em] text-accent-dark">{formatPrice(price)}</span>
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex h-11 shrink-0 items-center rounded-full bg-accent-soft px-[18px] text-meta font-bold text-accent-dark transition-colors group-hover:bg-[#F8DCE6]">Xem và đặt</span>
        </span>
      </span>
    </Link>
  )
}
