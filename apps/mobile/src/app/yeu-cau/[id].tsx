import { router, useLocalSearchParams } from "expo-router"
import { Alert, ScrollView, View } from "react-native"
import { getTemplate, getVariant } from "@/shared"
import { formatDateLong, formatDuration, formatPrice } from "@/data/format"
import { closeJob, getMyRequest, requestProgress } from "@/data/requests"
import { REQUEST_STATUS } from "@/components/request-status"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, EmptyState, ErrorNote, Line, Skeleton } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/**
 * One request: still looking for someone (and how many were told), or taken,
 * then its booking. The first freelancer to take it gets it; the customer
 * hears 'job_taken' and the chat opens in the booking.
 */
export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const uid = app.uid
  const request = useAsync(uid ? () => getMyRequest(uid, id) : null, [uid, id])
  const r = request.value

  if (!uid) return <EmptyState title="Cần đăng nhập" action="Đăng nhập" onAction={() => router.push("/login")} />
  if (request.loading && !r)
    return (
      <View style={{ padding: gutter, gap: 12 }}>
        <Skeleton style={{ height: 120, borderRadius: radius.md }} />
        <Skeleton style={{ height: 160, borderRadius: radius.md }} />
      </View>
    )
  if (request.error) return <View style={{ padding: gutter }}><ErrorNote text={request.error} onRetry={() => void request.reload()} /></View>
  if (!r) return <EmptyState title="Không tìm thấy yêu cầu" action="Về danh sách" onAction={() => router.replace("/yeu-cau")} />

  const t = getTemplate(r.templateId)
  const v = getVariant(r.templateId, r.variantId)
  const status = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.closed

  const remove = () =>
    Alert.alert("Xoá yêu cầu này?", "Người làm sẽ không thấy và không nhận được yêu cầu này nữa.", [
      { text: "Thôi", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          const res = await closeJob(r.id)
          if (!res.ok) return Alert.alert("Chưa xoá được", res.error)
          router.back()
        },
      },
    ])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 48 }}
      refreshControl={refreshControl(request.refreshing, () => void request.refresh())}
    >
      <Card>
        <View style={{ alignSelf: "flex-start", backgroundColor: status.bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Txt v="meta" w={700} color={status.fg}>
            {status.label}
          </Txt>
        </View>
        <Txt v="title" w={700}>
          {t?.name ?? r.templateId}
        </Txt>
        <Txt color={colors.inkSoft}>
          {v ? `${v.label} · ${formatDuration(v.durationMin)}` : ""}
          {r.quantity > 1 ? ` × ${r.quantity} người` : ""}
        </Txt>
        <Txt w={600}>
          {r.time}, {formatDateLong(r.date)}
        </Txt>
        <Txt v="meta" color={colors.inkSoft}>
          {r.district}, {r.city}
        </Txt>
        {r.description ? <Txt color={colors.inkSoft}>{r.description}</Txt> : null}
      </Card>

      <Card>
        {r.quantity > 1 ? <Line label={`${formatPrice(r.price)} × ${r.quantity} người`} value={formatPrice(r.price * r.quantity)} /> : null}
        <Line label="Giá dịch vụ" value={formatPrice(r.price * r.quantity)} strong />
        <Txt v="meta" color={colors.muted}>
          Trả người làm sau khi xong. Phí di chuyển, phí gấp (nếu có) tính theo bảng giá 360dep và hiện trong lịch hẹn.
        </Txt>
      </Card>

      {r.status === "booked" && r.bookingId ? (
        <Press
          onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: r.bookingId! } })}
          accessibilityRole="button"
          style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.successSoft, borderRadius: radius.md, padding: 14 }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Txt w={700} color={colors.success}>
              Đã có người nhận việc. Xem lịch hẹn
            </Txt>
            <Txt v="meta" color={colors.success}>
              Lịch đã xác nhận: nhắn tin, gọi cho người làm ngay trong lịch hẹn.
            </Txt>
          </View>
          <Icon name="right" size={14} color={colors.success} />
        </Press>
      ) : r.status === "open" ? (
        <Card style={{ backgroundColor: colors.accentSoft }}>
          <Txt w={700} color={colors.accentDark}>
            {requestProgress(r)}
          </Txt>
          <Txt v="meta" color={colors.accentDark}>
            Người làm đầu tiên bấm nhận việc sẽ làm cho bạn: lịch hẹn xác nhận ngay, bạn nhận thông báo và nhắn tin được với họ.
          </Txt>
        </Card>
      ) : (
        <Txt v="meta" color={colors.muted} center>
          {requestProgress(r)}. Bạn có thể đăng yêu cầu mới, hoặc đặt lịch trực tiếp với người làm.
        </Txt>
      )}

      {r.status === "open" ? <Button label="Xoá yêu cầu" variant="ghost" full onPress={remove} /> : null}
      {r.status !== "open" && r.status !== "booked" ? <Button label="Đăng yêu cầu mới" full onPress={() => router.push("/yeu-cau/moi")} /> : null}
    </ScrollView>
  )
}
