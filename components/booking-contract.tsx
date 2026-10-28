"use client"
import { ScopeWorkspace } from "./scope-workspace"
import * as React from "react"
import { bookingSessions, confirmFollowup, proposeFollowup } from "@/lib/api/actions"
import type { Booking } from "@/lib/types"
import { Button, Card, inputClass } from "./ui"
import { formatDateLong, localDate, localTime, toTimestamptz } from "@/lib/utils"

export function BookingContract({ booking }: { booking: Booking }) {
  const [sessions, setSessions] = React.useState<Awaited<ReturnType<typeof bookingSessions>>>([])
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("09:00")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const c = booking.contract
  const load = React.useCallback(async () => { try { setSessions(await bookingSessions(booking.id)) } catch (e) { setError(e instanceof Error ? e.message : "Không tải được các buổi.") } }, [booking.id])
  React.useEffect(() => { if (!c || (c.sessions <= 1 && !c.followupDays)) return; let live = true; void bookingSessions(booking.id).then((r) => { if (live) setSessions(r) }).catch((e: Error) => { if (live) setError(e.message) }); return () => { live = false } }, [c, booking.id])
  if (!c) return null
  return <Card className="space-y-3 p-4">
    <p className="font-semibold">Phạm vi dịch vụ đã chốt</p>
    <p className="text-body">{c.variantLabel} · {c.tierLabel} · {c.quantity > 1 ? `× ${c.quantity} · ` : ""}{c.durationMin} phút{c.sessions > 1 ? ` buổi đầu · ${c.sessions} buổi` : ""}</p>
    {c.lines?.map((line, i) => <div key={i} className="rounded-xl bg-subtle p-3 text-body"><p className="font-semibold">{line.recipient} · {line.region === 'both' ? 'Tay + chân' : line.region === 'foot' ? 'Chân' : line.region === 'hand' ? 'Tay' : ''} · {line.name}</p><p>{line.label} · {line.quantity} {line.unit} · {line.total.toLocaleString('vi-VN')}đ · {line.durationMin} phút</p>{line.includes.map(x => <p key={x}>• {x}</p>)}{line.deliverable && <p>{line.deliverable}</p>}{line.serviceSetup&&<p>Chuẩn bị: {line.serviceSetup.note||"Theo điều kiện nơi làm đã xác nhận"}</p>}</div>)}
    <ul className="list-disc pl-5 text-body text-ink-soft">{c.includes.map((x) => <li key={x}>{x}</li>)}</ul>
    {c.readyBy&&<p className="text-body">Cần hoàn thiện trước: {new Date(c.readyBy).toLocaleString('vi-VN')}</p>}
    {c.visits?.map(v=><p key={v.sequence} className="text-body">Buổi {v.sequence} · {new Date(v.startsAt).toLocaleString('vi-VN')} · {v.durationMin} phút · {v.addressSnapshot?.detail}, {v.addressSnapshot?.district}, {v.addressSnapshot?.city} · di chuyển {v.travelFee.toLocaleString('vi-VN')}đ · phần dịch vụ {v.serviceShare.toLocaleString('vi-VN')}đ</p>)}
    {c.rights&&<p className="text-body">Quyền sử dụng: {String(c.rights.channels??'')} · {String(c.rights.term??'')} · {String(c.rights.territory??'')} · {c.rights.paidAds?'Có quảng cáo trả phí':'Không quảng cáo trả phí'} · {c.rights.exclusive?'Có yêu cầu độc quyền':'Không độc quyền'}</p>}
    {c.deliverable && <p className="text-body">Sản phẩm bàn giao: {c.deliverable}{c.deliveryDays ? ` · trong ${c.deliveryDays} ngày sau buổi làm` : ""} · lượt sửa theo từng đầu ra.</p>}
    {c.followupDays && <p className="text-body">Gồm một buổi dặm trong {c.followupDays} ngày, không thu thêm tiền.</p>}
    {sessions.map((s) => <div key={s.id} className="rounded-xl bg-subtle p-3 text-body"><p>Buổi {s.sequence} · {localTime(s.starts_at)}, {formatDateLong(localDate(s.starts_at))} · {s.duration_min} phút · {s.confirmed ? "đã xác nhận" : "chờ phía còn lại xác nhận"}</p>{!s.confirmed && !s.mine && <Button size="sm" className="mt-2" disabled={busy} onClick={async () => { setBusy(true); const r = await confirmFollowup(s.id); if (!r.ok) setError(r.error); else await load(); setBusy(false) }}>Xác nhận buổi hẹn</Button>}</div>)}
    {c.followupDays && booking.status === "completed" && <div className="space-y-2"><input className={inputClass} aria-label="Ngày dặm" type="date" value={date} onChange={(e) => setDate(e.target.value)} /><input className={inputClass} aria-label="Giờ dặm" type="time" step={1800} value={time} onChange={(e) => setTime(e.target.value)} /><Button size="sm" disabled={busy || !date} onClick={async () => { setBusy(true); setError(null); const r = await proposeFollowup(booking.id, toTimestamptz(date, time)); if (!r.ok) setError(r.error); else await load(); setBusy(false) }}>Đề xuất lịch dặm</Button></div>}
    <ScopeWorkspace bookingId={booking.id}/>
    {error && <p role="alert" className="text-body text-danger">{error}</p>}
  </Card>
}
