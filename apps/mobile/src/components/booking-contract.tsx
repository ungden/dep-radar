import * as React from "react"
import { TextInput, View } from "react-native"
import { appointmentAt } from "@/shared"
import type { BookingItem } from "@/data/bookings"
import { rpc, supabase } from "@/data/supabase"
import { localDate, localTime } from "@/data/format"
import { useAsync } from "@/state/use-async"
import { useApp } from "@/state/app"
import { colors, radius } from "@/theme"
import { Card, ErrorNote } from "@/ui/bits"
import { Txt } from "@/ui/text"
import { Button } from "@/ui/button"

export function BookingContract({ booking: b }: { booking: BookingItem }) {
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
  const inputStyle = { minHeight: 46, borderWidth: 1, borderColor: colors.line, padding: 12, borderRadius: radius.md, color: colors.ink }
  return <Card style={{ gap: 10 }}>
    <Txt w={700}>Phạm vi dịch vụ đã chốt</Txt>
    <Txt>{c.variantLabel} · {c.tierLabel} · {c.durationMin} phút{c.sessions > 1 ? ` / buổi, ${c.sessions} buổi` : ""}</Txt>
    {c.includes.map((x) => <Txt key={x} v="meta" color={colors.inkSoft}>• {x}</Txt>)}
    {c.deliverable && <Txt>Sản phẩm: {c.deliverable}{c.deliveryDays ? ` · giao trong ${c.deliveryDays} ngày` : ""} · {c.revisions} lượt sửa.</Txt>}
    {c.followupDays && <Txt>Gồm buổi dặm trong {c.followupDays} ngày, không thu thêm tiền.</Txt>}
    {appointments.loading && <Txt>Đang tải các buổi…</Txt>}
    {appointments.error && <ErrorNote text={appointments.error} onRetry={() => void appointments.reload()} />}
    {appointments.value?.map((s) => <View key={s.id} style={{ gap: 8 }}><Txt>Buổi {s.sequence}: {localTime(s.starts_at)} {localDate(s.starts_at)} · {s.duration_min} phút · {s.confirmed ? "đã xác nhận" : "chờ xác nhận"}</Txt>{!s.confirmed && s.proposed_by !== app.uid && <Button label="Xác nhận buổi dặm" busy={busy} onPress={() => void run("confirm_followup", { p_session: s.id })} />}</View>)}
    {c.followupDays && b.status === "completed" && <View style={{ gap: 8 }}><TextInput accessibilityLabel="Ngày dặm YYYY-MM-DD" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} style={inputStyle} /><TextInput accessibilityLabel="Giờ dặm HH:mm" value={time} onChangeText={setTime} style={inputStyle} /><Button label="Đề xuất lịch dặm" disabled={!appointmentAt(date, time)} busy={busy} onPress={() => void run("propose_followup", { p_booking: b.id, p_starts_at: appointmentAt(date, time) })} /></View>}
    {error && <ErrorNote text={error} />}
  </Card>
}
