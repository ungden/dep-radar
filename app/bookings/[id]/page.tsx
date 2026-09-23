"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CalendarDays, CalendarPlus, Home, Info, MapPinned, Phone, Store, Timer } from "lucide-react"
import { ProCard } from "@/components/beauty"
import { bookingImage } from "@/components/booking-card"
import { BookingTimeline, ComboPartners, DeliveryPanel, ReviewCustomer } from "@/components/booking-extras"
import { PriceBreakdown } from "@/components/price-breakdown"
import { MessageButton } from "@/components/message-button"
import { ReportButton } from "@/components/report-button"
import { ShareBooking } from "@/components/share-booking"
import { RequireSession } from "@/components/require-session"
import { Avatar, BottomBar, Button, ButtonLink, Card, EmptyState, PageHeader, StatusBadge, buttonClass, inputClass } from "@/components/ui"
import { formatPhone } from "@/lib/auth/phone"
import { actions, useAct } from "@/lib/client-actions"
import { getTemplate } from "@/lib/catalog"
import { getPro, servicesOf, useApp, type AppState } from "@/lib/store"
import { POLICY, hoursUntilStart } from "@/lib/pricing"
import { rankScore } from "@/lib/trust"
import type { Booking, Pro } from "@/lib/types"
import { addMinutes, cn, formatDateLong, formatDuration, formatPrice, localDate, localTime, toTimestamptz, todayISO } from "@/lib/utils"

export default function BookingDetailPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Chi tiết lịch hẹn" back />
      <RequireSession>
        <BookingDetail />
      </RequireSession>
    </div>
  )
}

function BookingDetail() {
  const { id } = useParams<{ id: string }>()
  const state = useApp()
  const { bookings, session } = state
  const act = useAct()
  const booking = bookings.find((b) => b.id === id)
  const [confirmCancel, setConfirmCancel] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isPro = session?.role === "pro" && booking?.proId === session.proId
  const isCustomer = session?.role === "customer" && booking?.mine

  if (!booking || (!isPro && !isCustomer)) {
    return (
      <EmptyState
        icon={<CalendarDays className="size-6" />}
        title="Không tìm thấy lịch hẹn"
        text="Lịch hẹn không tồn tại hoặc không thuộc tài khoản ở chế độ hiện tại."
        action={<ButtonLink href={session?.role === "pro" ? "/studio/schedule" : "/bookings"}>Về danh sách</ButtonLink>}
      />
    )
  }

  const pro = getPro(state, booking.proId)
  if (!pro) {
    return (
      <EmptyState
        icon={<CalendarDays className="size-6" />}
        title="Người làm không còn hoạt động"
        text="Hồ sơ của người làm trong lịch hẹn này đã bị ẩn. Liên hệ hỗ trợ nếu bạn cần giúp."
        action={<ButtonLink href="/bookings">Về danh sách</ButtonLink>}
      />
    )
  }
  const image = bookingImage(state, booking)
  const active = booking.status === "pending" || booking.status === "confirmed"
  const run = (fn: () => Promise<{ error?: string }>, done?: string) =>
    void act(fn, done).then((message) => setError(message))
  const freeCancel = hoursUntilStart(booking.date, booking.time) >= POLICY.freeCancelHours

  const onLocation = Boolean(getTemplate(booking.templateId)?.onLocation)

  return (
    <div className="space-y-4">
      <BookingTimeline booking={booking} />
      <DeliveryPanel booking={booking} isPro={isPro} />
      <ComboPartners booking={booking} />

      <Card className="flex items-center gap-3 p-4">
        {isPro ? <Avatar name={booking.customerName} size={48} /> : <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={48} />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{isPro ? booking.customerName : pro.name}</p>
          <p className="text-xs text-muted">
            {isPro ? `Khách hàng · ${formatPhone(booking.customerPhone)}` : pro.title}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </Card>

      <Card className="flex items-center gap-3 p-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-subtle">
          {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
        </div>
        <div>
          <p className="font-semibold">{booking.serviceName}</p>
          <p className="text-sm text-ink-soft">
            {booking.variantLabel} · {formatPrice(booking.quote.servicePrice)} · {formatDuration(booking.durationMin)}
          </p>
          {booking.source === "job" && <p className="mt-0.5 text-xs text-accent">Từ yêu cầu đã đăng</p>}
        </div>
      </Card>

      <Card className="divide-y divide-line px-4 text-sm">
        <div className="flex gap-4 py-3.5">
          <span className="w-20 shrink-0 text-[13px] text-muted">Thời gian</span>
          <span className="font-medium">
            {formatDateLong(booking.date, true)}
            <br />
            {booking.time} - {addMinutes(booking.time, booking.durationMin)}
          </span>
        </div>
        <div className="flex gap-4 py-3.5">
          <span className="w-20 shrink-0 text-[13px] text-muted">Địa điểm</span>
          <span className="font-medium">
            <span className="mb-0.5 flex items-center gap-1 text-xs font-normal text-accent">
              {booking.atHome ? <Home className="size-3.5" /> : <Store className="size-3.5" />}
              {booking.atHome ? (onLocation ? "Địa điểm khách chọn" : "Làm tại nhà khách") : "Tại studio"}
            </span>
            {booking.address}
          </span>
        </div>
        {(booking.usageScope === "commercial" || booking.consentRepost || onLocation) && (
          <div className="flex gap-4 py-3.5">
            <span className="w-20 shrink-0 text-[13px] text-muted">Hình ảnh</span>
            <span className="text-ink-soft">
              {booking.usageScope === "commercial" ? "Dùng cho kinh doanh" : "Dùng cá nhân"}
              <br />
              {booking.consentRepost ? "Khách đồng ý cho đăng làm tác phẩm" : "Không đăng làm tác phẩm"}
            </span>
          </div>
        )}
        {booking.note && (
          <div className="flex gap-4 py-3.5">
            <span className="w-20 shrink-0 text-[13px] text-muted">Ghi chú</span>
            <span className="text-ink-soft">{booking.note}</span>
          </div>
        )}
      </Card>

      <PriceBreakdown quote={booking.quote} paymentMethod={booking.paymentMethod} forPro={isPro} />

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {isPro && booking.status === "pending" && (
        <p className="flex gap-2 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
          <Phone className="mt-0.5 size-4 shrink-0" />
          Gọi cho khách ({formatPhone(booking.customerPhone)}) để xác nhận giờ, địa chỉ và yêu cầu trước khi nhận job.
          Cần phản hồi trong {POLICY.confirmWithinHours} giờ.
        </p>
      )}

      {isCustomer && booking.status === "pending" && <CustomerConfirmWait booking={booking} proName={pro.name} />}

      {isCustomer && active && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => downloadIcs(booking, pro.name)} className={buttonClass("soft", "sm")}>
            <CalendarPlus className="size-4" /> Thêm vào lịch
          </button>
          {!booking.atHome && booking.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("soft", "sm")}
            >
              <MapPinned className="size-4" /> Chỉ đường tới studio
            </a>
          )}
        </div>
      )}

      {isCustomer && active && (
        <div className="space-y-2">
          <p className="flex gap-2 text-xs text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {freeCancel
              ? `Huỷ miễn phí trước giờ hẹn ${POLICY.freeCancelHours} tiếng${booking.paymentMethod === "online" ? ", hoàn 100% tiền đã thanh toán" : ""}.`
              : booking.paymentMethod === "online"
                ? `Đã quá hạn huỷ miễn phí. Nếu huỷ, ${Math.round(POLICY.lateCancelRate * 100)}% giá trị lịch hẹn được chuyển cho ${pro.name} để bù thời gian giữ lịch.`
                : `Đã quá hạn huỷ miễn phí. Nếu vẫn cần huỷ, hãy báo ${pro.name} sớm nhất có thể.`}
          </p>
          {/* Cancelling is possible, not the point of the page: a text button,
              with one more tap to confirm. */}
          {confirmCancel ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5">
              <span className="flex-1 text-[14px] font-semibold text-danger">Huỷ lịch hẹn này?</span>
              <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>
                Giữ lịch
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  run(() => actions.setBookingStatus(booking.id, "cancelled", "Khách huỷ lịch"), "Đã huỷ lịch hẹn")
                  setConfirmCancel(false)
                }}
              >
                Xác nhận huỷ
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="inline-flex min-h-11 items-center text-[14px] font-semibold text-danger underline underline-offset-4"
            >
              Huỷ lịch
            </button>
          )}
        </div>
      )}

      {active && (isPro || (booking.status !== "pending" && booking.proPhone)) && (
        <BottomBar>
          {/* Before the person accepts, calling is their move: the number
              appears once they have confirmed. */}
          {isCustomer && booking.proPhone && (
            <a href={`tel:${booking.proPhone.replace(/\s/g, "")}`} className={buttonClass("primary", "lg", "w-full")}>
              <Phone className="size-4" /> Gọi {booking.proName}
            </a>
          )}
          {isPro && booking.status === "pending" && (
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
              <Button variant="ghost" size="lg" onClick={() => run(() => actions.setBookingStatus(booking.id, "declined"), "Đã từ chối lịch")}>
                Từ chối
              </Button>
              <a href={`tel:${booking.customerPhone.replace(/\s/g, "")}`} className={buttonClass("outline", "lg")}>
                <Phone className="size-4" /> Gọi khách
              </a>
              <Button size="lg" onClick={() => run(() => actions.setBookingStatus(booking.id, "confirmed"), "Đã nhận lịch")}>
                Đã gọi, nhận lịch
              </Button>
            </div>
          )}
          {isPro && (booking.status === "confirmed" || booking.status === "in_progress") && (
            <div className="grid grid-cols-2 gap-2">
              <a href={`tel:${booking.customerPhone.replace(/\s/g, "")}`} className={buttonClass("outline", "lg")}>
                <Phone className="size-4" /> Gọi khách
              </a>
              <Button size="lg" onClick={() => run(() => actions.setBookingStatus(booking.id, "completed"), "Đã đánh dấu hoàn thành")}>
                Đánh dấu hoàn thành
              </Button>
            </div>
          )}
        </BottomBar>
      )}

      {/* The awkward outcomes, kept out of the main bar but not hidden away:
          a job the freelancer has to give back, a time that has to move, and a
          customer who was not there. */}
      {isPro && active && <ProTrouble booking={booking} onError={setError} />}
      {isPro && <ReviewCustomer booking={booking} />}
      {isCustomer && booking.rescheduleTo && booking.rescheduleBy === "pro" && (
        <RescheduleOffer booking={booking} onError={setError} />
      )}

      {!active && isCustomer && (booking.status === "declined" || booking.status === "expired") && (
        <Alternatives state={state} booking={booking} pro={pro} />
      )}

      {!active && isCustomer && booking.status !== "declined" && booking.status !== "expired" && (
        <div className="grid grid-cols-2 gap-2">
          {booking.status === "completed" && !booking.reviewed ? (
            <ButtonLink href={`/bookings/${booking.id}/review`} variant="outline">
              ★ Đánh giá
            </ButtonLink>
          ) : (
            <ButtonLink href={`/pros/${pro.id}`} variant="outline">
              Xem hồ sơ
            </ButtonLink>
          )}
          <ButtonLink href={`/book/${booking.proId}?service=${booking.templateId}&variant=${booking.variantId}`}>Đặt lại</ButtonLink>
        </div>
      )}
      <div className="flex justify-center pt-2">
        <MessageButton proId={booking.proId} bookingId={booking.id} label="Nhắn tin" />
      </div>

      <div className="flex flex-col items-center gap-2 pt-1">
        {isCustomer && active && <ShareBooking booking={booking} />}
        <ReportButton bookingId={booking.id} targetAccountId={isPro ? booking.customerId : null} />
      </div>

      {isPro && (
        <p className="text-center text-xs text-muted">
          <Link href="/studio/schedule" className="underline underline-offset-2">
            Về lịch làm
          </Link>
        </p>
      )}
    </div>
  )
}

/**
 * The person has until confirm_by to call and accept; after that the database
 * lets the request lapse. The customer sees the real deadline, not a promise.
 */
function CustomerConfirmWait({ booking, proName }: { booking: Booking; proName: string }) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const deadline = Date.parse(booking.confirmBy)
  if (!Number.isFinite(deadline)) return null
  const minutes = Math.max(0, Math.round((deadline - now) / 60000))
  const left = minutes >= 60 ? `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút` : `${minutes} phút`
  return (
    <div className="rounded-xl bg-subtle px-3.5 py-3 text-[14px]">
      <p className="flex items-center gap-2 font-semibold text-accent-dark">
        <Timer className="size-4 shrink-0" />
        {minutes === 0 ? "Đã hết thời gian chờ xác nhận" : `Chờ ${proName} gọi xác nhận · còn ${left}`}
      </p>
      <p className="mt-1 flex gap-2 text-[13px] text-ink-soft">
        <Phone className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {proName} sẽ gọi số {formatPhone(booking.customerPhone)} trước {localTime(booking.confirmBy)}. Không ai xác nhận thì
          lịch tự huỷ{booking.paymentMethod === "online" ? " và tiền được hoàn 100%" : ""}, bạn không mất gì.
        </span>
      </p>
    </div>
  )
}

/**
 * Declined or lapsed: rebooking the same person is the wrong suggestion. Up to
 * three others who list the same service in the same city and take bookings.
 */
function Alternatives({ state, booking, pro }: { state: AppState; booking: Booking; pro: Pro }) {
  const others = state.pros
    .filter(
      (p) =>
        p.id !== pro.id &&
        p.published &&
        p.acceptingJobs &&
        p.city === pro.city &&
        servicesOf(state, p.id).some((s) => s.templateId === booking.templateId),
    )
    .sort((a, b) => rankScore(b) - rankScore(a))
    .slice(0, 3)
  return (
    <section>
      <h2 className="text-[17px] font-bold tracking-tight">Người khác nhận dịch vụ này</h2>
      {others.length ? (
        <ul className="mt-3 space-y-3">
          {others.map((p) => (
            <li key={p.id}>
              <ProCard pro={p} />
              <ButtonLink href={`/book/${p.id}?service=${booking.templateId}`} size="sm" className="mt-2 w-full">
                Đặt với {p.name}
              </ButtonLink>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[14px] text-ink-soft">
          Chưa có ai khác ở {pro.city} nhận {booking.serviceName.toLowerCase()}.{" "}
          <Link href={`/requests/new?service=${booking.templateId}`} className="font-semibold text-accent underline underline-offset-2">
            Đăng yêu cầu
          </Link>{" "}
          để người làm quanh bạn gửi báo giá.
        </p>
      )}
    </section>
  )
}

/** An .ics file for the phone's calendar, built here: nothing is sent anywhere. */
function downloadIcs(booking: Booking, proName: string) {
  const start = new Date(toTimestamptz(booking.date, booking.time))
  const end = new Date(start.getTime() + booking.durationMin * 60_000)
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const text = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n")
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//360dep//Lich hen//VI",
    "BEGIN:VEVENT",
    `UID:${booking.id}@360dep.vn`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${text(`${booking.serviceName} · ${proName}`)}`,
    booking.address ? `LOCATION:${text(booking.address)}` : "",
    `DESCRIPTION:${text(`Lịch hẹn trên 360dep: ${window.location.origin}/bookings/${booking.id}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `360dep-lich-hen-${booking.date}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** What a freelancer does when a job cannot go ahead as booked. */
function ProTrouble({ booking, onError }: { booking: Booking; onError: (message: string | null) => void }) {
  const act = useAct()
  const [mode, setMode] = React.useState<"none" | "cancel" | "reschedule" | "noshow">("none")
  const [reason, setReason] = React.useState("")
  const [date, setDate] = React.useState(booking.date)
  const [time, setTime] = React.useState(booking.time)

  const run = (fn: () => Promise<{ error?: string }>, done: string) =>
    void act(fn, done).then((message) => {
      onError(message)
      if (!message) setMode("none")
    })

  // Reporting a no-show only makes sense once the appointment has started.
  const started = hoursUntilStart(booking.date, booking.time) < 0

  if (mode === "none") {
    return (
      <div className="flex flex-wrap gap-3 text-[13px]">
        <button type="button" className="text-muted underline underline-offset-2" onClick={() => setMode("reschedule")}>
          Đề nghị đổi giờ
        </button>
        <button type="button" className="text-muted underline underline-offset-2" onClick={() => setMode("cancel")}>
          Huỷ job này
        </button>
        {started && booking.status !== "pending" && (
          <button type="button" className="text-muted underline underline-offset-2" onClick={() => setMode("noshow")}>
            Khách không có mặt
          </button>
        )}
      </div>
    )
  }

  return (
    <Card className="space-y-3 p-4">
      {mode === "reschedule" && (
        <>
          <p className="text-sm font-semibold">Đề nghị giờ khác</p>
          <p className="text-xs text-muted">Khách phải đồng ý thì lịch mới đổi. Gọi trước cho khách sẽ nhanh hơn.</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              aria-label="Ngày mới"
              className={cn(inputClass, "text-sm")}
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="time"
              aria-label="Giờ mới"
              step={1800}
              className={cn(inputClass, "text-sm")}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </>
      )}

      {mode !== "reschedule" && (
        <>
          <p className="text-sm font-semibold">
            {mode === "cancel" ? "Huỷ job đã nhận" : "Báo khách không có mặt"}
          </p>
          <p className="text-xs text-muted">
            {mode === "cancel"
              ? "Khách không mất phí. Huỷ nhiều lần sẽ ảnh hưởng tới thứ hạng hiển thị của bạn."
              : `Chỉ báo khi bạn đã tới nơi và chờ. 360dep bù phí di chuyển ${formatPrice(booking.quote.travelFee)} vào ví bạn.`}
          </p>
          <input
            className={cn(inputClass, "text-sm")}
            placeholder="Lý do (gửi cho khách)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setMode("none")}>
          Quay lại
        </Button>
        {mode === "reschedule" && (
          <Button size="sm" onClick={() => run(() => actions.requestReschedule(booking.id, date, time), "Đã gửi đề nghị đổi giờ")}>
            Gửi đề nghị
          </Button>
        )}
        {mode === "cancel" && (
          <Button variant="danger" size="sm" onClick={() => run(() => actions.setBookingStatus(booking.id, "cancelled", reason), "Đã huỷ job")}>
            Xác nhận huỷ
          </Button>
        )}
        {mode === "noshow" && (
          <Button variant="danger" size="sm" onClick={() => run(() => actions.setBookingStatus(booking.id, "no_show", reason), "Đã báo khách vắng mặt")}>
            Xác nhận vắng mặt
          </Button>
        )}
      </div>
    </Card>
  )
}

/** The customer answering a time the freelancer proposed. */
function RescheduleOffer({ booking, onError }: { booking: Booking; onError: (message: string | null) => void }) {
  const act = useAct()
  const when = booking.rescheduleTo
  if (!when) return null
  return (
    <Card className="p-4 ring-1 ring-warning/40">
      <p className="text-sm font-semibold">{booking.proName} đề nghị đổi sang giờ khác</p>
      <p className="mt-0.5 text-[13px] text-ink-soft">
        {formatDateLong(localDate(when), true)} · {localTime(when)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void act(() => actions.respondReschedule(booking.id, false), "Đã giữ giờ cũ").then(onError)}
        >
          Giữ giờ cũ
        </Button>
        <Button size="sm" onClick={() => void act(() => actions.respondReschedule(booking.id, true), "Đã đổi giờ hẹn").then(onError)}>
          Đồng ý đổi
        </Button>
      </div>
    </Card>
  )
}
