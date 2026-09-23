"use client"

import * as React from "react"
import { CATEGORY_ICONS, ICON_SOFT_OPACITY, ICON_STROKE, type CategoryIconId } from "@/lib/design/category-icons"
import { cn } from "@/lib/utils"

/** One of the 360dep category icons (lib/design/category-icons.ts), in the current text colour. */
export function CategoryIcon({ id, className }: { id: CategoryIconId; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-6 shrink-0", className)}
    >
      {CATEGORY_ICONS[id].map((s, i) => {
        const fill = s.fill === "solid" ? "currentColor" : s.fill === "soft" ? "currentColor" : "none"
        const fillOpacity = s.fill === "soft" ? ICON_SOFT_OPACITY : undefined
        if (s.k === "path") return <path key={i} d={s.d} fill={fill} fillOpacity={fillOpacity} />
        if (s.k === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={fill} fillOpacity={fillOpacity} />
        return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={fill} fillOpacity={fillOpacity} />
      })}
    </svg>
  )
}

/**
 * Categories as icon tiles rather than a row of text: each choice is a picture.
 *
 * On a phone they are one scrolling row of 52px tiles with one-line labels, so
 * the list is one short band and the first price shows sooner; from `sm` up
 * they become a grid. `row` keeps the single row at every width (search, once
 * there is a query and the results matter more than the categories).
 */
export function CategoryTiles({
  items,
  value,
  onChange,
  row = false,
  className,
}: {
  items: { id: CategoryIconId; label: string }[]
  value: CategoryIconId
  onChange: (id: CategoryIconId) => void
  row?: boolean
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  // Keep the chosen one in view in the scrolling row, without moving the page.
  React.useEffect(() => {
    const el = ref.current
    const chosen = el?.querySelector<HTMLElement>('[aria-checked="true"]')
    if (!el || !chosen || el.scrollWidth <= el.clientWidth) return
    const left = chosen.offsetLeft - el.offsetLeft
    if (left < el.scrollLeft || left + chosen.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: Math.max(0, left - 16) })
    }
  }, [value])
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label="Danh mục"
      className={cn(
        "no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4",
        row
          ? "md:mx-0 md:px-0"
          : "sm:mx-0 sm:grid sm:grid-cols-6 sm:gap-x-2 sm:gap-y-4 sm:overflow-visible sm:px-0 lg:flex lg:flex-wrap lg:gap-x-5",
        className,
      )}
    >
      {items.map((it) => {
        const active = value === it.id
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(it.id)}
            className={cn("group flex min-w-[56px] shrink-0 flex-col items-center gap-1.5 text-center", !row && "lg:w-[84px]")}
          >
            <span
              className={cn(
                "flex size-[52px] items-center justify-center rounded-[18px] transition-colors",
                !row && "sm:size-[60px] sm:rounded-[20px]",
                active ? "bg-accent text-white shadow-[var(--shadow-raised)]" : "bg-accent-soft text-accent group-hover:bg-subtle-strong",
              )}
            >
              <CategoryIcon id={it.id} className={cn("size-6", !row && "sm:size-7")} />
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-[12.5px] leading-tight",
                !row && "sm:whitespace-normal",
                active ? "font-semibold text-accent-dark" : "font-medium text-ink",
              )}
            >
              {it.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
