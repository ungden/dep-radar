import { router } from "expo-router"
import { View } from "react-native"
import { listPartnerAppointments } from "@/data/bookings"
import { localDate, localTime, todayISO } from "@/data/format"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, radius } from "@/theme"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"
import { ErrorNote } from "@/ui/bits"

export function PartnerAppointments({ date, reloadKey }: { date?: string; reloadKey?: unknown }) {
  const { uid } = useApp()
  const result = useAsync(uid ? () => listPartnerAppointments(uid) : null, [uid, reloadKey])
  const rows = (result.value ?? []).filter((s) => date ? localDate(s.starts_at) === date : localDate(s.starts_at) >= todayISO())
  if (!rows.length && !result.error) return null
  return <View style={{ gap: 10, marginVertical: 12 }}><Txt w={700}>Các buổi tiếp theo trong gói</Txt>{result.error && <ErrorNote text={result.error} onRetry={() => void result.reload()} />}{rows.map((s) => <Press key={s.id} onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: s.booking_id } })} style={{ padding: 14, gap: 4, backgroundColor: colors.surface, borderRadius: radius.md }}><Txt w={700}>{localTime(s.starts_at)}, {localDate(s.starts_at)} · Buổi {s.sequence}</Txt><Txt>{s.serviceName} · {s.duration_min} phút · {s.confirmed ? "đã xác nhận" : "chờ xác nhận"}</Txt><Txt v="meta" color={colors.muted}>Đã gồm trong giá gói. Xem đơn gốc để xử lý lịch.</Txt></Press>)}</View>
}
