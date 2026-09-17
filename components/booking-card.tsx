"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Home, Phone, Store } from "lucide-react"
import { Avatar, ButtonLink, Card, StatusBadge, buttonClass } from "@/components/ui"
import { getPro, worksByPro } from "@/lib/data"
import type { Booking } from "@/lib/types"
import { addMinutes, formatDateLong, formatPrice } from "@/lib/utils"

export function bookingImage(b: Booking) {
  const works = worksByPro(b.proId)
  return (works.find((w) => w.serviceId === b.serviceId) ?? works.find((w) => w.category === b.category) ?? works[0])?.images[0]
}

/** Customer-facing booking card. */
export function BookingCard({ booking }: { booking: Booking }) {
  const pro = getPro(booking.proId)!
  const image = bookingImage(booking)
  return (
    <Card className="p-3.5">
      <Link href={`/bookings/${booking.id}`} className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-blush">
          {image && <Image src={image} alt="" fill sizes="80px" className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">{booking.serviceName}</p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-[13px] text-ink-soft">{pro.name}</p>
          <p className="mt-1 text-xs text-muted">{formatDateLong(booking.date)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <Clock className="size-3.5" />
            {booking.time} - {addMinutes(booking.time, booking.durationMin)}
            <span className="ml-auto text-sm font-semibold text-ink">{formatPrice(booking.total)}</span>
          </p>
        </div>
      </Link>
      {(booking.status === "pending" || booking.status === "confirmed") && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ButtonLink href={`/bookings/${booking.id}`} variant="outline" size="sm" className="border-line text-ink">
            Xem chi tiết
          </ButtonLink>
          <a href="tel:0968000111" className={buttonClass("soft", "sm")}>
            <Phone className="size-3.5" /> Liên hệ
          </a>
        </div>
      )}
      {booking.status === "completed" && booking.serviceId && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ButtonLink href={`/pros/${pro.id}?tab=reviews`} variant="outline" size="sm" className="border-line text-ink">
            Đánh giá
          </ButtonLink>
          <ButtonLink href={`/book/${booking.serviceId}`} variant="soft" size="sm">
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
        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-blush py-2 text-rose-dark">
          <span className="text-base font-semibold">{booking.time}</span>
          <span className="text-[10px]">{Math.round(booking.durationMin)}′</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">{booking.serviceName}</p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-soft">
            <Avatar name={booking.customerName} size={20} />
            {booking.customerName}
            <span className="text-muted">· {formatDateLong(booking.date)}</span>
          </p>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
            {booking.atHome ? <Home className="size-3.5 shrink-0" /> : <Store className="size-3.5 shrink-0" />}
            <span className="truncate">{booking.address}</span>
            <span className="ml-auto shrink-0 pl-2 text-sm font-semibold text-ink">{formatPrice(booking.total)}</span>
          </p>
        </div>
      </Link>
      {actions && <div className="mt-3 grid grid-cols-2 gap-2">{actions}</div>}
    </Card>
  )
}
