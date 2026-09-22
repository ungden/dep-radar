"use client"

import * as React from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ImagePlus, Star } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Avatar, BottomBar, Button, ButtonLink, Card, EmptyState, PageHeader, inputClass } from "@/components/ui"
import { actions } from "@/lib/client-actions"
import { proView, useApp } from "@/lib/store"
import { uploadImage } from "@/lib/uploads"
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

function ReviewForm() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const state = useApp()
  const booking = state.bookings.find((b) => b.id === id && b.mine)
  const [rating, setRating] = React.useState(0)
  const [tags, setTags] = React.useState<string[]>([])
  const [text, setText] = React.useState("")
  const [photos, setPhotos] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (!booking || booking.status !== "completed") {
    return <EmptyState title="Chưa thể đánh giá" text="Chỉ đánh giá được lịch hẹn đã hoàn thành." action={<ButtonLink href="/bookings">Về lịch hẹn</ButtonLink>} />
  }
  if (booking.reviewed) {
    return <EmptyState title="Bạn đã đánh giá lịch hẹn này" action={<ButtonLink href={`/pros/${booking.proId}?tab=reviews`}>Xem đánh giá</ButtonLink>} />
  }

  const pro = proView(state, booking.proId)
  if (!pro) {
    return <EmptyState title="Chuyên viên không còn hoạt động" action={<ButtonLink href="/bookings">Về lịch hẹn</ButtonLink>} />
  }
  const valid = rating > 0 && text.trim().length >= 10

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!valid || busy) return
        setBusy(true)
        setError(null)
        const result = await actions.submitReview(booking.id, { rating, tags, text: text.trim(), photos })
        setBusy(false)
        if (result.error) return setError(result.error)
        router.replace(`/pros/${booking.proId}?tab=reviews`)
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
        <StarInput value={rating} onChange={setRating} label="Đánh giá chung" />
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-soft">Điểm bạn thích (tuỳ chọn)</p>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tags.includes(t)}
              onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}
              className={cn("rounded-full border px-3 py-1.5 text-[13px]", tags.includes(t) ? "border-accent bg-subtle text-accent-dark" : "border-line bg-surface text-ink-soft")}
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

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-ink-soft">Ảnh kết quả (tuỳ chọn)</p>
        <div className="flex flex-wrap gap-2">
          {photos.map((src) => (
            <span key={src} className="relative size-20 overflow-hidden rounded-xl bg-subtle">
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </span>
          ))}
          {photos.length < 3 && (
            <label className="flex size-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line text-muted hover:border-accent hover:text-accent">
              <ImagePlus className="size-5" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={async (e) => {
                  const files = [...(e.target.files ?? [])].slice(0, 3 - photos.length)
                  if (!files.length) return
                  setBusy(true)
                  setError(null)
                  try {
                    const uploaded = await Promise.all(files.map((file) => uploadImage("reviews", file)))
                    setPhotos((current) => [...current, ...uploaded])
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Tải ảnh không thành công.")
                  }
                  setBusy(false)
                }}
              />
            </label>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Ảnh được nén và xoá thông tin vị trí trước khi tải lên. Đừng đăng ảnh có mặt người khác mà chưa hỏi.
        </p>
      </div>

      <p className="text-xs text-muted">Đánh giá được gắn nhãn “Đã đặt qua 360dep” và không thể bị chuyên viên xoá. Chuyên viên chỉ có thể phản hồi công khai.</p>
      {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

      <BottomBar>
        <Button type="submit" size="lg" className="w-full" disabled={!valid || busy}>
          Gửi đánh giá
        </Button>
      </BottomBar>
    </form>
  )
}

function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="mt-2 inline-flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} sao`} onClick={() => onChange(n)}>
          <Star className={cn("size-9", n <= value ? "fill-[#e0a33a] text-[#e0a33a]" : "fill-line text-line")} />
        </button>
      ))}
    </div>
  )
}
