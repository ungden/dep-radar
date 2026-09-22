"use client"

import Link from "next/link"
import { ProCard } from "@/components/beauty"
import { getTemplate, getVertical, verticalOf } from "@/lib/catalog"
import { useApp } from "@/lib/store"
import { rankScore } from "@/lib/trust"
import type { VerticalId } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Who a customer usually needs next, for the same session. */
const NEXT: Record<VerticalId, VerticalId> = {
  beauty: "photo",
  photo: "beauty",
  model: "beauty",
}

const PITCH: Record<VerticalId, string> = {
  beauty: "Thêm makeup hoặc làm tóc trước giờ chụp, cùng một buổi.",
  photo: "Làm đẹp xong là lúc lên hình đẹp nhất. Thêm người chụp cho cùng buổi.",
  model: "Thêm người mẫu cho buổi chụp.",
}

/**
 * After a booking: offer the other half of the session ("Đặt chung một
 * buổi"). The second booking is an ordinary booking with its own freelancer,
 * price and confirmation call; the database links the two so each side knows
 * the other exists, and tells the customer if one of them falls through.
 */
export function ComboSuggestions({
  bookingId,
  templateId,
  city,
  className,
}: {
  bookingId: string
  templateId: string
  city: string
  className?: string
}) {
  const state = useApp()
  const template = getTemplate(templateId)
  if (!template) return null
  const next = NEXT[verticalOf(template.category)]
  const pros = state.pros
    .filter((p) => p.published && p.acceptingJobs && p.city === city && p.categories.some((c) => verticalOf(c) === next))
    .sort((a, b) => rankScore(b) - rankScore(a))
    .slice(0, 3)
  if (!pros.length) return null
  return (
    <section className={cn("rounded-[var(--radius-xl)] border border-line bg-surface p-4", className)}>
      <p className="text-[17px] font-extrabold tracking-tight">Đặt chung một buổi?</p>
      <p className="mt-1 text-[14px] text-ink-soft">{PITCH[next]}</p>
      <ul className="mt-4 space-y-3">
        {pros.map((p) => (
          <li key={p.id}>
            <ProCard pro={p} />
            <Link
              href={`/book/${p.id}?cung=${bookingId}`}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full bg-ink text-[14px] font-semibold text-white"
            >
              Đặt {p.name} cùng buổi
            </Link>
          </li>
        ))}
      </ul>
      <Link href={`/search?nganh=${next}`} className="mt-3 block text-center text-[14px] font-semibold underline-offset-4 hover:underline">
        Xem thêm {getVertical(next).label.toLowerCase()}
      </Link>
    </section>
  )
}
