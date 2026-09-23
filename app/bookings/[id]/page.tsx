"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CalendarDays, Home, Info, Phone, Store } from "lucide-react"
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
import { getPro, useApp } from "@/lib/store"
import { POLICY, hoursUntilStart } from "@/lib/pricing"
import type { Booking } from "@/lib/types"
import { addMinutes, cn, formatDateLong, formatDuration, formatPrice, localDate, localTime, todayISO } from "@/lib/utils"

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

      {isCustomer && booking.status === "pending" && (
        <p className="flex gap-2 rounded-xl bg-subtle px-3.5 py-2.5 text-[13px] text-accent-dark">
          <Phone className="mt-0.5 size-4 shrink-0" />
          {pro.name} sẽ gọi cho bạn qua số {formatPhone(booking.customerPhone)} để xác nhận trong{" "}
          {POLICY.confirmWithinHours} giờ
          {booking.paymentMethod === "online" ? ". Nếu không được xác nhận, tiền được hoàn 100%." : "."}
        </p>
      )}

      {isCustomer && active && (
        <p className="flex gap-2 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {freeCancel
            ? `Huỷ miễn phí trước giờ hẹn ${POLICY.freeCancelHours} tiếng${booking.paymentMethod === "online" ? ", hoàn 100% tiền đã thanh toán" : ""}.`
            : booking.paymentMethod === "online"
              ? `Đã quá hạn huỷ miễn phí. Nếu huỷ, ${Math.round(POLICY.lateCancelRate * 100)}% giá trị lịch hẹn được chuyển cho chuyên viên để bù thời gian giữ lịch.`
              : "Đã quá hạn huỷ miễn phí. Huỷ muộn nhiều lần có thể bị tạm khoá hình thức trả sau."}
        </p>
      )}

      {active && (
        <BottomBar>
          {isCustomer && (
            confirmCancel ? (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="lg" onClick={() => setConfirmCancel(false)}>
                  Giữ lịch
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  onClick={() => {
                    run(() => actions.setBookingStatus(booking.id, "cancelled", "Khách huỷ lịch"), "Đã huỷ lịch hẹn")
                    setConfirmCancel(false)
                  }}
                >
                  Xác nhận huỷ
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="lg" className="border-line text-ink" onClick={() => setConfirmCancel(true)}>
                  Huỷ lịch
                </Button>
                {booking.status !== "pending" && booking.proPhone ? (
                  <a href={`tel:${booking.proPhone.replace(/\s/g, "")}`} className={buttonClass("primary", "lg")}>
                    <Phone className="size-4" /> Gọi {booking.proName}
                  </a>
                ) : (
                  // The number appears once the freelancer has accepted the job.
                  <span className="flex items-center justify-center rounded-full bg-subtle px-3 text-center text-[13px] text-ink-soft">
                    {booking.proName} sẽ gọi cho bạn
                  </span>
                )}
              </div>
            )
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

      {!active && isCustomer && (
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
