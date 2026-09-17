"use client"

import * as React from "react"
import Image from "next/image"
import { BadgeCheck, IdCard, MessageCircleReply, ShieldCheck, Star, Trophy } from "lucide-react"
import { Avatar } from "@/components/ui"
import { proView, type AppState } from "@/lib/store"
import { VERIFICATIONS, bayesianRating, isTrusted, isVerified, rankScore } from "@/lib/trust"
import type { Pro, RatingSummary, Review, VerificationId } from "@/lib/types"
import { cn, parseISODate } from "@/lib/utils"

/** Blue-check style mark next to the name: shown once identity is verified. */
export function VerifiedMark({ pro, className }: { pro: Pro; className?: string }) {
  if (!isVerified(pro, "identity")) return null
  return <BadgeCheck className={cn("size-4 shrink-0 fill-rose text-white", className)} aria-label="Đã xác minh danh tính" />
}

/** Gold badge for freelancers who completed every verification. */
export function TrustedBadge({ pro, className }: { pro: Pro; className?: string }) {
  if (!isTrusted(pro)) return null
  return (
    <span
      title="Đã xác minh danh tính, tay nghề và cam kết vệ sinh"
      className={cn("inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fbefd9] px-2 py-0.5 text-[10.5px] font-semibold text-[#9a6412]", className)}
    >
      <ShieldCheck className="size-3" /> Tin cậy
    </span>
  )
}

export const VERIFICATION_ICON: Record<VerificationId, React.ComponentType<{ className?: string }>> = {
  identity: IdCard,
  skill: Trophy,
  hygiene: ShieldCheck,
}

/** Badges for the verifications a freelancer has completed. */
export function VerificationBadges({ pro, className }: { pro: Pro; className?: string }) {
  const done = VERIFICATIONS.filter((x) => isVerified(pro, x.id))
  if (!done.length) return null
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {done.map((x) => {
        const Icon = VERIFICATION_ICON[x.id]
        return (
          <li key={x.id} title={x.description} className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success">
            <Icon className="size-3.5" />
            {x.badge}
          </li>
        )
      })}
    </ul>
  )
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${value.toFixed(1)} sao`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("size-3.5", i < Math.round(value) ? "fill-[#e0a33a] text-[#e0a33a]" : "fill-line text-line")} />
      ))}
    </span>
  )
}

export function RatingSummaryBlock({ rating }: { rating: RatingSummary }) {
  return (
    <div className="flex items-center gap-4">
      <p className="text-5xl font-semibold leading-none">{rating.average.toFixed(1)}</p>
      <div>
        <Stars value={rating.average} />
        <p className="mt-1 text-xs text-muted">{rating.count.toLocaleString("vi-VN")} đánh giá từ khách đã đặt lịch</p>
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
          <p className="flex items-center gap-1.5 text-sm font-medium">
            {review.author}
            <span className="inline-flex items-center gap-0.5 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-semibold text-success">
              <BadgeCheck className="size-3" /> Đã đặt qua dep360
            </span>
          </p>
          <p className="truncate text-xs text-muted">
            {review.serviceName} · {parseISODate(review.date).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <Stars value={review.rating} />
      </div>
      {review.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.tags.map((t) => (
            <span key={t} className="rounded-full bg-blush px-2 py-0.5 text-[11px] text-rose-dark">
              {t}
            </span>
          ))}
        </div>
      )}
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.text}</p>
      {review.photo && (
        <div className="relative mt-2 size-20 overflow-hidden rounded-xl bg-blush">
          <Image src={review.photo} alt="Ảnh khách gửi kèm đánh giá" fill sizes="80px" className="object-cover" />
        </div>
      )}
      {review.reply && (
        <div className="mt-3 rounded-xl bg-canvas px-3 py-2.5 text-[13px]">
          <p className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-ink-soft">
            <MessageCircleReply className="size-3.5" /> Phản hồi của chuyên viên
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
              className="h-9 flex-1 rounded-xl border border-line bg-surface px-3 text-sm focus:border-rose focus:outline-none"
            />
            <button type="submit" className="h-9 rounded-xl bg-rose px-3 text-[13px] font-medium text-white">
              Gửi
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setReplying(true)} className="mt-2 text-[13px] font-medium text-rose">
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
