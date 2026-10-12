"use client"

import * as React from "react"
import { ChevronUp } from "lucide-react"
import { CATEGORY_ICONS, CATEGORY_TINTS, ICON_SOFT_OPACITY, ICON_STROKE, type CategoryIconId } from "@/lib/design/category-icons"
import { moveRadio } from "@/lib/radio-navigation"
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
  /** `soon`: nobody offers it in scope yet; explain availability to assistive technology. */
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
        "grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6 lg:grid-cols-[repeat(auto-fill,minmax(80px,1fr))] lg:gap-x-2",
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
            tabIndex={active || (!items.some((item) => item.id === value) && it.id === items[0]?.id) ? 0 : -1}
            onKeyDown={(event) => moveRadio(event, () => onChange(it.id))}
            onClick={() => onChange(it.id)}
            aria-label={it.soon ? `${it.label}, chưa có người nhận lịch` : it.label}
            className={cn("group relative flex min-w-0 flex-col items-center gap-2 text-center", it.className)}
          >
            <span
              // Each category keeps its own colour; the chosen one gets an ink ring.
              style={{ background: CATEGORY_TINTS[it.id].bg, color: CATEGORY_TINTS[it.id].fg }}
              className={cn(
                "flex items-center justify-center rounded-full transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5",
                row ? "size-11" : "size-[54px] lg:size-[60px]",
                active ? "shadow-[0_0_0_2.5px_var(--color-canvas),0_0_0_4.5px_var(--color-ink)]" : "group-hover:shadow-[var(--shadow-soft)]",
                it.soon && !active && "opacity-60 saturate-50",
              )}
            >
              <CategoryIcon id={it.id} className={cn(row ? "size-5" : "size-6 lg:size-7")} />
            </span>
            <span
              className={cn(
                // Names wrap instead of shrinking or hiding the service behind an ellipsis.
                "w-full min-h-10 text-label leading-5 [overflow-wrap:anywhere]",
                active ? "font-bold text-ink" : "font-semibold text-ink-soft",
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
          className={cn("group flex min-w-0 flex-col items-center gap-2 text-center", more.className)}
        >
          <span
            className={cn(
              "flex items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors group-hover:border-ink",
              row ? "size-11" : "size-[54px] lg:size-[60px]",
            )}
          >
            {more.open ? (
              <ChevronUp className={cn(row ? "size-5" : "size-6")} aria-hidden />
            ) : (
              <CategoryIcon id="all" className={cn(row ? "size-5" : "size-6 lg:size-7")} />
            )}
          </span>
          <span className="w-full min-h-10 text-label font-semibold leading-5 text-ink-soft">{more.open ? "Thu gọn" : "Xem thêm"}</span>
        </button>
      )}
    </div>
  )
}
