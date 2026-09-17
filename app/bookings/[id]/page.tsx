"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CalendarDays, Home, Info, MessageSquareText, Phone, Store } from "lucide-react"
import { bookingImage } from "@/components/booking-card"
import { RequireSession } from "@/components/require-session"
import { Avatar, BottomBar, Button, ButtonLink, Card, EmptyState, PageHeader, StatusBadge, buttonClass } from "@/components/ui"
import { getPro } from "@/lib/data"
import { actions, useApp } from "@/lib/store"
import { addMinutes, formatDateLong, formatDuration, formatPrice, hoursUntil } from "@/lib/utils"

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
  const freeCancel = hoursUntil(booking.date, booking.time) >= 12

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
            {formatPrice(booking.total)} · {formatDuration(booking.durationMin)}
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

      <Card className="space-y-2 p-4 text-sm">
        <div className="flex justify-between font-semibold">
          <span>Tổng tiền</span>
          <span>{formatPrice(booking.total)}</span>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>{isPro ? "Khách đã cọc" : "Đặt cọc (30%)"}</span>
          <span>{formatPrice(booking.deposit)}</span>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>{isPro ? "Thu tại chỗ" : "Thanh toán sau khi làm"}</span>
          <span>{formatPrice(booking.total - booking.deposit)}</span>
        </div>
      </Card>

      {isCustomer && active && (
        <p className="flex gap-2 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {freeCancel
            ? "Bạn có thể hủy miễn phí trước giờ hẹn 12 tiếng, tiền cọc được hoàn 100%."
            : "Đã quá thời hạn hủy miễn phí. Nếu hủy, tiền cọc sẽ chuyển cho chuyên viên."}
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
                  Xác nhận hủy
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="lg" className="border-line text-ink" onClick={() => setConfirmCancel(true)}>
                  Hủy lịch
                </Button>
                <a href="tel:0968000111" className={buttonClass("primary", "lg")}>
                  <Phone className="size-4" /> Liên hệ
                </a>
              </div>
            )
          )}
          {isPro && booking.status === "pending" && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" className="border-line text-ink" onClick={() => actions.setBookingStatus(booking.id, "declined")}>
                Từ chối
              </Button>
              <Button size="lg" onClick={() => actions.setBookingStatus(booking.id, "confirmed")}>
                Nhận job
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

      {!active && isCustomer && booking.serviceId && (
        <div className="grid grid-cols-2 gap-2">
          <ButtonLink href={`/pros/${pro.id}`} variant="outline">
            Xem hồ sơ
          </ButtonLink>
          <ButtonLink href={`/book/${booking.serviceId}`}>Đặt lại</ButtonLink>
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
