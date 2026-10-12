"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { CategoryIcon } from "@/components/category-icon"
import { Avatar } from "@/components/ui"
import { categoryLabel, serviceDuration, serviceQuantity } from "@/lib/catalog"
import { CATEGORY_TINTS } from "@/lib/design/category-icons"
import { categoryPhoto } from "@/lib/design/photos"
import type { ServiceOffer } from "@/lib/offers"
import type { ServiceTemplate } from "@/lib/types"
import { cn, formatDuration, formatPrice } from "@/lib/utils"

const cardClass =
  "group flex animate-fade-up flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"

/** The category, as a small tinted label over the photo. */
function CategoryTag({ template }: { template: ServiceTemplate }) {
  const tint = CATEGORY_TINTS[template.category]
  return (
    <span
      className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full py-0.5 pl-1 pr-2 text-[11px] font-bold shadow-sm sm:left-3 sm:top-3 sm:gap-1.5 sm:py-1 sm:pl-1.5 sm:pr-2.5 sm:text-[11.5px]"
      style={{ background: tint.bg, color: tint.fg }}
    >
      <CategoryIcon id={template.category} className="size-3.5 sm:size-4" />
      {categoryLabel(template.category)}
    </span>
  )
}

/**
 * One thing for sale: the service, a real photo of it, the lowest real price
 * near the customer, and who offers it. The whole card opens the service,
 * where the customer picks a person and books. Used on the home page and in
 * the "Dịch vụ" tab of search.
 */
export function ServiceCard({ offer, priority, href }: { offer: ServiceOffer; priority?: boolean; href?: string }) {
  const { template, pros, fromPrice } = offer
  // Without a real photo the card borrows its category's illustration and says so.
  const photo = offer.photo ?? categoryPhoto(template.category)
  return (
    <Link href={href ?? `/dich-vu/${template.id}`} className={cardClass}>
      <div className="relative aspect-square overflow-hidden bg-subtle sm:aspect-[4/3]">
        <Image
          src={photo}
          alt={template.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 290px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <CategoryTag template={template} />
        {!offer.photo && <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur sm:bottom-2.5 sm:right-2.5 sm:text-[11px]">Ảnh minh hoạ</span>}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.01em] sm:text-card-title">{template.name}</p>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-meta">
          <span className="text-muted">Từ</span>
          <span className="whitespace-nowrap text-[17px] font-extrabold tracking-tight text-ink sm:text-price">{formatPrice(fromPrice)}{offer.variant.perPerson ? "/người" : ""}</span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-muted"><Clock className="size-3.5" aria-hidden />{formatDuration(offer.durationMin)}</span>
        </p>
        {offer.minimumQuantity > 1 && <p className="mt-1 text-meta text-ink-soft">Tối thiểu {offer.minimumQuantity} người · từ {formatPrice(offer.minimumTotal)}/nhóm</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="flex min-w-0 items-center gap-2 text-meta font-medium text-ink-soft">
            <span className="hidden -space-x-1.5 min-[400px]:flex">
              {pros.slice(0, 3).map((p) => (
                <Avatar key={p.id} name={p.name} tone={p.tone} src={p.avatar} size={24} className="ring-2 ring-surface" />
              ))}
            </span>
            <span className="truncate">{pros.length === 1 ? pros[0].name : `${pros.length} người nhận`}</span>
          </span>
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-ink px-3.5 py-2 text-meta font-semibold text-white transition-colors group-hover:bg-accent sm:inline-flex">
            Xem giá <ArrowRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * A catalogue service nobody nearby offers yet. 360đẹp sets the price bands,
 * so the starting price is real even with no one to book: the card says so,
 * and leads to the service page, where the customer can post a request.
 */
export function CatalogCard({ template, index = 0, priority }: { template: ServiceTemplate; index?: number; priority?: boolean }) {
  const start = [...template.variants].sort((a, b) => a.tiers[0] - b.tiers[0])[0]
  return (
    <Link href={`/dich-vu/${template.id}`} className={cardClass}>
      <div className="relative aspect-square overflow-hidden bg-subtle sm:aspect-[4/3]">
        <Image
          src={categoryPhoto(template.category, index)}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 290px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <CategoryTag template={template} />
        <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur sm:bottom-2.5 sm:right-2.5 sm:text-[11px]">Ảnh minh hoạ</span>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.01em] sm:text-card-title">{template.name}</p>
        <p className="mt-1 line-clamp-2 hidden text-meta text-ink-soft sm:block">{template.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:pt-4">
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-label font-medium text-muted">
              <Clock className="size-3.5" aria-hidden />
              {formatDuration(serviceDuration(start, serviceQuantity(start)))} · giá từ
            </span>
            <span className="mt-0.5 block whitespace-nowrap text-[17px] font-extrabold tracking-tight sm:text-price">{formatPrice(start.tiers[0])}{start.perPerson ? "/người" : ""}</span>
          </span>
          <span className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-white sm:inline-flex">
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}
