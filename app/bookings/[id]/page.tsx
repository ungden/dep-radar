"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CalendarDays, Home, Info, MessageSquareText, Phone, Store } from "lucide-react"
import { bookingImage } from "@/components/booking-card"
import { PriceBreakdown } from "@/components/price-breakdown"
import { RequireSession } from "@/components/require-session"
import { Avatar, BottomBar, Button, ButtonLink, Card, EmptyState, PageHeader, StatusBadge, buttonClass } from "@/components/ui"
import { getPro } from "@/lib/data"
import { actions, useApp } from "@/lib/store"
import { POLICY, hoursUntilStart } from "@/lib/pricing"
import { addMinutes, formatDateLong, formatDuration, formatPrice } from "@/lib/utils"

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
  const { bookings, session } = useApp()
  const booking = bookings.find((b) => b.id === id)
  const [confirmCancel, setConfirmCancel] = React.useState(false)

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

  const pro = getPro(booking.proId)!
  const image = bookingImage(booking)
  const active = booking.status === "pending" || booking.status === "confirmed"
  const freeCancel = hoursUntilStart(booking.date, booking.time) >= POLICY.freeCancelHours

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 p-4">
        {isPro ? <Avatar name={booking.customerName} size={48} /> : <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={48} />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{isPro ? booking.customerName : pro.name}</p>
          <p className="text-xs text-muted">{isPro ? `Khách hàng · ${booking.customerPhone}` : pro.title}</p>
        </div>
        <StatusBadge status={booking.status} />
      </Card>

      <Card className="flex items-center gap-3 p-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-blush">
          {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
        </div>
        <div>
          <p className="font-semibold">{booking.serviceName}</p>
          <p className="text-sm text-ink-soft">
            {booking.variantLabel} · {formatPrice(booking.quote.servicePrice)} · {formatDuration(booking.durationMin)}
          </p>
          {booking.source === "job" && <p className="mt-0.5 text-xs text-rose">Từ yêu cầu đã đăng</p>}
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
            <span className="mb-0.5 flex items-center gap-1 text-xs font-normal text-rose">
              {booking.atHome ? <Home className="size-3.5" /> : <Store className="size-3.5" />}
              {booking.atHome ? "Làm tại nhà khách" : "Tại studio"}
            </span>
            {booking.address}
          </span>
        </div>
        {booking.note && (
          <div className="flex gap-4 py-3.5">
            <span className="w-20 shrink-0 text-[13px] text-muted">Ghi chú</span>
            <span className="text-ink-soft">{booking.note}</span>
          </div>
        )}
      </Card>

      <PriceBreakdown quote={booking.quote} paymentMethod={booking.paymentMethod} forPro={isPro} />

      {isPro && booking.status === "pending" && (
        <p className="flex gap-2 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
          <Phone className="mt-0.5 size-4 shrink-0" />
          Gọi cho khách ({booking.customerPhone}) để xác nhận giờ, địa chỉ và yêu cầu trước khi nhận job. Cần phản hồi trong {POLICY.confirmWithinHours} giờ.
        </p>
      )}

      {isCustomer && booking.status === "pending" && (
        <p className="flex gap-2 rounded-xl bg-blush px-3.5 py-2.5 text-[13px] text-rose-dark">
          <Phone className="mt-0.5 size-4 shrink-0" />
          {pro.name} sẽ gọi cho bạn qua số {booking.customerPhone} để xác nhận trong {POLICY.confirmWithinHours} giờ
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
                    actions.setBookingStatus(booking.id, "cancelled")
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
                <a href="tel:0968000111" className={buttonClass("primary", "lg")}>
                  <Phone className="size-4" /> Liên hệ
                </a>
              </div>
            )
          )}
          {isPro && booking.status === "pending" && (
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
              <Button variant="ghost" size="lg" onClick={() => actions.setBookingStatus(booking.id, "declined")}>
                Từ chối
              </Button>
              <a href={`tel:${booking.customerPhone.replace(/\s/g, "")}`} className={buttonClass("outline", "lg")}>
                <Phone className="size-4" /> Gọi khách
              </a>
              <Button size="lg" onClick={() => actions.setBookingStatus(booking.id, "confirmed")}>
                Đã gọi, nhận job
              </Button>
            </div>
          )}
          {isPro && booking.status === "confirmed" && (
            <div className="grid grid-cols-2 gap-2">
              <a href={`tel:${booking.customerPhone.replace(/\s/g, "")}`} className={buttonClass("outline", "lg")}>
                <MessageSquareText className="size-4" /> Gọi khách
              </a>
              <Button size="lg" onClick={() => actions.setBookingStatus(booking.id, "completed")}>
                Đánh dấu hoàn thành
              </Button>
            </div>
          )}
        </BottomBar>
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
