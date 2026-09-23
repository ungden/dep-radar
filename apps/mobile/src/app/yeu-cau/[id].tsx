import * as React from "react"
import { router, useLocalSearchParams } from "expo-router"
import { Alert, ScrollView, View } from "react-native"
import { buildQuote, getTemplate, getVariant, isUrgent, travelDistanceKm } from "@/shared"
import { formatDateLong, formatDuration, formatKm, formatPrice, formatRating, timeAgo } from "@/data/format"
import { acceptOffer, bookingForRequest, closeJob, getMyRequest, type RequestOffer } from "@/data/requests"
import { REQUEST_STATUS } from "@/components/request-status"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Avatar, Card, EmptyState, ErrorNote, Skeleton, VerifiedMark } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/** One request and the quotes it got. Picking one books it (accept_offer), exactly as on the web. */
export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const uid = app.uid
  const request = useAsync(uid ? () => getMyRequest(uid, id) : null, [uid, id])
  const [busy, setBusy] = React.useState<string | null>(null)
  const [bookingId, setBookingId] = React.useState<string | null>(null)
  const r = request.value

  React.useEffect(() => {
    if (uid && r?.status === "booked") void bookingForRequest(uid, r).then(setBookingId)
  }, [uid, r])

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
  const home = app.me.addresses.find((a) => a.city === r.city && a.district === r.district)

  const choose = (o: RequestOffer) =>
    Alert.alert(`Chọn ${o.pro.name}?`, `${formatPrice(o.price)} cho ${t?.name ?? "dịch vụ"}. Những báo giá khác sẽ đóng lại.`, [
      { text: "Thôi", style: "cancel" },
      {
        text: "Chọn",
        onPress: async () => {
          setBusy(o.id)
          const res = await acceptOffer(o.id)
          setBusy(null)
          if (!res.ok) {
            haptic.error()
            return Alert.alert("Chưa chọn được", res.error)
          }
          haptic.success()
          router.replace({ pathname: "/bookings/[id]", params: { id: res.data } })
        },
      },
    ])

  const remove = () =>
    Alert.alert("Xoá yêu cầu này?", "Người làm sẽ không gửi báo giá nữa.", [
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
          {r.quantity > 1 ? ` × ${r.quantity}` : ""}
        </Txt>
        <Txt w={600}>
          {r.time}, {formatDateLong(r.date)}
        </Txt>
        <Txt v="meta" color={colors.inkSoft}>
          {r.district}, {r.city}
        </Txt>
        {r.description ? <Txt color={colors.inkSoft}>{r.description}</Txt> : null}
      </Card>

      {r.status === "booked" && bookingId ? (
        <Press
          onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: bookingId } })}
          style={{ backgroundColor: colors.successSoft, borderRadius: radius.md, padding: 14 }}
        >
          <Txt w={700} color={colors.success}>
            Đã chốt lịch. Xem lịch hẹn
          </Txt>
        </Press>
      ) : null}

      <Txt v="title" w={700}>
        Báo giá nhận được ({r.offers.length})
      </Txt>
      {r.offers.length === 0 ? (
        <EmptyState title="Đang chờ báo giá" text="Yêu cầu đã gửi tới người làm phù hợp quanh bạn. Thường có báo giá đầu tiên sau 15–30 phút." />
      ) : (
        r.offers.map((o) => {
          const pro = app.data?.pros.find((p) => p.uuid === o.pro.uuid)
          const km = pro ? travelDistanceKm(pro.city, pro.district, home?.city ?? r.city, home?.district ?? r.district) : null
          const quote = buildQuote({ servicePrice: o.price, atHome: r.atHome, distanceKm: km, urgent: isUrgent(r.date, r.time) })
          const blocked = app.blocked.has(o.pro.uuid)
          if (blocked) return null
          return (
            <Card key={o.id} style={{ opacity: o.status === "rejected" || o.status === "expired" ? 0.55 : 1 }}>
              <Press
                onPress={() => router.push({ pathname: "/pros/[id]", params: { id: o.pro.slug || o.pro.uuid } })}
                accessibilityLabel={`Xem hồ sơ ${o.pro.name}`}
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Avatar name={o.pro.name} uri={o.pro.avatar} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Txt w={700} numberOfLines={1} style={{ flexShrink: 1 }}>
                      {o.pro.name}
                    </Txt>
                    {o.pro.verified ? <VerifiedMark /> : null}
                  </View>
                  <Txt v="meta" color={colors.muted}>
                    {o.pro.rating.count ? `★ ${formatRating(o.pro.rating.average)} (${o.pro.rating.count})` : "Chưa có đánh giá"} · {o.pro.completedJobs} lịch đã xong
                  </Txt>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Txt v="lead" w={700} tabular>
                    {formatPrice(quote.total)}
                  </Txt>
                  <Txt v="meta" color={colors.muted}>
                    {timeAgo(o.createdAt)}
                  </Txt>
                </View>
              </Press>
              <Txt v="meta" color={colors.inkSoft}>
                Dịch vụ {formatPrice(quote.servicePrice)} · {quote.travelFee ? `di chuyển +${formatPrice(quote.travelFee)}${km !== null ? ` (~${formatKm(km)})` : ""}` : "miễn phí di chuyển"}
                {quote.urgentFee ? ` · phí gấp +${formatPrice(quote.urgentFee)}` : ""}
              </Txt>
              {o.message ? (
                <View style={{ backgroundColor: colors.canvas, borderRadius: radius.sm, padding: 10 }}>
                  <Txt v="meta" color={colors.inkSoft}>
                    {o.message}
                  </Txt>
                </View>
              ) : null}
              {r.status === "open" && o.status === "pending" ? (
                <Button label="Chọn báo giá này" full busy={busy === o.id} disabled={Boolean(busy)} onPress={() => choose(o)} />
              ) : o.status === "accepted" ? (
                <Txt w={700} color={colors.success}>
                  Bạn đã chọn báo giá này
                </Txt>
              ) : null}
            </Card>
          )
        })
      )}

      {r.status === "open" ? <Button label="Xoá yêu cầu" variant="ghost" full onPress={remove} /> : null}
    </ScrollView>
  )
}
