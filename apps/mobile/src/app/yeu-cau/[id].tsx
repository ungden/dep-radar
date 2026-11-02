import * as React from "react"
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { Alert, ScrollView, View } from "react-native"
import { CATALOG_VERSION, serviceDuration, getTemplate, getVariant } from "@/shared"
import { getBooking } from "@/data/bookings"
import { openThread } from "@/data/chat"
import { formatDateLong, formatDuration, formatPrice } from "@/data/format"
import { closeJob, getMyRequest, requestProgress } from "@/data/requests"
import { ReferencePhotos } from "@/components/reference-photos"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Avatar, Card, EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { Icon, type IconName } from "@/ui/icon"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/** While it is still open, look again this often: the screen turns by itself when someone takes it. */
const CHECK_EVERY_MS = 10_000

/**
 * One order placed by service: waiting for an Artist, or taken. The first
 * Artist to take it gets it; the customer hears 'job_taken' and the chat opens
 * in the booking.
 */
export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const uid = app.uid
  const request = useAsync(uid ? () => getMyRequest(uid, id) : null, [uid, id])
  const r = request.value
  const bookingId = r?.status === "booked" ? r.bookingId : null
  const booking = useAsync(uid && bookingId ? () => getBooking(bookingId, uid) : null, [uid, bookingId])
  const b = booking.value
  const [opening, setOpening] = React.useState(false)

  const reload = request.reload
  const open = r?.status === "open"
  useFocusEffect(
    React.useCallback(() => {
      if (!open) return
      const timer = setInterval(() => void reload(), CHECK_EVERY_MS)
      return () => clearInterval(timer)
    }, [open, reload]),
  )

  if (!uid) return <EmptyState title="Cần đăng nhập" action="Đăng nhập" onAction={() => router.push("/login")} />
  if (request.loading && !r)
    return (
      <View style={{ padding: gutter, gap: 12 }}>
        <Skeleton style={{ height: 200, borderRadius: radius.lg }} />
        <Skeleton style={{ height: 160, borderRadius: radius.lg }} />
      </View>
    )
  if (request.error) return <View style={{ padding: gutter }}><ErrorNote text={request.error} onRetry={() => void request.reload()} /></View>
  if (!r) return <EmptyState title="Không tìm thấy đơn" action="Về danh sách" onAction={() => router.replace("/yeu-cau")} />

  const t = getTemplate(r.templateId)
  const v = getVariant(r.templateId, r.variantId)
  const name = r.contract?.serviceName ?? t?.name ?? r.templateId
  const artist = b?.pro

  const cancel = () =>
    Alert.alert("Huỷ đơn này?", "Artist sẽ không thấy và không nhận được đơn này nữa.", [
      { text: "Thôi", style: "cancel" },
      {
        text: "Huỷ đơn",
        style: "destructive",
        onPress: async () => {
          const res = await closeJob(r.id)
          if (!res.ok) return Alert.alert("Chưa huỷ được", res.error)
          router.back()
        },
      },
    ])

  const message = async () => {
    if (!b) return
    setOpening(true)
    const res = await openThread(b.pro.id, b.id)
    setOpening(false)
    if (res.ok) router.push({ pathname: "/tin-nhan/[id]", params: { id: res.data } })
    else Alert.alert("Chưa mở được hội thoại", res.error)
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ paddingBottom: 48, gap: 16 }}
      refreshControl={refreshControl(request.refreshing, () => void request.refresh())}
    >
      {/* The header takes the banner's colour, so the two read as one block. */}
      <Stack.Screen options={{ headerStyle: { backgroundColor: TONES[r.status === "open" ? "waiting" : r.status === "booked" ? "done" : "over"].bg }, headerShadowVisible: false }} />
      {r.status === "open" ? (
        <Banner icon="person" tone="waiting" title="Đang chờ Artist nhận đơn" text="Artist quanh bạn đã được báo. Ai nhận trước sẽ đến làm cho bạn." />
      ) : r.status === "booked" ? (
        <Banner icon="check" tone="done" title="Đã có Artist nhận đơn" text={`${r.time}, ${formatDateLong(r.date)}`} />
      ) : (
        <Banner icon="calendar" tone="over" title={r.status === "expired" ? "Đơn đã hết hạn, chưa có ai nhận" : "Đơn đã đóng"} text="Bạn có thể đặt lại, hoặc tự chọn Artist." />
      )}

      <View style={{ paddingHorizontal: gutter, gap: 12 }}>
        {/* Who took it */}
        {artist ? (
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={artist.name} uri={artist.avatar} size={56} />
              <Txt v="title" style={{ flex: 1 }} numberOfLines={2}>
                {artist.name}
              </Txt>
              <Button label="Hồ sơ" variant="ghost" size="sm" onPress={() => router.push({ pathname: "/pros/[id]", params: { id: artist.slug } })} />
            </View>
          </Card>
        ) : null}

        {/* What was ordered */}
        <Card>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <View style={{ flex: 1, gap: 1 }}>
              <Txt w={600}>{name}</Txt>
              <Txt v="meta" color={colors.muted}>
                {v ? `${r.contract?.variantLabel ?? v.label} · ${formatDuration(r.contract?.durationMin ?? serviceDuration(v, r.quantity))}` : ""}
                {r.quantity > 1 ? ` × ${r.quantity} người` : ""}
              </Txt>
            </View>
            <Txt w={700} tabular color={colors.accentDark}>
              {formatPrice(r.price * r.quantity)}
            </Txt>
          </View>
          <Txt v="meta" color={colors.inkSoft}>
            {r.time}, {formatDateLong(r.date)}
          </Txt>
          <Txt v="meta" color={colors.inkSoft}>
            {r.district}, {r.city}
          </Txt>
          {r.description ? <Txt v="meta" color={colors.inkSoft}>{r.description}</Txt> : null}
          <ReferencePhotos paths={r.referencePhotos} title="Ảnh mẫu bạn gửi" />
          {r.maxTotal != null ? (
            <Txt v="meta" color={colors.muted}>
              Tổng tối đa đã đồng ý, gồm phụ phí: {formatPrice(r.maxTotal)}. Trả Artist sau khi xong.
            </Txt>
          ) : null}
          {r.status === "open" && r.contract && r.contract.version < CATALOG_VERSION ? <Txt color={colors.warning}>Gói đã cập nhật. Huỷ đơn và đặt lại để xác nhận phạm vi mới.</Txt> : null}
        </Card>

        {r.status === "open" ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.highlightSoft }}>
              <Icon name="bell" size={20} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="meta">Bạn có thể thoát app. Có người nhận, chúng tôi sẽ báo ngay.</Txt>
                <Txt v="meta" color={colors.inkSoft}>
                  {requestProgress(r)}
                </Txt>
              </View>
            </View>
            <Button label="Tự chọn Artist thay vì chờ" variant="secondary" full onPress={() => router.navigate({ pathname: "/artist", params: { service: r.templateId } })} />
            <Button label="Huỷ đơn" variant="ghost" full onPress={cancel} />
          </>
        ) : r.status === "booked" && r.bookingId ? (
          <>
            {booking.error ? <ErrorNote text={booking.error} onRetry={() => void booking.reload()} /> : null}
            <Button label={artist ? `Nhắn tin với ${artist.name}` : "Nhắn tin"} full size="lg" disabled={!artist} busy={opening} onPress={() => void message()} />
            <Button label="Xem lịch hẹn" variant="secondary" full onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: r.bookingId! } })} />
          </>
        ) : (
          <>
            <Button label="Đặt lại" full onPress={() => router.push({ pathname: "/yeu-cau/moi", params: { template: r.templateId } })} />
            <Button label="Tự chọn Artist" variant="secondary" full onPress={() => router.navigate({ pathname: "/artist", params: { service: r.templateId } })} />
          </>
        )}
      </View>
    </ScrollView>
  )
}

const TONES = {
  waiting: { bg: colors.accentSoft, disc: colors.accent, size: 104, icon: 44 },
  done: { bg: colors.successSoft, disc: colors.success, size: 56, icon: 26 },
  over: { bg: colors.subtle, disc: colors.inkSoft, size: 56, icon: 26 },
} as const

/** The state of the order, in colour, at the top of the page. */
function Banner({ icon, tone, title, text }: { icon: IconName; tone: keyof typeof TONES; title: string; text: string }) {
  const s = TONES[tone]
  return (
    <View style={{ alignItems: "center", gap: 10, paddingHorizontal: gutter, paddingTop: 12, paddingBottom: 24, backgroundColor: s.bg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl }}>
      <View style={{ width: s.size, height: s.size, borderRadius: s.size / 2, backgroundColor: s.disc, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={s.icon} color={colors.surface} />
      </View>
      <Txt v="h1" center>
        {title}
      </Txt>
      <Txt color={colors.inkSoft} center>
        {text}
      </Txt>
    </View>
  )
}
