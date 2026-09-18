"use client"

import Image from "next/image"
import Link from "next/link"
import { Car, Clock, CreditCard, HandCoins, Home, Phone, Store, Zap } from "lucide-react"
import { Avatar, Button, ButtonLink, Card, StatusBadge, buttonClass } from "@/components/ui"
import { actions as store } from "@/lib/store"
import { getPro, worksByPro } from "@/lib/data"
import type { Booking } from "@/lib/types"
import { addMinutes, formatDateLong, formatPrice } from "@/lib/utils"

export function bookingImage(b: Booking) {
  const works = worksByPro(b.proId)
  return (works.find((w) => w.templateId === b.templateId) ?? works.find((w) => w.category === b.category) ?? works[0])?.images[0]
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
          <p className="truncate text-[13px] text-ink-soft">
            {booking.variantLabel} · {pro.name}
          </p>
          <p className="mt-1 text-xs text-muted">{formatDateLong(booking.date)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <Clock className="size-3.5" />
            {booking.time} - {addMinutes(booking.time, booking.durationMin)}
            <span className="ml-auto text-sm font-semibold text-ink">{formatPrice(booking.quote.total)}</span>
          </p>
        </div>
      </Link>
      {(booking.status === "pending" || booking.status === "confirmed") && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ButtonLink href={`/bookings/${booking.id}`} variant="outline" size="sm" className="border-line text-ink">
            Xem chi tiết
          </ButtonLink>
          <a href={`tel:${pro.phone.replace(/\s/g, "")}`} className={buttonClass("soft", "sm")}>
            <Phone className="size-3.5" /> Gọi chuyên viên
          </a>
        </div>
      )}
      {booking.status === "completed" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {booking.reviewed ? (
            <ButtonLink href={`/pros/${pro.id}?tab=reviews`} variant="outline" size="sm" className="border-line text-ink">
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
        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-blush py-2 text-rose-dark">
          <span className="text-base font-semibold">{booking.time}</span>
          <span className="text-[10px]">{Math.round(booking.durationMin)}′</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">
              {booking.serviceName} <span className="font-normal text-muted">· {booking.variantLabel}</span>
            </p>
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
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
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
              Bạn nhận <b className="text-sm text-success">{formatPrice(booking.quote.payout)}</b>
            </span>
          </p>
        </div>
      </Link>
      {actions && <div className="mt-3 grid grid-cols-2 gap-2">{actions}</div>}
      {!actions && booking.status === "pending" && <PendingJobActions booking={booking} />}
    </Card>
  )
}

/** Freelancer calls the customer to confirm details, then accepts. */
export function PendingJobActions({ booking }: { booking: Booking }) {
  return (
    <div className="mt-3 grid grid-cols-[auto_1fr_1fr] gap-2">
      <Button variant="ghost" size="sm" onClick={() => store.setBookingStatus(booking.id, "declined")}>
        Từ chối
      </Button>
      <a href={`tel:${booking.customerPhone.replace(/\s/g, "")}`} className={buttonClass("outline", "sm")}>
        <Phone className="size-3.5" /> Gọi khách
      </a>
      <Button size="sm" onClick={() => store.setBookingStatus(booking.id, "confirmed")}>
        Đã gọi, nhận job
      </Button>
    </div>
  )
}
