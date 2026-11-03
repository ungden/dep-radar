"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { adminCancelBooking, adminCompleteBooking, type AdminBookingDetail } from "@/lib/api/admin"
import type { BookingStatus } from "@/lib/types"
import { cn, formatPrice, localDate, localTime } from "@/lib/utils"
import { ActButton } from "../../desk-shared"
import { Badge, Card, StatusBadge, inputClass } from "../../ui"

const KNOWN_STATUS = new Set(["pending", "confirmed", "in_progress", "completed", "declined", "cancelled", "expired", "no_show"])
const when = (at: string) => `${localTime(at)} ${localDate(at).split("-").reverse().join("/")}`

/** One booking for the staff: who, where, how much, what happened, and ending it when nobody else will. */
export function BookingDesk({ booking: b }: { booking: AdminBookingDetail }) {
  const router = useRouter()
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  // Fixed for this render pass, like the desk's other lists.
  const [now] = React.useState(() => Date.now())
  const canCancel = ["pending", "confirmed", "in_progress"].includes(b.status)
  const canComplete = ["confirmed", "in_progress"].includes(b.status) && Date.parse(b.startsAt) <= now

  const act = async (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string) => {
    const result = await fn()
    setError(result.ok ? null : result.error)
    setNotice(result.ok ? done : null)
    if (result.ok) setNote("")
    router.refresh()
  }

  return (
    <main className="mx-auto max-w-2xl space-y-3 p-4">
      <Link href="/admin?tab=bookings" className="text-meta text-muted hover:underline">
        ← Về danh sách lịch hẹn
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        {KNOWN_STATUS.has(b.status) ? <StatusBadge status={b.status as BookingStatus} /> : <Badge>{b.status}</Badge>}
        <h1 className="text-lead font-semibold">{b.serviceLabel}</h1>
        <span className="ml-auto text-label text-muted">#{b.id.slice(0, 8)}</span>
      </div>
      <p className="text-body font-medium">
        {when(b.startsAt)} → {localTime(b.endsAt)}
      </p>

      <Card className="grid gap-3 p-3.5 sm:grid-cols-2">
        <Person label="Khách" name={b.customer.name} phone={b.customer.phone} />
        <Person label="Đối tác" name={b.pro.name} phone={b.pro.phone} href={b.pro.slug ? `/pros/${b.pro.slug}` : undefined} locked={b.pro.suspended} />
      </Card>

      <Card className="space-y-1 p-3.5 text-meta">
        <p className="font-medium">{b.atHome ? "Tại nhà" : "Tại tiệm"}</p>
        {b.place && <p className="text-ink-soft">{b.place}</p>}
        {b.addressNote && <p className="text-muted">{b.addressNote}</p>}
        {b.note && <p className="mt-2 whitespace-pre-wrap text-ink-soft">Ghi chú: {b.note}</p>}
        <p className="text-label text-muted">{b.source === "job" ? "Đặt theo dịch vụ, Artist nhận đơn" : "Khách tự chọn Artist"}</p>
      </Card>

      <Card className="space-y-1 p-3.5 text-meta">
        <Money label="Dịch vụ" value={b.servicePrice} />
        {b.travelFee > 0 && <Money label="Phí di chuyển" value={b.travelFee} />}
        {b.urgentFee > 0 && <Money label="Phí gấp" value={b.urgentFee} />}
        {b.discount > 0 && <Money label="Voucher 360dep" value={-b.discount} />}
        <Money label="Tổng" value={b.total} strong />
        <Money label="Phí 360dep" value={b.commission} />
      </Card>

      <Card className="space-y-1 p-3.5 text-meta">
        <Step label="Tạo" at={b.createdAt} />
        <Step label="Xác nhận" at={b.confirmedAt} />
        <Step label="Đã nhận tiền" at={b.paidAt} />
        <Step label="Hoàn thành" at={b.completedAt} />
        <Step label={b.status === "no_show" ? "Báo vắng mặt" : "Huỷ"} at={b.cancelledAt} detail={b.cancelReason} />
      </Card>

      {(canCancel || canComplete) && (
        <Card className="space-y-2 p-3.5">
          <input
            className={cn(inputClass, "h-10 text-body")}
            value={note}
            maxLength={280}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Lý do. Hai bên đọc được khi huỷ"
            aria-label="Lý do"
          />
          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <ActButton size="sm" variant="danger" disabled={note.trim().length < 5} onClick={() => act(() => adminCancelBooking(b.id, note), "Đã huỷ lịch hẹn. Hai bên được báo, không tính phí.")}>
                Huỷ lịch hẹn
              </ActButton>
            )}
            {canComplete && (
              <ActButton size="sm" variant="ghost" onClick={() => act(() => adminCompleteBooking(b.id, note), "Đã đóng lịch là hoàn thành. Phí đã trừ vào ví đối tác.")}>
                Đóng là hoàn thành (tính phí {formatPrice(b.commission)})
              </ActButton>
            )}
          </div>
        </Card>
      )}
      {error && <p className="text-meta text-danger">{error}</p>}
      {notice && <p className="text-meta text-success">{notice}</p>}
    </main>
  )
}

function Person({ label, name, phone, href, locked }: { label: string; name: string; phone: string | null; href?: string; locked?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-label text-muted">{label}</p>
      {href ? (
        <Link href={href} target="_blank" className="block truncate text-body font-medium hover:underline">
          {name}
        </Link>
      ) : (
        <p className="truncate text-body font-medium">{name}</p>
      )}
      {locked && <Badge tone="danger">Đang khoá</Badge>}
      {phone ? (
        <a href={`tel:${phone}`} className="block text-meta underline underline-offset-2">
          {phone}
        </a>
      ) : (
        <p className="text-meta text-muted">Chưa có số</p>
      )}
    </div>
  )
}

function Money({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <p className={cn("flex justify-between gap-4 tabular-nums", strong && "font-semibold")}>
      <span>{label}</span>
      <span>{formatPrice(value)}</span>
    </p>
  )
}

function Step({ label, at, detail }: { label: string; at: string | null; detail?: string | null }) {
  if (!at) return null
  return (
    <p>
      <span className="text-muted">{label}:</span> {when(at)}
      {detail ? ` · ${detail}` : ""}
    </p>
  )
}
