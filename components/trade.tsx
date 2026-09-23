import Link from "next/link"
import { categoryLabel, verticalOf } from "@/lib/catalog"
import type { CategoryId, VerticalId } from "@/lib/types"
import { cn } from "@/lib/utils"

const DOT: Record<VerticalId, string> = {
  beauty: "bg-beauty",
  photo: "bg-photo",
  model: "bg-model",
}

/** The trade's colour, as a small mark: the only place trade colours are used. */
export function TradeDot({ vertical, className }: { vertical: VerticalId; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", DOT[vertical], className)} />
}

/** A category as a quiet chip with its trade's dot; a link to the search when `href` is given. */
export function CategoryTag({ category, href, className }: { category: CategoryId; href?: string; className?: string }) {
  const body = (
    <>
      <TradeDot vertical={verticalOf(category)} />
      {categoryLabel(category)}
    </>
  )
  const cls = cn(
    "inline-flex h-8 items-center gap-1.5 rounded-full bg-subtle px-3 text-[13px] font-semibold text-ink",
    href && "transition-colors hover:bg-subtle-strong",
    className,
  )
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  )
}
