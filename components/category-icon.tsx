"use client"

import * as React from "react"
import { ChevronUp } from "lucide-react"
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
 * Categories as a grid of icon tiles, never a row to swipe (the owner's call).
 * On a phone the tiles are compact (5 across, one-line labels) so the first
 * service price still shows early. `more` adds a last tile that opens or
 * closes the rest (the home page keeps one row). `row` is the search page's
 * compact mode: the same grid with smaller tiles.
 */
export function CategoryTiles({
  items,
  value,
  onChange,
  more,
  row = false,
  className,
}: {
  /** `soon`: nobody offers it in scope yet; shown muted with "Sắp có". */
  /** `className`: e.g. "hidden lg:flex" for a tile only wide screens have room for. */
  items: { id: CategoryIconId; label: string; soon?: boolean; className?: string }[]
  value: CategoryIconId
  onChange: (id: CategoryIconId) => void
  more?: { open: boolean; onToggle: () => void; className?: string }
  row?: boolean
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Danh mục"
      className={cn(
        "grid grid-cols-5 gap-x-1 gap-y-3 sm:grid-cols-7 sm:gap-x-2 lg:flex lg:flex-wrap lg:gap-x-3 lg:gap-y-4",
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
            className={cn("group relative flex min-w-0 flex-col items-center gap-1 text-center", !row && "lg:w-[80px]", it.className)}
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
      {more && (
        <button
          type="button"
          onClick={more.onToggle}
          aria-expanded={more.open}
          className={cn("group flex min-w-0 flex-col items-center gap-1 text-center", !row && "lg:w-[80px]", more.className)}
        >
          <span
            className={cn(
              "flex items-center justify-center border border-line bg-surface text-ink-soft transition-colors group-hover:border-accent group-hover:text-accent",
              row ? "size-11 rounded-[14px]" : "size-[52px] rounded-[18px] lg:size-[60px] lg:rounded-[20px]",
            )}
          >
            {more.open ? (
              <ChevronUp className={cn(row ? "size-5" : "size-6")} aria-hidden />
            ) : (
              <CategoryIcon id="all" className={cn(row ? "size-5" : "size-6 lg:size-7")} />
            )}
          </span>
          <span className="w-full truncate text-[12px] font-medium leading-tight text-ink">{more.open ? "Thu gọn" : "Xem thêm"}</span>
        </button>
      )}
    </div>
  )
}
