"use client"
import * as React from "react"
import Link from "next/link"
import { partnerAppointments } from "@/lib/api/actions"
import { formatDateLong, localDate, localTime, todayISO } from "@/lib/utils"
import { useApp } from "@/lib/store"

/** Included sessions have the original booking's actions and no second payment. */
export function PartnerAppointments({ date }: { date?: string }) {
  const state = useApp()
  const [items, setItems] = React.useState<Awaited<ReturnType<typeof partnerAppointments>>>([])
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => { let live = true; void partnerAppointments().then((xs) => { if (live) { setItems(xs); setError(null) } }).catch(() => { if (live) setError("Không tải được các buổi tiếp theo. Tải lại trang để thử lại.") }); return () => { live = false } }, [state.bookings])
  const visible = items.filter((s) => date ? localDate(s.starts_at) === date : localDate(s.starts_at) >= todayISO())
  if (!visible.length && !error) return null
  return <section className="my-4 space-y-2"><h3 className="text-sm font-semibold">Các buổi tiếp theo trong gói</h3>{error && <p role="alert" className="text-sm text-danger">{error}</p>}{visible.map((s) => <Link key={s.id} href={`/bookings/${s.booking_id}`} className="block rounded-xl border border-line bg-surface p-3 text-sm"><p className="font-semibold">{localTime(s.starts_at)}, {formatDateLong(localDate(s.starts_at))} · Buổi {s.sequence}</p><p>{s.serviceName} · {s.duration_min} phút · {s.confirmed ? "đã xác nhận" : "chờ xác nhận"}</p><p className="text-xs text-muted">Đã gồm trong giá gói. Xem đơn gốc để xử lý lịch.</p></Link>)}</section>
}
