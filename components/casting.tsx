"use client"

import Link from "next/link"
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react"
import { VerifiedMark } from "@/components/trust"
import { Avatar } from "@/components/ui"
import { categoryLabel } from "@/lib/catalog"
import { getPro, useApp } from "@/lib/store"
import type { Casting } from "@/lib/types"
import { cn, formatPrice, formatDateLong } from "@/lib/utils"

export function compensationLabel(c: Pick<Casting, "compensation" | "discountPercent" | "fee">) {
  if (c.compensation === "paid") return c.fee ? `Thù lao ${formatPrice(c.fee)}` : "Có thù lao"
  if (c.compensation === "discount") return c.discountPercent === 100 ? "Làm miễn phí" : `Giảm ${c.discountPercent ?? 0}%`
  return "Làm miễn phí"
}

export function CastingCard({ casting, className }: { casting: Casting; className?: string }) {
  const state = useApp()
  const pro = getPro(state, casting.proId)
  const left = Math.max(0, casting.slots - casting.acceptedCount)
  return (
    <Link
      href={`/tuyen-mau/${casting.id}`}
      className={cn("block rounded-[var(--radius-lg)] border border-line bg-surface p-4 transition-colors hover:border-ink/25", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-subtle px-2.5 py-1 text-xs font-semibold text-ink-soft">{categoryLabel(casting.category)}</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold",
            casting.compensation === "paid" ? "bg-success-soft text-success" : "bg-accent-soft text-accent-dark",
          )}
        >
          {compensationLabel(casting)}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-[16px] font-bold leading-snug">{casting.title}</p>
      <div className="mt-2 space-y-1 text-[13px] text-ink-soft">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="size-4 text-muted" />
          {formatDateLong(casting.date)} · {casting.time}
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin className="size-4 text-muted" />
          {casting.district}, {casting.city}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[13px]">
        {pro && <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={24} />}
        <span className="truncate font-semibold">{pro?.name ?? "Người làm"}</span>
        {pro && <VerifiedMark pro={pro} className="size-3.5" />}
        <span className="ml-auto shrink-0 text-muted">{casting.status === "open" ? `Còn ${left}/${casting.slots} chỗ` : "Đã đóng"}</span>
      </div>
    </Link>
  )
}

/** Home page module: open casting calls near the customer. */
export function CastingStrip({ className }: { className?: string }) {
  const state = useApp()
  const list = state.castings
    .filter((c) => c.status === "open" && (!state.city || c.city === state.city))
    .slice(0, 6)
  if (!list.length) return null
  return (
    <section className={className}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight md:text-[24px]">Đang tuyển mẫu</h2>
          <p className="mt-0.5 text-[14px] text-ink-soft">Làm mẫu cho thợ, được làm đẹp miễn phí hoặc giảm giá.</p>
        </div>
        <Link href="/tuyen-mau" className="shrink-0 text-[14px] font-semibold underline-offset-4 hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0">
        {list.map((c) => (
          <CastingCard key={c.id} casting={c} className="w-[280px] shrink-0 md:w-auto" />
        ))}
      </div>
    </section>
  )
}

/**
 * The warning every casting board needs. The most common scam asks the model
 * to pay first -- a "deposit", a "profile fee" -- so say plainly that it never
 * happens here.
 */
export function SafetyNote({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex gap-3 rounded-[var(--radius-lg)] bg-subtle p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <div className="text-[14px] text-ink-soft">
          <p className="font-bold text-ink">Làm mẫu an toàn</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>Người tuyển không bao giờ được yêu cầu bạn chuyển tiền: không cọc, không phí hồ sơ.</li>
            <li>Tin có thù lao và tin tuyển mẫu ảnh chỉ mở cho người đã xác minh danh tính.</li>
            <li>360dep không nhận tin chụp nội y, khoả thân hay nội dung nhạy cảm.</li>
            <li>Gặp ở nơi công khai hoặc studio có địa chỉ; báo cho người thân lịch của bạn.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

