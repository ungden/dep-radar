"use client"

import * as React from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { ImagePlus, Star, X } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Avatar, BottomBar, Button, ButtonLink, Card, EmptyState, PageHeader, inputClass } from "@/components/ui"
import { actions, useAct } from "@/lib/client-actions"
import { BLIND_NOTE, reviewWindow } from "@/lib/connection"
import { proView, useApp } from "@/lib/store"
import { uploadImage } from "@/lib/uploads"
import { REVIEW_ISSUE_TAGS, reviewTagsFor } from "@/lib/trust"
import { cn, formatDateLong } from "@/lib/utils"

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Đánh giá lịch hẹn" back />
      <RequireSession role="customer">
        <ReviewForm />
      </RequireSession>
    </div>
  )
}

/**
 * The customer's review. Blind until the freelancer has reviewed them too (or
 * 14 days pass), and theirs to change until then; after that it is a record.
 */
function ReviewForm() {
  const act = useAct()
  const { id } = useParams<{ id: string }>()
  const state = useApp()
  const booking = state.bookings.find((b) => b.id === id && b.mine)
  const existing = booking?.review
  const [rating, setRating] = React.useState(existing?.rating ?? 0)
  const [tags, setTags] = React.useState<string[]>(existing?.tags ?? [])
  const [text, setText] = React.useState(existing?.text ?? "")
  const [photos, setPhotos] = React.useState<string[]>(existing?.photos ?? [])
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  // Just sent: say what happens next instead of showing the form again.
  const [sent, setSent] = React.useState(false)

  if (!booking || booking.status !== "completed") {
    return <EmptyState title="Chưa thể đánh giá" text="Chỉ đánh giá được lịch hẹn đã hoàn thành." action={<ButtonLink href="/bookings">Về lịch hẹn</ButtonLink>} />
  }
  if (existing?.publishedAt) {
    return (
      <EmptyState
        title={sent ? "Đã gửi đánh giá" : "Đánh giá đã hiện công khai"}
        text="Đánh giá đã hiện trên hồ sơ người làm và không sửa được nữa."
        action={<ButtonLink href={`/pros/${booking.proId}#danh-gia`}>Xem đánh giá</ButtonLink>}
      />
    )
  }
  const period = reviewWindow(booking.completedAt, new Date())
  if (!period.open) {
    return (
      <EmptyState
        title="Hết hạn đánh giá"
        text="Đánh giá chỉ viết được trong 14 ngày sau khi lịch hẹn hoàn thành."
        action={<ButtonLink href={`/bookings/${booking.id}`}>Về lịch hẹn</ButtonLink>}
      />
    )
  }
  if (sent) {
    return (
      <EmptyState
        title="Đã lưu đánh giá"
        text={BLIND_NOTE}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href={`/bookings/${booking.id}`}>Về lịch hẹn</ButtonLink>
            <Button variant="outline" onClick={() => setSent(false)}>
              Sửa lại
            </Button>
          </div>
        }
      />
    )
  }

  const pro = proView(state, booking.proId)
  if (!pro) {
    return <EmptyState title="Người làm không còn hoạt động" action={<ButtonLink href="/bookings">Về lịch hẹn</ButtonLink>} />
  }
  const options = reviewTagsFor(rating || 5)
  // Three stars or fewer says what went wrong; the database refuses it otherwise.
  const needsIssue = rating > 0 && rating <= 3 && !tags.some((t) => REVIEW_ISSUE_TAGS.includes(t))
  const valid = rating > 0 && text.trim().length >= 10 && !needsIssue

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!valid || busy) return
        setBusy(true)
        setError(null)
        const message = await act(() => actions.submitReview(booking.id, { rating, tags, text: text.trim(), photos }), "Đã lưu đánh giá")
        setBusy(false)
        if (message) return setError(message)
        setSent(true)
        window.scrollTo({ top: 0 })
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
        <StarInput
          value={rating}
          onChange={(n) => {
            setRating(n)
            // Good points and problems are different lists; keep only what still applies.
            setTags((current) => current.filter((t) => reviewTagsFor(n).includes(t)))
          }}
          label="Đánh giá chung"
        />
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-soft">
          {rating > 0 && rating <= 3 ? "Điều chưa tốt (chọn ít nhất một)" : "Điểm bạn thích (tuỳ chọn)"}
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((t) => (
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
        {needsIssue && <p className="mt-2 text-xs text-warning">Từ 3 sao trở xuống, chọn ít nhất một điều chưa tốt để người sau biết.</p>}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Chia sẻ chi tiết (ít nhất 10 ký tự)</span>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Kết quả có giống mẫu không, người làm có đến đúng giờ, dụng cụ có sạch không…"
          className={cn(inputClass, "resize-none")}
        />
      </label>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-ink-soft">Ảnh kết quả (tuỳ chọn)</p>
        <div className="flex flex-wrap gap-2">
          {photos.map((src) => (
            <span key={src} className="relative size-20 overflow-hidden rounded-xl bg-subtle">
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              <button
                type="button"
                aria-label="Bỏ ảnh này"
                onClick={() => setPhotos((current) => current.filter((p) => p !== src))}
                className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="size-3.5" />
              </button>
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

      <div className="space-y-1.5 text-xs text-muted">
        <p>{BLIND_NOTE}</p>
        <p>
          Bạn sửa được tới khi đánh giá hiện (còn {period.daysLeft} ngày). Đánh giá được gắn nhãn “Đã đặt qua 360dep”; người làm không thể xoá, chỉ
          trả lời công khai một lần.
        </p>
      </div>
      {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

      <BottomBar>
        <Button type="submit" size="lg" className="w-full" disabled={!valid || busy}>
          {existing ? "Lưu thay đổi" : "Gửi đánh giá"}
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
