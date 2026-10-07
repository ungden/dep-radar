"use client"

import * as React from "react"
import { CalendarClock, CheckCircle2, Plus } from "lucide-react"
import { bookingTimes, useNow } from "@/components/booking-extras"
import { Button, Card, inputClass } from "@/components/ui"
import { actions, useAct } from "@/lib/client-actions"
import { getTemplate, getVariant } from "@/lib/catalog"
import { servicesOf, useApp } from "@/lib/store"
import type { Booking } from "@/lib/types"
import { cn, formatDateLong, formatDuration, formatPrice, localDate, localTime, todayISO } from "@/lib/utils"

/**
 * The tools that take the usual disputes out of guesswork (20261007100200):
 * a record that the customer paid, a freelancer's dispute of a "không đến"
 * report, a service added during the appointment, and a new time either side
 * may propose. Each one is a database function that re-checks the rule.
 */

const at = (iso: string) => `${localTime(iso)}, ${formatDateLong(localDate(iso))}`

/** "Đã nhận tiền": the freelancer records it, both sides see it. */
export function PaymentReceipt({ booking, isPro }: { booking: Booking; isPro: boolean }) {
  const act = useAct()
  const now = useNow()
  const [error, setError] = React.useState<string | null>(null)
  const { startsAt } = bookingTimes(booking)
  const live = booking.status === "confirmed" || booking.status === "in_progress" || booking.status === "completed"
  if (!live) return null
  if (booking.paidAt) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-2.5 text-[13px] text-success">
        <CheckCircle2 className="size-4 shrink-0" />
        {isPro ? "Bạn" : booking.proName} đã xác nhận nhận tiền lúc {at(booking.paidAt)}.
      </p>
    )
  }
  if (now < startsAt.getTime() - 15 * 60_000) return null
  if (!isPro) {
    return (
      <p className="text-[13px] text-muted">
        Trả tiền xong, nhờ người làm bấm “Đã nhận tiền” trong lịch hẹn để lưu xác nhận cho cả hai bên.
      </p>
    )
  }
  return (
    <Card className="flex flex-wrap items-center gap-3 p-3.5">
      <p className="min-w-0 flex-1 text-[13px] text-ink-soft">Khách đã trả đủ {formatPrice(booking.quote.total - (booking.discount ?? 0))}? Bấm để lưu xác nhận; khách được báo.</p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void act(() => actions.confirmPaymentReceived(booking.id), "Đã lưu xác nhận nhận tiền").then(setError)}
      >
        Đã nhận tiền
      </Button>
      {error && <p className="w-full text-[13px] text-danger">{error}</p>}
    </Card>
  )
}

/** A freelancer reported as "không đến" says what happened, within 24 hours. */
export function ProNoShowDispute({ booking }: { booking: Booking }) {
  const act = useAct()
  const now = useNow()
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  if (booking.status !== "cancelled" || booking.cancelReason !== "Người làm không đến" || !booking.cancelledAt) return null
  const until = Date.parse(booking.cancelledAt) + 24 * 3_600_000
  if (sent) return <p className="text-center text-[13px] text-muted">Đã gửi khiếu nại. 360dep sẽ xem xét và báo kết quả cho bạn.</p>
  if (now > until) return null
  return (
    <Card className="space-y-2 p-4 ring-1 ring-warning/40">
      <p className="text-sm font-semibold">Khách báo bạn không đến</p>
      <p className="text-[13px] text-ink-soft">
        Nếu bạn đã tới, khiếu nại trước {at(new Date(until).toISOString())} kèm mô tả: giờ tới, cuộc gọi, ảnh tại địa điểm (gửi ảnh qua “Báo cáo vấn đề” nếu cần).
      </p>
      {open ? (
        <>
          <textarea
            rows={3}
            maxLength={1000}
            className={cn(inputClass, "resize-none text-sm")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Chuyện gì đã xảy ra (ít nhất 10 ký tự)"
          />
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Quay lại
            </Button>
            <Button
              size="sm"
              disabled={reason.trim().length < 10}
              onClick={() =>
                void act(() => actions.disputeProNoShow(booking.id, reason), "Đã gửi khiếu nại").then((message) => {
                  setError(message)
                  if (!message) setSent(true)
                })
              }
            >
              Gửi khiếu nại
            </Button>
          </div>
        </>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Khiếu nại
        </Button>
      )}
    </Card>
  )
}

/**
 * "Đặt thêm dịch vụ": during the appointment the customer adds one of the
 * freelancer's listed services, right after the current one, at the listed
 * price and with no travel or urgent fee. The freelancer accepts it like any
 * booking. Nothing is agreed or paid outside the app.
 */
export function AddOnServices({ booking }: { booking: Booking }) {
  const state = useApp()
  const act = useAct()
  const now = useNow()
  const [open, setOpen] = React.useState(false)
  const [pick, setPick] = React.useState<{ templateId: string; variantId: string } | null>(null)
  const [quantity, setQuantity] = React.useState(1)
  const [error, setError] = React.useState<string | null>(null)
  const { startsAt, endsAt } = bookingTimes(booking)
  const live = booking.status === "confirmed" || booking.status === "in_progress"
  if (!live || now < startsAt.getTime() - 15 * 60_000 || now > endsAt.getTime() + 60 * 60_000) return null

  const options = servicesOf(state, booking.proId).flatMap((listing) => {
    const tpl = getTemplate(listing.templateId)
    if (!tpl || (tpl.studioOnly && booking.atHome)) return []
    return tpl.variants
      .filter((v) => listing.prices[v.id] !== undefined && (v.sessions ?? 1) === 1)
      .map((v) => ({ templateId: tpl.id, variantId: v.id, name: tpl.name, label: v.label, price: listing.prices[v.id], durationMin: v.durationMin }))
  })
  if (!options.length) return null
  const chosen = pick ? getVariant(pick.templateId, pick.variantId) : undefined
  const maxQ = chosen?.perPerson ? (chosen.maxQuantity ?? 1) : 1

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent underline underline-offset-4">
        <Plus className="size-4" /> Đặt thêm dịch vụ ngay sau buổi này
      </button>
    )
  }
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold">Đặt thêm dịch vụ</p>
      <p className="text-[13px] text-ink-soft">
        Làm nối tiếp ngay sau lịch này, cùng địa điểm, theo giá {booking.proName} niêm yết; không tính phí di chuyển hay phí gấp. {booking.proName} bấm nhận thì mới thành
        lịch. Đừng thoả thuận làm thêm ngoài ứng dụng.
      </p>
      <ul className="max-h-72 space-y-2 overflow-y-auto">
        {options.map((o) => {
          const on = pick?.templateId === o.templateId && pick.variantId === o.variantId
          return (
            <li key={`${o.templateId}/${o.variantId}`}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setPick({ templateId: o.templateId, variantId: o.variantId })
                  setQuantity(1)
                }}
                className={cn("w-full rounded-xl border px-3 py-2.5 text-left text-sm", on ? "border-accent bg-subtle" : "border-line bg-surface")}
              >
                <span className="block font-medium">
                  {o.name} · {o.label}
                </span>
                <span className="block text-xs text-muted">
                  {formatPrice(o.price)} · {formatDuration(o.durationMin)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {maxQ > 1 && (
        <label className="flex items-center gap-2 text-[13px]">
          Số người
          <input type="number" min={1} max={maxQ} value={quantity} onChange={(e) => setQuantity(Math.min(maxQ, Math.max(1, Number(e.target.value) || 1)))} className={cn(inputClass, "h-9 w-20 text-sm")} />
        </label>
      )}
      {error && <p className="text-[13px] text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Đóng
        </Button>
        <Button
          size="sm"
          disabled={!pick}
          onClick={() =>
            pick &&
            void act(() => actions.addOnBooking(booking.id, pick.templateId, pick.variantId, quantity), "Đã gửi, chờ người làm nhận").then((message) => {
              setError(message)
              if (!message) setOpen(false)
            })
          }
        >
          Gửi yêu cầu
        </Button>
      </div>
    </Card>
  )
}

/** Either side proposes a new time; the other side answers (RescheduleOffer). */
export function ProposeNewTime({ booking, label = "Đề nghị đổi giờ" }: { booking: Booking; label?: string }) {
  const act = useAct()
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState(booking.date)
  const [time, setTime] = React.useState(booking.time)
  const [error, setError] = React.useState<string | null>(null)
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-ink underline underline-offset-4">
        <CalendarClock className="size-4" /> {label}
      </button>
    )
  }
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold">Đề nghị giờ khác</p>
      <p className="text-xs text-muted">Bên kia đồng ý thì lịch mới đổi; giá và phụ phí giữ nguyên. Giờ mới phải nằm trong giờ làm và còn trống.</p>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" aria-label="Ngày mới" className={cn(inputClass, "text-sm")} value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
        <input type="time" aria-label="Giờ mới" step={1800} className={cn(inputClass, "text-sm")} value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      {error && <p className="text-[13px] text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Quay lại
        </Button>
        <Button
          size="sm"
          onClick={() =>
            void act(() => actions.requestReschedule(booking.id, date, time), "Đã gửi đề nghị đổi giờ").then((message) => {
              setError(message)
              if (!message) setOpen(false)
            })
          }
        >
          Gửi đề nghị
        </Button>
      </div>
    </Card>
  )
}
