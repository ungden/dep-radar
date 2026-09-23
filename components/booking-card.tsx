"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Car, Clock, CreditCard, HandCoins, Home, MapPin, Phone, Store, Timer, Zap } from "lucide-react"
import { Avatar, Button, ButtonLink, Card, StatusBadge, buttonClass } from "@/components/ui"
import { actions as store, useAct } from "@/lib/client-actions"
import { type AppState, getPro, useApp, worksOf } from "@/lib/store"
import { getTemplate } from "@/lib/catalog"
import type { Booking } from "@/lib/types"
import { addMinutes, cn, formatDateLong, formatPrice, localDate } from "@/lib/utils"

/** A picture of the work being booked, taken from the freelancer's portfolio. */
export function bookingImage(state: AppState, b: Booking) {
  const works = worksOf(state, b.proId)
  return (works.find((w) => w.templateId === b.templateId) ?? works.find((w) => w.category === b.category) ?? works[0])
    ?.images[0]
}

/** Customer-facing booking card. */
export function BookingCard({ booking }: { booking: Booking }) {
  const state = useApp()
  const pro = getPro(state, booking.proId)
  const image = bookingImage(state, booking)
  if (!pro) return null
  return (
    <Card className="p-3.5">
      <Link href={`/bookings/${booking.id}`} className="flex gap-3.5">
        <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-subtle">
          {image && <Image src={image} alt="" fill sizes="80px" className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[15px] font-bold">{booking.serviceName}</p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="truncate text-[13px] text-ink-soft">
            {booking.variantLabel} · {pro.name}
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-ink">{formatDateLong(booking.date)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-soft">
            <Clock className="size-3.5" />
            {booking.time} – {addMinutes(booking.time, booking.durationMin)}
            <span className="ml-auto text-[15px] font-bold text-ink">{formatPrice(booking.quote.total)}</span>
          </p>
          <DeliveryLine booking={booking} />
        </div>
      </Link>
      {(booking.status === "pending" || booking.status === "confirmed") && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ButtonLink href={`/bookings/${booking.id}`} variant="outline" size="sm">
            Xem chi tiết
          </ButtonLink>
          {/* Before the freelancer accepts, calling is their move, not the
              customer's -- even if a past job means the number is already known. */}
          {booking.status !== "pending" && booking.proPhone ? (
            <a href={`tel:${booking.proPhone.replace(/\s/g, "")}`} className={buttonClass("soft", "sm")}>
              <Phone className="size-3.5" /> Gọi chuyên viên
            </a>
          ) : (
            <span className="flex items-center justify-center rounded-full bg-subtle px-3 text-center text-[13px] text-ink-soft">
              Chờ {booking.proName} gọi
            </span>
          )}
        </div>
      )}
      {booking.status === "completed" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {booking.reviewed ? (
            <ButtonLink href={`/pros/${pro.id}#danh-gia`} variant="outline" size="sm">
              Xem đánh giá
            </ButtonLink>
          ) : (
            <ButtonLink href={`/bookings/${booking.id}/review`} variant="outline" size="sm">
              ★ Đánh giá
            </ButtonLink>
          )}
          <ButtonLink href={`/book/${booking.proId}?service=${booking.templateId}&variant=${booking.variantId}`} variant="soft" size="sm">
            Đặt lại
          </ButtonLink>
        </div>
      )}
    </Card>
  )
}

/** Freelancer-facing booking row (job). */
export function JobBookingRow({ booking, actions }: { booking: Booking; actions?: React.ReactNode }) {
  return (
    <Card className="p-3.5">
      <Link href={`/bookings/${booking.id}`} className="flex gap-3">
        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)] bg-ink py-2 text-white">
          <span className="text-[16px] font-bold tabular-nums">{booking.time}</span>
          <span className="text-xs text-white/70">{Math.round(booking.durationMin)} phút</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[15px] font-bold">
              {booking.serviceName} <span className="font-normal text-muted">· {booking.variantLabel}</span>
            </p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-soft">
            <Avatar name={booking.customerName} size={20} />
            {booking.customerName}
            <span className="text-muted">· {formatDateLong(booking.date)}</span>
          </p>
          <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-ink-soft">
            {booking.atHome ? (getTemplate(booking.templateId)?.onLocation ? <MapPin className="size-3.5 shrink-0" /> : <Home className="size-3.5 shrink-0" />) : <Store className="size-3.5 shrink-0" />}
            <span className="truncate">{booking.address}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
            {booking.quote.travelFee > 0 && (
              <span className="inline-flex items-center gap-0.5 text-ink-soft">
                <Car className="size-3.5" />+{formatPrice(booking.quote.travelFee)}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 text-ink-soft">
              {booking.paymentMethod === "online" ? <CreditCard className="size-3.5" /> : <HandCoins className="size-3.5" />}
              {booking.paymentMethod === "online" ? "Đã TT online" : "Thu tại chỗ"}
            </span>
            {booking.quote.urgentFee > 0 && (
              <span className="inline-flex items-center gap-0.5 text-warning">
                <Zap className="size-3.5" />+{formatPrice(booking.quote.urgentFee)}
              </span>
            )}
            <span className="ml-auto text-muted">
              Bạn nhận <b className="text-[15px] text-success">{formatPrice(booking.quote.payout)}</b>
            </span>
          </p>
        </div>
      </Link>
      {booking.status === "pending" && <ConfirmCountdown booking={booking} />}
      <DeliveryLine booking={booking} forPro />
      {actions && <div className="mt-3 grid grid-cols-2 gap-2">{actions}</div>}
      {!actions && booking.status === "pending" && <PendingJobActions booking={booking} />}
    </Card>
  )
}

/** Freelancer calls the customer to confirm details, then accepts. */
export function PendingJobActions({ booking }: { booking: Booking }) {
  const act = useAct()
  const [error, setError] = React.useState<string | null>(null)
  return (
    <>
      <div className="mt-3 grid grid-cols-[auto_1fr_1fr] gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void act(() => store.setBookingStatus(booking.id, "declined"), "Đã từ chối job").then(setError)}
        >
          Từ chối
        </Button>
        <a href={`tel:${booking.customerPhone.replace(/\s/g, "")}`} className={buttonClass("outline", "sm")}>
          <Phone className="size-3.5" /> Gọi khách
        </a>
        <Button
          size="sm"
          onClick={() => void act(() => store.setBookingStatus(booking.id, "confirmed"), "Đã nhận job").then(setError)}
        >
          Đã gọi, nhận job
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </>
  )
}

/**
 * The freelancer has until confirm_by to call and accept, after which the
 * database expires the request and frees the slot. Show the real deadline.
 */
export function ConfirmCountdown({ booking }: { booking: Booking }) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const left = Date.parse(booking.confirmBy) - now
  if (!Number.isFinite(left)) return null
  const minutes = Math.max(0, Math.round(left / 60000))
  const urgent = minutes <= 30
  return (
    <p className={cn("mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold", urgent ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning")}>
      <Timer className="size-4" />
      {minutes === 0
        ? "Đã quá hạn gọi xác nhận"
        : `Còn ${minutes >= 60 ? `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút` : `${minutes} phút`} để gọi và nhận`}
    </p>
  )
}

/** Photo & video: the files owed after the session. Only real dates. */
export function DeliveryLine({ booking, forPro }: { booking: Booking; forPro?: boolean }) {
  const [now] = React.useState(() => Date.now())
  const d = booking.delivery
  if (!d || booking.status !== "completed") return null
  if (d.acceptedAt) return <p className="mt-1.5 text-[13px] font-medium text-success">Đã nhận file</p>
  if (d.deliveredAt) return <p className="mt-1.5 text-[13px] font-medium text-success">{forPro ? "Đã giao file, chờ khách xác nhận" : "Đã giao file · mở để xem"}</p>
  if (!d.dueAt) return null
  const overdue = Date.parse(d.dueAt) < now
  return (
    <p className={cn("mt-1.5 text-[13px] font-medium", overdue ? "text-danger" : "text-warning")}>
      {overdue ? "Quá hạn giao file" : `Đang chỉnh, hạn giao ${formatDateLong(localDate(d.dueAt))}`}
    </p>
  )
}
