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
/**
 * Categories as a grid of icon tiles, never a row to swipe (the owner's call):
 * everything visible at once, each choice a picture. On a phone the tiles are
 * compact (5 across, one-line labels) so the first service price still shows
 * early. `row` is kept for the search page's compact mode and means the same
 * grid with smaller tiles.
 */
export function CategoryTiles({
  items,
  value,
  onChange,
  row = false,
  className,
}: {
  /** `soon`: nobody offers it in scope yet; shown muted with "Sắp có". */
  items: { id: CategoryIconId; label: string; soon?: boolean }[]
  value: CategoryIconId
  onChange: (id: CategoryIconId) => void
  row?: boolean
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Danh mục"
      className={cn(
        "grid grid-cols-5 gap-x-1 gap-y-3 sm:grid-cols-7 sm:gap-x-2 lg:flex lg:flex-wrap lg:gap-x-5 lg:gap-y-4",
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
            aria-label={it.soon ? `${it.label}, sắp có` : it.label}
            className={cn("group relative flex min-w-0 flex-col items-center gap-1 text-center", !row && "lg:w-[84px]")}
          >
            <span
              className={cn(
                "flex items-center justify-center transition-colors",
                row ? "size-11 rounded-[14px]" : "size-[52px] rounded-[18px] lg:size-[60px] lg:rounded-[20px]",
                active
                  ? "bg-accent text-white shadow-[var(--shadow-raised)]"
                  : it.soon
                    ? "bg-subtle text-muted group-hover:bg-subtle-strong"
                    : "bg-accent-soft text-accent group-hover:bg-subtle-strong",
              )}
            >
              <CategoryIcon id={it.id} className={cn(row ? "size-5" : "size-6 lg:size-7")} />
            </span>
            {it.soon && (
              <span className="absolute -top-1 right-0 rounded-full bg-surface px-1.5 py-px text-xs font-semibold leading-4 text-muted shadow-[var(--shadow-soft)]">
                Sắp có
              </span>
            )}
            <span
              className={cn(
                // One line, same height for every tile: long labels are shortened, not wrapped.
                "w-full truncate text-[12px] leading-tight",
                active ? "font-semibold text-accent-dark" : "font-medium text-ink",
              )}
              title={it.label}
            >
              {it.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
