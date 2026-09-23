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
 * Categories as a grid of icon tiles rather than a row of text to swipe:
 * everything is visible at once and each choice is a picture.
 */
export function CategoryTiles({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: CategoryIconId; label: string }[]
  value: CategoryIconId
  onChange: (id: CategoryIconId) => void
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label="Danh mục" className={cn("grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6 lg:flex lg:flex-wrap lg:gap-x-5", className)}>
      {items.map((it) => {
        const active = value === it.id
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(it.id)}
            className="group flex flex-col items-center gap-1.5 text-center lg:w-[84px]"
          >
            <span
              className={cn(
                "flex size-[60px] items-center justify-center rounded-[20px] transition-colors",
                active ? "bg-accent text-white shadow-[var(--shadow-raised)]" : "bg-accent-soft text-accent group-hover:bg-subtle-strong",
              )}
            >
              <CategoryIcon id={it.id} className="size-7" />
            </span>
            <span className={cn("text-[12.5px] leading-tight", active ? "font-semibold text-accent-dark" : "font-medium text-ink")}>{it.label}</span>
          </button>
        )
      })}
    </div>
  )
}
