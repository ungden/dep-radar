"use client"

import * as React from "react"
import Link from "next/link"
import { Check, CheckCircle2, Clock, Download, Link2, Star, Ticket, UserX } from "lucide-react"
import { Sheet } from "@/components/sheet"
import { Button, buttonClass, inputClass } from "@/components/ui"
import { getTemplate } from "@/lib/catalog"
import { actions, useAct } from "@/lib/client-actions"
import { BLIND_NOTE, customerJobActions, reviewWindow } from "@/lib/connection"
import { getPro, useApp } from "@/lib/store"
import type { Booking } from "@/lib/types"
import { cn, formatDateLong, formatPrice, localDate, localTime, toTimestamptz } from "@/lib/utils"

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
                  : booking.cancelledBy === "pro" && booking.cancelReason === "Người làm không đến"
                    ? "Người làm không đến"
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
            <span aria-hidden className={cn("absolute left-[11px] top-6 h-[calc(100%-16px)] w-0.5", s.done ? "bg-accent" : "bg-line")} />
          )}
          <span
            className={cn(
              "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
              s.bad ? "border-danger bg-danger text-white" : s.done ? "border-accent bg-accent text-white" : s.current ? "border-accent bg-surface" : "border-line bg-surface",
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
        <p className="text-[17px] font-bold tracking-tight">File đã giao</p>
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
      <p className="text-[17px] font-bold tracking-tight">Giao file cho khách</p>
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
 * What other freelancers said about this customer, shown while deciding
 * whether to take the booking. The snapshot already carries every review of a
 * customer the freelancer has a booking with (and nothing else).
 */
export function CustomerHistory({ booking }: { booking: Booking }) {
  const state = useApp()
  const reviews = state.customerReviews
    .filter((r) => r.customerId === booking.customerId && r.bookingId !== booking.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const visitsWithMe = state.bookings.filter(
    (b) => !b.mine && b.proId === booking.proId && b.customerId === booking.customerId && b.status === "completed",
  ).length

  if (!reviews.length) {
    return (
      <section className="rounded-[var(--radius-lg)] bg-subtle px-4 py-3">
        {/* Not "khách mới": a customer can have finished jobs nobody reviewed. */}
        <p className="text-[15px] font-semibold">{visitsWithMe ? `Khách quen · đã làm với bạn ${visitsWithMe} lần` : "Chưa có đánh giá về khách này"}</p>
        <p className="text-[13px] text-ink-soft">Chưa người làm nào trên 360dep chấm điểm khách này.</p>
      </section>
    )
  }

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const withText = reviews.filter((r) => r.body.trim()).slice(0, 2)
  return (
    <section className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-[15px] font-semibold">
        <Star className="size-4 fill-accent text-accent" aria-hidden />
        Khách được chấm {average.toFixed(1)}/5 · {reviews.length} lượt
      </p>
      <p className="text-[13px] text-ink-soft">
        Người làm trên 360dep đánh giá sau khi làm xong
        {visitsWithMe ? ` · đã làm với bạn ${visitsWithMe} lần` : ""}.
      </p>
      {withText.length > 0 && (
        <ul className="mt-2 space-y-2">
          {withText.map((r) => (
            <li key={r.bookingId} className="rounded-[var(--radius-md)] bg-canvas px-3 py-2 text-[14px]">
              <p>“{r.body}”</p>
              <p className="mt-0.5 text-[12px] text-muted">
                ★ {r.rating} · {r.mine ? "Bạn" : r.proName} · {formatDateLong(localDate(r.createdAt))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** A clock for buttons that appear at a time (the start, 15 minutes in). */
export function useNow(everyMs = 30_000) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs)
    return () => clearInterval(t)
  }, [everyMs])
  return now
}

/** When a booking starts and ends, as instants: its date and time are Vietnam wall-clock. */
export function bookingTimes(booking: Booking) {
  const startsAt = new Date(toTimestamptz(booking.date, booking.time))
  return { startsAt, endsAt: new Date(startsAt.getTime() + booking.durationMin * 60_000) }
}

/** "14:30, Thứ 5, 26 Tháng 9" */
const when = (iso: string) => `${localTime(iso)}, ${formatDateLong(localDate(iso))}`

/**
 * The customer's end of a confirmed job: it is done, or the freelancer did not
 * come. If nobody says anything, the job completes on its own a day after its
 * end, so the hint says when.
 */
export function CustomerFinish({ booking }: { booking: Booking }) {
  const act = useAct()
  const now = useNow()
  const [confirm, setConfirm] = React.useState<"done" | "noshow" | null>(null)
  const [detail, setDetail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  if (booking.status !== "confirmed" && booking.status !== "in_progress") return null
  const job = customerJobActions({ status: booking.status, ...bookingTimes(booking) }, new Date(now))
  const any = job.confirmDone || job.reportNoShow

  const run = (fn: () => Promise<{ error?: string }>, done: string) =>
    void act(fn, done).then((message) => {
      setError(message)
      setConfirm(null)
    })

  return (
    <section className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      {any && (
        <>
          <p className="text-[15px] font-bold">Buổi làm thế nào?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {job.confirmDone && (
              <Button size="sm" onClick={() => setConfirm("done")}>
                <CheckCircle2 className="size-4" /> Xác nhận đã xong
              </Button>
            )}
            {job.reportNoShow && (
              <Button variant="danger" size="sm" onClick={() => setConfirm("noshow")}>
                <UserX className="size-4" /> Người làm không đến
              </Button>
            )}
          </div>
        </>
      )}
      <p className={cn("flex gap-2 text-[13px] text-ink-soft", any && "mt-3")}>
        <Clock className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Tự hoàn thành lúc {when(job.autoCompleteAt.toISOString())} nếu không ai bấm.
          {any ? "" : " Từ giờ hẹn, bạn tự xác nhận được khi đã làm xong."}
        </span>
      </p>
      {error && <p className="mt-2 text-[14px] text-danger">{error}</p>}

      <Sheet
        open={confirm === "done"}
        onClose={() => setConfirm(null)}
        title="Xác nhận đã xong?"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Chưa
            </Button>
            <Button onClick={() => run(() => actions.confirmBookingDone(booking.id), "Đã xác nhận hoàn thành")}>Đã xong</Button>
          </div>
        }
      >
        <p className="text-[15px]">
          Lịch hẹn chuyển sang hoàn thành và bạn có 14 ngày để đánh giá {booking.proName}. Không đổi lại được sau khi xác nhận.
        </p>
      </Sheet>

      <Sheet
        open={confirm === "noshow"}
        onClose={() => setConfirm(null)}
        title="Người làm không đến?"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Quay lại
            </Button>
            <Button variant="danger" onClick={() => run(() => actions.reportProNoShow(booking.id, detail), "Đã báo người làm không đến")}>
              Báo không đến
            </Button>
          </div>
        }
      >
        <p className="text-[15px]">
          Lịch hẹn sẽ được huỷ, bạn không mất phí, và 360dep nhận báo cáo để xem xét. Chỉ báo khi {booking.proName} thật sự không đến.
        </p>
        <textarea
          rows={3}
          maxLength={1000}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          aria-label="Ghi chú cho 360dep"
          placeholder="Ghi chú cho 360dep (tuỳ chọn): đã gọi chưa, chờ bao lâu…"
          className={cn(inputClass, "mt-3 resize-none text-sm")}
        />
      </Sheet>
    </section>
  )
}

/**
 * The freelancer marked the customer absent. The customer has 24 hours to say
 * that is wrong; the notification sends them here to do it.
 */
export function NoShowDispute({ booking }: { booking: Booking }) {
  const act = useAct()
  const now = useNow(60_000)
  const [reason, setReason] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  if (booking.status !== "no_show" || !booking.cancelledAt) return null
  if (booking.disputed)
    return (
      <p className="rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px]">
        Bạn đã khiếu nại việc báo vắng mặt. 360dep đang xem xét và sẽ liên hệ nếu cần thêm thông tin.
      </p>
    )
  const until = new Date(booking.cancelledAt).getTime() + 24 * 3_600_000
  if (now > until) return null
  return (
    <form
      className="rounded-[var(--radius-lg)] border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void act(() => actions.disputeNoShow(booking.id, reason.trim()), "Đã gửi khiếu nại").then(setError)
      }}
    >
      <p className="text-[15px] font-bold">{booking.proName} báo bạn vắng mặt</p>
      <p className="mt-1 text-[13px] text-ink-soft">
        Nếu có nhầm lẫn, kể lại chuyện gì đã xảy ra trước {when(new Date(until).toISOString())}. 360dep xem xét rồi mới xử lý.
      </p>
      <textarea
        rows={3}
        maxLength={1000}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        aria-label="Chuyện gì đã xảy ra"
        placeholder="Mình có mặt đúng giờ, đã gọi người làm 2 lần…"
        className={cn(inputClass, "mt-3 resize-none text-sm")}
      />
      <p className="mt-1 text-xs text-muted">Ít nhất 10 ký tự.</p>
      <Button type="submit" size="sm" className="mt-2" disabled={reason.trim().length < 10}>
        Gửi khiếu nại
      </Button>
      {error && <p className="mt-2 text-[14px] text-danger">{error}</p>}
    </form>
  )
}

/**
 * A 360dep voucher on a booking that has not started yet. The customer pays
 * the freelancer less; 360dep makes it up in the freelancer's wallet.
 */
export function VoucherPanel({ booking }: { booking: Booking }) {
  const state = useApp()
  const act = useAct()
  const now = useNow(60_000)
  const [error, setError] = React.useState<string | null>(null)
  const before = (booking.status === "pending" || booking.status === "confirmed") && bookingTimes(booking).startsAt.getTime() > now
  if (!before) return null

  if (booking.voucherId || booking.discount > 0)
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] bg-success-soft px-4 py-3 text-[14px] text-success">
        <Ticket className="size-4 shrink-0" />
        <span className="flex-1 font-semibold">Đang dùng voucher −{formatPrice(booking.discount)}</span>
        <Button variant="ghost" size="sm" onClick={() => void act(() => actions.removeVoucher(booking.id), "Đã bỏ voucher").then(setError)}>
          Bỏ voucher
        </Button>
        {error && <p className="w-full text-[13px] text-danger">{error}</p>}
      </div>
    )

  const usable = state.vouchers
    .filter((v) => !v.bookingId && !v.usedAt && Date.parse(v.expiresAt) > now && v.minTotal <= booking.quote.total)
    .sort((a, b) => b.amount - a.amount || a.expiresAt.localeCompare(b.expiresAt))
  if (!usable.length) return null
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-[15px] font-bold">
        <Ticket className="size-4" /> Bạn có voucher 360dep
      </p>
      <ul className="mt-2 space-y-2">
        {usable.map((v) => (
          <li key={v.id} className="flex items-center gap-2">
            <span className="flex-1 text-[13px] text-ink-soft">Hạn {formatDateLong(localDate(v.expiresAt))}</span>
            <Button size="sm" onClick={() => void act(() => actions.applyVoucher(booking.id, v.id), "Đã dùng voucher").then(setError)}>
              Dùng voucher −{formatPrice(Math.min(v.amount, booking.quote.total))}
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">Bạn trả người làm ít hơn; 360dep trả phần voucher cho người làm khi xong.</p>
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
    </div>
  )
}

/**
 * The freelancer's side of a two-way review: how the customer was. Freelancers
 * the customer books later see it on the pending booking (CustomerHistory).
 * Blind like the customer's: neither reads the other's until both are written
 * or the 14 days are over.
 */
export function ReviewCustomer({ booking }: { booking: Booking }) {
  const state = useApp()
  const act = useAct()
  const now = useNow(60_000)
  const [rating, setRating] = React.useState(0)
  const [text, setText] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  if (booking.status !== "completed") return null
  const written = state.customerReviews.find((r) => r.bookingId === booking.id && r.mine)
  const period = reviewWindow(booking.completedAt, new Date(now))
  // A freelancer is only sent the customer's review once it is published.
  const theirs = booking.review

  if (written)
    return (
      <section className="space-y-2 rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px]">
        <p>
          Bạn đã đánh giá khách: <b>★ {written.rating}</b>
          {written.body ? ` · ${written.body}` : ""}
        </p>
        {!written.publishedAt && <p className="text-[13px] text-ink-soft">{BLIND_NOTE}</p>}
        {theirs?.publishedAt && (
          <p>
            Khách đánh giá bạn: <b>★ {theirs.rating}</b>
            {theirs.text ? ` · ${theirs.text}` : ""}
          </p>
        )}
      </section>
    )

  if (!period.open)
    return <p className="rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px] text-ink-soft">Hết hạn đánh giá khách (14 ngày sau khi xong).</p>

  const needsReason = rating > 0 && rating <= 2 && text.trim().length < 10
  return (
    <form
      className="rounded-[var(--radius-lg)] border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void act(() => actions.reviewCustomer(booking.id, rating, text.trim()), "Đã đánh giá khách").then(setError)
      }}
    >
      <p className="text-[15px] font-bold">Đánh giá khách để xem khách đánh giá bạn</p>
      <p className="mt-0.5 text-[13px] text-ink-soft">
        {booking.customerName} thế nào? Còn {period.daysLeft} ngày để đánh giá. Người làm khác thấy đánh giá này khi khách đặt lịch với họ. Không
        sửa được sau khi gửi.
      </p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Số sao">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sao`} onClick={() => setRating(n)} className="p-1">
            <Star className={cn("size-7", n <= rating ? "fill-ink text-ink" : "text-line")} />
          </button>
        ))}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
        aria-label="Nhận xét"
        placeholder={rating > 0 && rating <= 2 ? "Lý do (bắt buộc, ít nhất 10 ký tự)" : "Đúng giờ, lịch sự… (tuỳ chọn)"}
        className={cn(inputClass, "mt-2")}
      />
      {needsReason && <p className="mt-1 text-xs text-warning">Từ 2 sao trở xuống, cho người làm khác biết lý do (ít nhất 10 ký tự).</p>}
      <p className="mt-2 text-xs text-muted">{BLIND_NOTE}</p>
      <Button type="submit" size="sm" className="mt-3" disabled={!rating || needsReason}>
        Gửi đánh giá
      </Button>
      {error && <p className="mt-2 text-[14px] text-danger">{error}</p>}
    </form>
  )
}

/** The customer's side after a completed job: their review, its window, and the freelancer's once both are out. */
export function CustomerReviewStatus({ booking }: { booking: Booking }) {
  const state = useApp()
  const now = useNow(60_000)
  if (booking.status !== "completed") return null
  const period = reviewWindow(booking.completedAt, new Date(now))
  const mine = booking.review
  // Row level security lets the freelancer's review of me through only once published.
  const aboutMe = state.customerReviews.find((r) => r.bookingId === booking.id && !r.mine)

  return (
    <section className="space-y-1.5 rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px]">
      {mine ? (
        <p>
          Bạn đã đánh giá: <b>★ {mine.rating}</b>
          {mine.publishedAt ? " · đã hiện trên hồ sơ" : period.open ? ` · sửa được trong ${period.daysLeft} ngày nữa` : ""}
        </p>
      ) : period.open ? (
        <p>Còn {period.daysLeft} ngày để đánh giá {booking.proName}.</p>
      ) : (
        <p className="text-ink-soft">Hết hạn đánh giá (14 ngày sau khi xong).</p>
      )}
      {mine && !mine.publishedAt && <p className="text-[13px] text-ink-soft">{BLIND_NOTE}</p>}
      {aboutMe && (
        <p>
          {booking.proName} đánh giá bạn: <b>★ {aboutMe.rating}</b>
          {aboutMe.body ? ` · ${aboutMe.body}` : ""}
        </p>
      )}
    </section>
  )
}

