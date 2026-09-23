"use client"

import * as React from "react"
import Image from "next/image"
import { BadgeCheck, IdCard, MessageCircleReply, Star } from "lucide-react"
import { Avatar } from "@/components/ui"
import { proView, type AppState } from "@/lib/store"
import { bayesianRating, isVerified, rankScore } from "@/lib/trust"
import type { Pro, RatingSummary, Review } from "@/lib/types"
import { cn, parseISODate } from "@/lib/utils"

/** Blue-check style mark next to the name: shown once identity is verified. */
export function VerifiedMark({ pro, className }: { pro: Pro; className?: string }) {
  if (!isVerified(pro)) return null
  return <BadgeCheck className={cn("size-4 shrink-0 fill-accent text-white", className)} aria-label="Đã xác minh danh tính" />
}

/** Pill badge used on profiles and offers. */
export function VerifiedBadge({ pro, className }: { pro: Pro; className?: string }) {
  if (!isVerified(pro)) return null
  return (
    <span
      title="Đã đối chiếu CCCD và ảnh chân dung"
      className={cn("inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-[13px] font-semibold text-success", className)}
    >
      <IdCard className="size-3.5" /> Đã xác minh danh tính
    </span>
  )
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${value.toFixed(1)} sao`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("size-3.5", i < Math.round(value) ? "fill-ink text-ink" : "fill-subtle-strong text-subtle-strong")} />
      ))}
    </span>
  )
}

export function RatingSummaryBlock({ rating }: { rating: RatingSummary }) {
  return (
    <div className="flex items-center gap-4">
      <p className="text-5xl font-extrabold leading-none tracking-tight">{rating.average.toFixed(1)}</p>
      <div>
        <Stars value={rating.average} />
        <p className="mt-1.5 text-[13px] text-ink-soft">{rating.count.toLocaleString("vi-VN")} đánh giá từ khách đã đặt lịch</p>
      </div>
    </div>
  )
}

export function ReviewItem({ review, onReply }: { review: Review; onReply?: (text: string) => void }) {
  const [replying, setReplying] = React.useState(false)
  const [text, setText] = React.useState("")
  return (
    <li className="py-4">
      <div className="flex items-center gap-3">
        <Avatar name={review.author} size={36} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold">
            {review.author}
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[12px] font-semibold text-success">
              <BadgeCheck className="size-3" /> Đã đặt qua 360dep
            </span>
          </p>
          <p className="truncate text-[13px] text-muted">
            {review.serviceName} · {parseISODate(review.date).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <Stars value={review.rating} />
      </div>
      {review.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.tags.map((t) => (
            <span key={t} className="rounded-full bg-subtle px-2.5 py-1 text-[13px] text-ink-soft">
              {t}
            </span>
          ))}
        </div>
      )}
      <p className="mt-2 text-[15px] leading-relaxed text-ink">{review.text}</p>
      {review.photo && (
        <div className="relative mt-3 aspect-[4/5] w-28 overflow-hidden rounded-[var(--radius-md)] bg-subtle">
          <Image src={review.photo} alt="Ảnh khách gửi kèm đánh giá" fill sizes="112px" className="object-cover" />
        </div>
      )}
      {review.reply && (
        <div className="mt-3 rounded-[var(--radius-md)] bg-subtle px-3.5 py-3 text-[14px]">
          <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <MessageCircleReply className="size-4" /> Người làm trả lời
          </p>
          <p className="text-ink-soft">{review.reply}</p>
        </div>
      )}
      {onReply &&
        !review.reply &&
        (replying ? (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (text.trim().length < 2) return
              onReply(text.trim())
              setReplying(false)
            }}
          >
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cảm ơn khách, giải thích nếu có vấn đề…"
              className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] focus:border-ink focus:outline-none"
            />
            <button type="submit" className="h-11 rounded-full bg-ink px-5 text-[14px] font-semibold text-white">
              Gửi
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setReplying(true)} className="mt-2 min-h-11 text-[14px] font-semibold text-ink underline underline-offset-4">
            Phản hồi
          </button>
        ))}
    </li>
  )
}

export function sortPros(s: AppState, pros: Pro[], by: "match" | "rating" | "jobs") {
  const views = pros.map((p) => proView(s, p.id)!)
  if (by === "rating") return views.sort((a, b) => bayesianRating(b.rating) - bayesianRating(a.rating))
  if (by === "jobs") return views.sort((a, b) => b.stats.completedJobs - a.stats.completedJobs)
  return views.sort((a, b) => rankScore(b) - rankScore(a))
}
