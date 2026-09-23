"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Download, Link2, Star } from "lucide-react"
import { Button, buttonClass, inputClass } from "@/components/ui"
import { getTemplate } from "@/lib/catalog"
import { actions, useAct } from "@/lib/client-actions"
import { getPro, useApp } from "@/lib/store"
import type { Booking } from "@/lib/types"
import { cn, formatDateLong, localDate } from "@/lib/utils"

type Step = { label: string; done: boolean; current?: boolean; when?: string; bad?: boolean }

/**
 * Where a booking is, as a line of steps. Only dates the database actually
 * has are shown; a step without a timestamp is just done or not done.
 */
export function BookingTimeline({ booking }: { booking: Booking }) {
  const d = booking.delivery
  const ended = ["declined", "cancelled", "expired", "no_show"].includes(booking.status)
  const accepted = ["confirmed", "in_progress", "completed"].includes(booking.status)
  const completed = booking.status === "completed"

  const steps: Step[] = [
    { label: "Đã gửi yêu cầu", done: true, when: formatDateLong(localDate(booking.createdAt)) },
    ended
      ? {
          label:
            booking.status === "declined"
              ? "Bị từ chối"
              : booking.status === "expired"
                ? "Hết hạn chờ gọi"
                : booking.status === "no_show"
                  ? "Khách vắng mặt"
                  : "Đã huỷ",
          done: true,
          bad: true,
        }
      : { label: "Đã gọi xác nhận, nhận lịch", done: accepted, current: booking.status === "pending" },
    ...(ended
      ? []
      : [
          { label: "Hoàn thành buổi làm", done: completed, current: accepted && !completed, when: formatDateLong(booking.date) },
          ...(d
            ? [
                {
                  label: "Giao file",
                  done: Boolean(d.deliveredAt),
                  current: completed && !d.deliveredAt,
                  when: d.deliveredAt
                    ? formatDateLong(localDate(d.deliveredAt))
                    : d.dueAt
                      ? `hạn ${formatDateLong(localDate(d.dueAt))}`
                      : undefined,
                },
                { label: "Khách đã nhận file", done: Boolean(d.acceptedAt), current: Boolean(d.deliveredAt) && !d.acceptedAt },
              ]
            : []),
        ]),
  ]

  return (
    <ol className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 && (
            <span aria-hidden className={cn("absolute left-[11px] top-6 h-[calc(100%-16px)] w-0.5", s.done ? "bg-ink" : "bg-line")} />
          )}
          <span
            className={cn(
              "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
              s.bad ? "border-danger bg-danger text-white" : s.done ? "border-ink bg-ink text-white" : s.current ? "border-ink bg-surface" : "border-line bg-surface",
            )}
          >
            {s.done && !s.bad && <Check className="size-3.5" />}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className={cn("text-[15px]", s.done || s.current ? "font-semibold text-ink" : "text-muted", s.bad && "text-danger")}>{s.label}</p>
            {s.when && <p className="text-[13px] text-ink-soft">{s.when}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** The files owed after a photo or video session: hand-over for the freelancer, pick-up for the customer. */
export function DeliveryPanel({ booking, isPro }: { booking: Booking; isPro: boolean }) {
  const state = useApp()
  const act = useAct()
  const [url, setUrl] = React.useState("")
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const d = booking.delivery
  if (!d || booking.status !== "completed") return null
  const days = getTemplate(booking.templateId)?.deliveryDays

  if (d.deliveredAt && d.url)
    return (
      <section className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
        <p className="text-[17px] font-extrabold tracking-tight">File đã giao</p>
        {d.note && <p className="mt-1 whitespace-pre-line text-[14px] text-ink-soft">{d.note}</p>}
        <a href={d.url} target="_blank" rel="noreferrer noopener" className={cn(buttonClass("primary", "md"), "mt-3 w-full")}>
          <Download className="size-4" /> Mở link tải file
        </a>
        {!isPro && !d.acceptedAt && (
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => void act(() => actions.acceptDelivery(booking.id), "Đã xác nhận nhận file").then(setError)}
          >
            Đã nhận đủ file
          </Button>
        )}
        {d.acceptedAt && <p className="mt-2 text-center text-[13px] font-semibold text-success">Khách đã xác nhận nhận file</p>}
        {error && <p className="mt-2 text-[14px] text-danger">{error}</p>}
      </section>
    )

  if (!isPro)
    return (
      <p className="rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px]">
        {getPro(state, booking.proId)?.name ?? booking.proName} đang chỉnh ảnh/clip.
        {d.dueAt ? ` Hạn giao: ${formatDateLong(localDate(d.dueAt))}.` : ""} Link tải file sẽ hiện ở đây.
      </p>
    )

  return (
    <form
      className="rounded-[var(--radius-lg)] border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void act(() => actions.deliverBooking(booking.id, url.trim(), note.trim()), "Đã giao file cho khách").then(setError)
      }}
    >
      <p className="text-[17px] font-extrabold tracking-tight">Giao file cho khách</p>
      <p className="mt-1 text-[14px] text-ink-soft">
        Dán link Google Drive, Google Photos hoặc iCloud đã mở quyền xem.
        {d.dueAt ? ` Hạn: ${formatDateLong(localDate(d.dueAt))}` : days ? ` Hạn: ${days} ngày sau buổi chụp` : ""}.
      </p>
      <input
        type="url"
        required
        inputMode="url"
        placeholder="https://drive.google.com/…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className={cn(inputClass, "mt-3")}
      />
      <textarea
        rows={2}
        maxLength={500}
        placeholder="Lời nhắn (tuỳ chọn): số ảnh, cách tải…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className={cn(inputClass, "mt-2 resize-none")}
      />
      <Button type="submit" className="mt-3 w-full" disabled={!/^https?:\/\//.test(url.trim())}>
        Giao file
      </Button>
      {error && <p className="mt-2 text-[14px] text-danger">{error}</p>}
    </form>
  )
}

/** The other bookings of the same session ("Đặt chung một buổi"). */
export function ComboPartners({ booking }: { booking: Booking }) {
  const state = useApp()
  if (!booking.groupId) return null
  const others = state.bookings.filter((b) => b.groupId === booking.groupId && b.id !== booking.id)
  if (!others.length) return null
  return (
    <section className="rounded-[var(--radius-lg)] bg-subtle p-4">
      <p className="flex items-center gap-2 text-[15px] font-bold">
        <Link2 className="size-4" /> Cùng buổi này
      </p>
      <ul className="mt-2 space-y-1.5">
        {others.map((b) => (
          <li key={b.id}>
            <Link href={`/bookings/${b.id}`} className="block text-[14px] underline-offset-4 hover:underline">
              {b.serviceName} · {b.proName} · {b.time}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The freelancer's side of a two-way review: how the customer was. Other
 * freelancers see it before accepting that customer; the customer sees it too.
 */
export function ReviewCustomer({ booking }: { booking: Booking }) {
  const state = useApp()
  const act = useAct()
  const [rating, setRating] = React.useState(0)
  const [text, setText] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  if (booking.status !== "completed" && booking.status !== "no_show") return null
  const written = state.customerReviews.find((r) => r.bookingId === booking.id && r.mine)
  if (written)
    return (
      <p className="rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px]">
        Bạn đã đánh giá khách: <b>★ {written.rating}</b>
        {written.body ? ` · ${written.body}` : ""}
      </p>
    )
  return (
    <form
      className="rounded-[var(--radius-lg)] border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void act(() => actions.reviewCustomer(booking.id, rating, text.trim()), "Đã đánh giá khách").then(setError)
      }}
    >
      <p className="text-[15px] font-bold">Khách {booking.customerName} thế nào?</p>
      <p className="text-[13px] text-ink-soft">Người làm khác sẽ thấy đánh giá này trước khi nhận lịch của khách. Không sửa được sau khi gửi.</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Số sao">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sao`} onClick={() => setRating(n)} className="p-1">
            <Star className={cn("size-7", n <= rating ? "fill-ink text-ink" : "text-line")} />
          </button>
        ))}
      </div>
      <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Đúng giờ, lịch sự… (tuỳ chọn)" className={cn(inputClass, "mt-2")} />
      <Button type="submit" size="sm" className="mt-3" disabled={!rating}>
        Gửi đánh giá
      </Button>
      {error && <p className="mt-2 text-[14px] text-danger">{error}</p>}
    </form>
  )
}
