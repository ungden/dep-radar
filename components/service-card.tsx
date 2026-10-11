"use client"

import Image from "next/image"
import Link from "next/link"
import { CATEGORY_ICON } from "@/components/beauty"
import { Avatar } from "@/components/ui"
import type { ServiceOffer } from "@/lib/offers"
import { cn, formatDuration, formatPrice } from "@/lib/utils"

/**
 * One thing for sale: the service, a real photo of it, the lowest real price
 * near the customer, and who offers it. The whole card opens the service,
 * where the customer picks a person and books. Used on the home page and in
 * the "Dịch vụ" tab of search.
 */
export function ServiceCard({ offer, priority }: { offer: ServiceOffer; priority?: boolean }) {
  const { template, pros, fromPrice, photo } = offer
  const shortest = Math.min(...template.variants.map((v) => v.durationMin))
  const Icon = CATEGORY_ICON[template.category]
  return (
    <Link
      href={`/dich-vu/${template.id}`}
      className="group block animate-fade-up overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-raised)]"
    >
      <div className={cn("relative overflow-hidden bg-subtle", photo ? "aspect-[4/3]" : "aspect-[16/7]")}>
        {photo ? (
          <Image
            src={photo}
            alt={template.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 290px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <Icon className="size-12 text-accent" />
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <p className="line-clamp-2 text-card-title font-semibold leading-snug">{template.name}</p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-meta">
          <span className="text-muted">Từ </span>
          <span className="text-price font-bold text-ink">{formatPrice(fromPrice)}</span>
          <span className="text-muted">{formatDuration(shortest)}</span>
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-meta text-ink-soft">
            <span className="hidden -space-x-1.5 sm:flex">
              {pros.slice(0, 3).map((p) => (
                <Avatar key={p.id} name={p.name} tone={p.tone} src={p.avatar} size={20} className="ring-2 ring-surface" />
              ))}
            </span>
            <span className="truncate">{pros.length === 1 ? pros[0].name : `${pros.length} người nhận`}</span>
          </span>
          <span className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-meta font-semibold text-white transition-colors group-hover:bg-accent-dark">
            Xem giá
          </span>
        </div>
      </div>
    </Link>
  )
}
