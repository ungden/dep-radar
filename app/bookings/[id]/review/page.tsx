"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Avatar, BottomBar, Button, ButtonLink, Card, EmptyState, PageHeader, inputClass } from "@/components/ui"
import { actions, proView, useApp } from "@/lib/store"
import { REVIEW_TAGS } from "@/lib/trust"
import { cn, formatDateLong } from "@/lib/utils"

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Đánh giá chuyên viên" back />
      <RequireSession role="customer">
        <ReviewForm />
      </RequireSession>
    </div>
  )
}

const CRITERIA = [
  ["skill", "Tay nghề"],
  ["punctuality", "Đúng giờ"],
  ["hygiene", "Vệ sinh, dụng cụ"],
  ["attitude", "Thái độ"],
] as const

type Criterion = (typeof CRITERIA)[number][0]

function ReviewForm() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const state = useApp()
  const booking = state.bookings.find((b) => b.id === id && b.mine)
  const [rating, setRating] = React.useState(0)
  const [subs, setSubs] = React.useState<Record<Criterion, number>>({ skill: 0, punctuality: 0, hygiene: 0, attitude: 0 })
  const [tags, setTags] = React.useState<string[]>([])
  const [text, setText] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  if (!booking || booking.status !== "completed") {
    return <EmptyState title="Chưa thể đánh giá" text="Chỉ đánh giá được lịch hẹn đã hoàn thành." action={<ButtonLink href="/bookings">Về lịch hẹn</ButtonLink>} />
  }
  if (booking.reviewed) {
    return <EmptyState title="Bạn đã đánh giá lịch hẹn này" action={<ButtonLink href={`/pros/${booking.proId}?tab=reviews`}>Xem đánh giá</ButtonLink>} />
  }

  const pro = proView(state, booking.proId)!
  const valid = rating > 0 && Object.values(subs).every((v) => v > 0) && text.trim().length >= 10

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        const err = actions.submitReview(booking.id, { rating, ...subs, tags, text: text.trim() })
        if (err) setError(err)
        else router.replace(`/pros/${booking.proId}?tab=reviews`)
      }}
    >
      <Card className="flex items-center gap-3 p-3">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={44} />
        <div>
          <p className="text-sm font-semibold">{pro.name}</p>
          <p className="text-xs text-muted">
            {booking.serviceName} · {booking.variantLabel} · {formatDateLong(booking.date)}
          </p>
        </div>
      </Card>

      <div className="text-center">
        <p className="font-semibold">Trải nghiệm của bạn thế nào?</p>
        <StarInput value={rating} onChange={setRating} size="lg" label="Đánh giá chung" />
      </div>

      <Card className="divide-y divide-line px-4">
        {CRITERIA.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between py-3">
            <span className="text-sm">{label}</span>
            <StarInput value={subs[key]} onChange={(v) => setSubs((x) => ({ ...x, [key]: v }))} label={label} />
          </div>
        ))}
      </Card>

      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-soft">Điểm bạn thích (tuỳ chọn)</p>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tags.includes(t)}
              onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}
              className={cn("rounded-full border px-3 py-1.5 text-[13px]", tags.includes(t) ? "border-rose bg-blush text-rose-dark" : "border-line bg-surface text-ink-soft")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Chia sẻ chi tiết (ít nhất 10 ký tự)</span>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Kết quả có giống mẫu không, chuyên viên có đến đúng giờ, dụng cụ có sạch không…"
          className={cn(inputClass, "resize-none")}
        />
      </label>

      <p className="text-xs text-muted">Đánh giá được gắn nhãn “Đã đặt qua dep360” và không thể bị chuyên viên xoá. Chuyên viên chỉ có thể phản hồi công khai.</p>
      {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

      <BottomBar>
        <Button type="submit" size="lg" className="w-full" disabled={!valid}>
          Gửi đánh giá
        </Button>
      </BottomBar>
    </form>
  )
}

function StarInput({ value, onChange, size = "md", label }: { value: number; onChange: (v: number) => void; size?: "md" | "lg"; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex", size === "lg" ? "mt-2 gap-2" : "gap-1")}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} sao`} onClick={() => onChange(n)}>
          <Star className={cn(size === "lg" ? "size-9" : "size-6", n <= value ? "fill-[#e0a33a] text-[#e0a33a]" : "fill-line text-line")} />
        </button>
      ))}
    </div>
  )
}
