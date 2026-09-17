"use client"

import * as React from "react"
import Image from "next/image"
import {
  BadgeCheck,
  CalendarCheck,
  Clock3,
  Crown,
  IdCard,
  MessageCircleReply,
  Phone,
  Repeat,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Trophy,
} from "lucide-react"
import { Avatar } from "@/components/ui"
import { categoryLabel } from "@/lib/catalog"
import { PROS } from "@/lib/data"
import { proView, type AppState } from "@/lib/store"
import { VERIFICATIONS, bayesianRating, isVerified, rankScore, ratingDistribution, tierDef, tierOf } from "@/lib/trust"
import type { CategoryId, Pro, RatingSummary, Review, TierId, VerificationId } from "@/lib/types"
import { cn, parseISODate } from "@/lib/utils"

const TIER_STYLE: Record<TierId, string> = {
  new: "bg-canvas text-ink-soft ring-1 ring-line",
  standard: "bg-blush text-rose-dark",
  pro: "bg-rose text-white",
  top: "bg-ink text-[#f3d9a4]",
}

export function TierBadge({ tier, className }: { tier: TierId; className?: string }) {
  const Icon = tier === "top" ? Crown : tier === "pro" ? Sparkles : null
  return (
    <span
      title={tierDef(tier).description}
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide", TIER_STYLE[tier], className)}
    >
      {Icon && <Icon className="size-3" />}
      {tier === "new" ? "Mới" : tier === "standard" ? "Tiêu chuẩn" : tier === "pro" ? "Pro" : "Top"}
    </span>
  )
}

/** Blue-check style mark: shown once identity is verified. */
export function VerifiedMark({ pro, className }: { pro: Pro; className?: string }) {
  if (!isVerified(pro, "identity")) return null
  return <BadgeCheck className={cn("size-4 shrink-0 fill-rose text-white", className)} aria-label="Đã xác minh danh tính" />
}

const VERIFICATION_ICON: Record<VerificationId, React.ComponentType<{ className?: string }>> = {
  phone: Phone,
  identity: IdCard,
  skill: Trophy,
  hygiene: ShieldCheck,
}

export function VerificationChips({ pro, className }: { pro: Pro; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {VERIFICATIONS.filter((x) => isVerified(pro, x.id)).map((x) => {
        const Icon = VERIFICATION_ICON[x.id]
        return (
          <li key={x.id} title={x.description} className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success">
            <Icon className="size-3.5" />
            {x.short}
          </li>
        )
      })}
    </ul>
  )
}

export function VerificationList({ pro }: { pro: Pro }) {
  return (
    <ul className="divide-y divide-line">
      {VERIFICATIONS.map((x) => {
        const Icon = VERIFICATION_ICON[x.id]
        const status = pro.verifications[x.id]
        return (
          <li key={x.id} className="flex items-start gap-3 py-3">
            <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", status === "verified" ? "bg-success-soft text-success" : "bg-canvas text-muted")}>
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{x.label}</span>
              <span className="block text-xs text-muted">{x.description}</span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                status === "verified" ? "bg-success-soft text-success" : status === "pending" ? "bg-warning-soft text-warning" : "bg-canvas text-muted",
              )}
            >
              {status === "verified" ? "Đã xác minh" : status === "pending" ? "Đang duyệt" : "Chưa có"}
            </span>
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

export function RatingBreakdown({ rating }: { rating: RatingSummary }) {
  const dist = ratingDistribution(rating)
  const max = Math.max(1, ...dist)
  const subs: [string, number][] = [
    ["Tay nghề", rating.skill],
    ["Đúng giờ", rating.punctuality],
    ["Vệ sinh", rating.hygiene],
    ["Thái độ", rating.attitude],
  ]
  return (
    <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
      <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-1">
        <p className="text-5xl font-semibold leading-none">{rating.average.toFixed(1)}</p>
        <div>
          <Stars value={rating.average} />
          <p className="mt-1 text-xs text-muted">{rating.count.toLocaleString("vi-VN")} đánh giá đã xác thực</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ul className="space-y-1">
          {dist.map((n, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-muted">
              <span className="w-3 text-right">{5 - i}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-[#e0a33a]" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="w-8 text-right">{n}</span>
            </li>
          ))}
        </ul>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
          {subs.map(([label, value]) => (
            <li key={label}>
              <span className="flex justify-between text-xs">
                <span className="text-muted">{label}</span>
                <b>{value.toFixed(1)}</b>
              </span>
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-rose" style={{ width: `${(value / 5) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ProStatGrid({ pro, className }: { pro: Pro; className?: string }) {
  const pct = (n: number) => `${Math.round(n * 100)}%`
  const items: [React.ComponentType<{ className?: string }>, string, string][] = [
    [CalendarCheck, pro.stats.completedJobs.toLocaleString("vi-VN"), "Job hoàn thành"],
    [Timer, pct(pro.stats.onTimeRate), "Đến đúng giờ"],
    [Repeat, pct(pro.stats.repeatRate), "Khách quay lại"],
    [Clock3, `~${pro.stats.responseMinutes} phút`, `Phản hồi (${pct(pro.stats.responseRate)})`],
  ]
  return (
    <ul className={cn("grid grid-cols-4 gap-2", className)}>
      {items.map(([Icon, value, label]) => (
        <li key={label} className="rounded-2xl bg-surface px-2 py-3 text-center shadow-[var(--shadow-soft)]">
          <Icon className="mx-auto size-4 text-rose" />
          <p className="mt-1 text-sm font-semibold">{value}</p>
          <p className="text-[10.5px] leading-tight text-muted">{label}</p>
        </li>
      ))}
    </ul>
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
      {onReply && !review.reply && (
        replying ? (
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
        )
      )}
    </li>
  )
}

/** Rank of a freelancer among peers in the same city and category. */
export function categoryRank(s: AppState, pro: Pro, category: CategoryId) {
  const peers = PROS.filter((p) => p.city === pro.city && p.categories.includes(category))
    .map((p) => proView(s, p.id)!)
    .sort((a, b) => rankScore(b) - rankScore(a))
  return { rank: peers.findIndex((p) => p.id === pro.id) + 1, total: peers.length }
}

export function RankBadge({ s, pro, className }: { s: AppState; pro: Pro; className?: string }) {
  const best = pro.categories
    .map((c) => ({ c, ...categoryRank(s, pro, c) }))
    .sort((a, b) => a.rank - b.rank)[0]
  // Only surface a rank that means something: top 3 of at least 3 peers, established profile.
  if (!best || best.total < 3 || best.rank > 3 || tierOf(pro) === "new") return null
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-[#fbefd9] px-2 py-0.5 text-[11px] font-semibold text-[#9a6412]", className)}>
      <Trophy className="size-3" />#{best.rank} {categoryLabel(best.c)} {pro.city}
    </span>
  )
}

export function sortPros(s: AppState, pros: Pro[], by: "match" | "rating" | "jobs") {
  const views = pros.map((p) => proView(s, p.id)!)
  if (by === "rating") return views.sort((a, b) => bayesianRating(b.rating) - bayesianRating(a.rating))
  if (by === "jobs") return views.sort((a, b) => b.stats.completedJobs - a.stats.completedJobs)
  return views.sort((a, b) => rankScore(b) - rankScore(a))
}
