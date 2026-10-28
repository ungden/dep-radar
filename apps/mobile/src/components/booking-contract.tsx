import { ScopeWorkspace,DeliveryWorkspace } from "./commerce-workspace"
import * as React from "react"
import { View } from "react-native"
import { DateField } from "./date-field"
import { TimeField } from "./time-field"
import { appointmentAt } from "@/shared"
import type { BookingItem } from "@/data/bookings"
import { rpc, supabase } from "@/data/supabase"
import { localDate, localTime } from "@/data/format"
import { useAsync } from "@/state/use-async"
import { useApp } from "@/state/app"
import { colors } from "@/theme"
import { Card, ErrorNote } from "@/ui/bits"
import { Txt } from "@/ui/text"
import { Button } from "@/ui/button"

export function BookingContract({ booking: b,onChanged }: { booking: BookingItem;onChanged?:()=>void|Promise<void> }) {
  const app = useApp()
  const c = b.contract
  const appointments = useAsync(c && (c.sessions > 1 || c.followupDays) ? async () => {
    const { data, error } = await supabase.from("booking_sessions").select("id,sequence,starts_at,duration_min,confirmed,proposed_by").eq("booking_id", b.id).order("sequence")
    if (error) throw new Error("Không tải được các buổi. Thử lại khi có mạng.")
    return data as { id: string; sequence: number; starts_at: string; duration_min: number; confirmed: boolean; proposed_by: string }[]
  } : null, [b.id, c?.sessions, c?.followupDays])
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("09:00")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const run = async (fn: string, args: Record<string, unknown>) => { setBusy(true); setError(null); try { const r = await rpc(fn, args); if (!r.ok) setError(r.error); else await appointments.reload() } catch { setError("Không lưu được lịch. Kiểm tra kết nối và thử lại.") } finally { setBusy(false) } }
  if (!c) return null
  return <Card style={{ gap: 10 }}>
    <Txt w={700}>Phạm vi dịch vụ đã chốt</Txt>
    <Txt>{c.variantLabel} · {c.tierLabel} · {c.durationMin} phút{c.sessions > 1 ? ` buổi đầu · ${c.sessions} buổi` : ""}</Txt>
    {c.lines?.map((line, i) => <View key={i} style={{ gap: 4 }}><Txt w={600}>{line.recipient} · {line.name} · {line.region === 'both' ? 'Tay + chân' : line.region === 'foot' ? 'Chân' : line.region === 'hand' ? 'Tay' : ''}</Txt><Txt>{line.label} · {line.quantity} {line.unit} · {line.total.toLocaleString('vi-VN')}đ · {line.durationMin} phút</Txt>{line.scope&&<Txt>Phạm vi báo riêng: {line.scope}</Txt>}{line.includes.map(x => <Txt key={x}>• {x}</Txt>)}{line.deliverable && <Txt>{line.deliverable}</Txt>}{line.serviceSetup&&<Txt>Chuẩn bị: {line.serviceSetup.note||"Theo điều kiện nơi làm đã xác nhận"}</Txt>}</View>)}
    {c.includes.map((x) => <Txt key={x} v="meta" color={colors.inkSoft}>• {x}</Txt>)}
    {c.readyBy&&<Txt>Cần hoàn thiện trước: {new Date(c.readyBy).toLocaleString('vi-VN')}</Txt>}
    {c.visits?.map(v=><Txt key={v.sequence}>Buổi {v.sequence} · {new Date(v.startsAt).toLocaleString('vi-VN')} · {v.durationMin} phút · {v.addressSnapshot?.detail}, {v.addressSnapshot?.district}, {v.addressSnapshot?.city} · di chuyển {v.travelFee.toLocaleString('vi-VN')}đ · phần dịch vụ {v.serviceShare.toLocaleString('vi-VN')}đ</Txt>)}
    {c.rights&&<Txt>Quyền sử dụng: {String(c.rights.channels??'')} · {String(c.rights.term??'')} · {String(c.rights.territory??'')} · {c.rights.paidAds?'Có quảng cáo trả phí':'Không quảng cáo trả phí'} · {c.rights.exclusive?'Có yêu cầu độc quyền':'Không độc quyền'}</Txt>}
    {c.deliverable && <Txt>Sản phẩm: {c.deliverable}{c.deliveryDays ? ` · giao trong ${c.deliveryDays} ngày` : ""} · lượt sửa theo từng đầu ra.</Txt>}
    {c.followupDays && <Txt>Gồm buổi dặm trong {c.followupDays} ngày, không thu thêm tiền.</Txt>}
    {appointments.loading && <Txt>Đang tải các buổi…</Txt>}
    {appointments.error && <ErrorNote text={appointments.error} onRetry={() => void appointments.reload()} />}
    {appointments.value?.map((s) => <View key={s.id} style={{ gap: 8 }}><Txt>Buổi {s.sequence}: {localTime(s.starts_at)} {localDate(s.starts_at)} · {s.duration_min} phút · {s.confirmed ? "đã xác nhận" : "chờ xác nhận"}</Txt>{!s.confirmed && s.proposed_by !== app.uid && <Button label="Xác nhận buổi hẹn" busy={busy} onPress={() => void run("confirm_followup", { p_session: s.id })} />}</View>)}
    {c.followupDays && b.status === "completed" && <View style={{ gap: 8 }}><DateField label="Ngày dặm" value={date} onChange={setDate} /><TimeField label="Giờ dặm" value={time} onChange={setTime} /><Button label="Đề xuất lịch dặm" disabled={!appointmentAt(date, time)} busy={busy} onPress={() => void run("propose_followup", { p_booking: b.id, p_starts_at: appointmentAt(date, time) })} /></View>}
    <ScopeWorkspace bookingId={b.id} onChanged={onChanged}/>{c.deliverable&&b.status==='completed'&&<DeliveryWorkspace bookingId={b.id} onChanged={onChanged}/>}
    {error && <ErrorNote text={error} />}
  </Card>
}
