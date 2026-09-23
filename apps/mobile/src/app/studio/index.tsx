import * as React from "react"
import { router } from "expo-router"
import { Alert, Linking, Platform, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { confirmBooking, listBookings, type BookingItem } from "@/data/bookings"
import { addDays, formatCountdown, formatPrice, localDate, todayISO } from "@/data/format"
import { askForPushPermission } from "@/data/push"
import { FeeCard, OWING_NOTE, useFee } from "@/components/fee-card"
import { StudioHeader } from "@/components/studio-header"
import { useApp } from "@/state/app"
import { useNow } from "@/state/keyboard"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, ErrorNote, SectionHeader, Skeleton } from "@/ui/bits"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

function mapsUrl(b: BookingItem) {
  const q = encodeURIComponent([b.address, b.district, b.city].filter(Boolean).join(", "))
  return Platform.OS === "ios" ? `http://maps.apple.com/?daddr=${q}` : `https://www.google.com/maps/dir/?api=1&destination=${q}`
}

/** The freelancer's home: a fee to pay first, bookings to accept, where to be today, what this week earned. */
export default function Today() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  const uid = app.uid
  const bookings = useAsync(uid ? () => listBookings(uid, "pro") : null, [uid])
  const fee = useFee(uid)
  const [busy, setBusy] = React.useState<string | null>(null)
  const all = bookings.value ?? []
  const hasPending = all.some((b) => b.status === "pending")
  // Ticks only while a confirmation countdown is on screen.
  const now = useNow(hasPending)

  // A booking waiting to be accepted is the moment push notifications make sense.
  React.useEffect(() => {
    if (hasPending && uid) void askForPushPermission(uid)
  }, [hasPending, uid])

  const today = todayISO()
  const monday = addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7))
  const toAccept = all.filter((b) => b.status === "pending").sort((a, b) => a.confirmBy.localeCompare(b.confirmBy))
  const todays = all.filter((b) => b.date === today && ["confirmed", "in_progress"].includes(b.status)).sort((a, b) => a.time.localeCompare(b.time))
  const week = all.filter((b) => b.status === "completed" && b.completedAt && localDate(b.completedAt) >= monday)
  const earned = week.reduce((sum, b) => sum + b.quote.payout, 0)
  const next = all
    .filter((b) => b.status === "confirmed" && b.date > today)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]

  const accept = async (b: BookingItem) => {
    setBusy(b.id)
    const res = await confirmBooking(b.id)
    setBusy(null)
    if (!res.ok) {
      void fee.reload()
      return Alert.alert("Chưa nhận được lịch", res.error)
    }
    void bookings.reload()
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40, gap: 24 }}
      refreshControl={refreshControl(bookings.refreshing || fee.refreshing, () => {
        void bookings.refresh()
        void fee.refresh()
      })}
    >
      <StudioHeader title="Hôm nay" subtitle={app.myPro && !app.myPro.acceptingJobs ? "Bạn đang tạm nghỉ nhận lịch mới." : undefined} />
      {bookings.error ? (
        <View style={{ paddingHorizontal: gutter }}>
          <ErrorNote text={bookings.error} onRetry={() => void bookings.reload()} />
        </View>
      ) : null}
      {fee.owing ? (
        <View style={{ paddingHorizontal: gutter }}>
          <FeeCard fee={fee.value} />
        </View>
      ) : null}

      <View style={{ paddingHorizontal: gutter, gap: 12 }}>
        <SectionHeader title="Chờ bạn nhận lịch" />
        {bookings.loading ? <Skeleton style={{ height: 120, borderRadius: radius.md }} /> : null}
        {!bookings.loading && !toAccept.length ? <Txt color={colors.inkSoft}>Không có lịch nào đang chờ bạn nhận.</Txt> : null}
        {toAccept.length && fee.owing ? (
          <Txt v="meta" color={colors.warning}>
            {OWING_NOTE}
          </Txt>
        ) : null}
        {toAccept.map((b) => {
          const left = Date.parse(b.confirmBy) - now
          return (
            <Card key={b.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Txt w={700} style={{ flex: 1 }} numberOfLines={1}>
                  {b.customer.name}
                </Txt>
                <Txt w={700} tabular color={left > 0 && left < 30 * 60_000 ? colors.danger : colors.warning}>
                  {left > 0 ? formatCountdown(left) : "Quá hạn"}
                </Txt>
              </View>
              <Txt color={colors.inkSoft}>
                {b.serviceName} · {b.variantLabel}
              </Txt>
              <Txt v="meta" color={colors.muted}>
                {b.time}, {b.date.split("-").reverse().join("/")} · {b.atHome ? `${b.district}` : "Tại studio"} · bạn nhận {formatPrice(b.quote.payout)}
              </Txt>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <Button label="Nhận lịch" size="sm" busy={busy === b.id} disabled={fee.owing} onPress={() => void accept(b)} />
                <Button label="Chi tiết" size="sm" variant="ghost" onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: b.id } })} />
              </View>
            </Card>
          )
        })}
      </View>

      <View style={{ paddingHorizontal: gutter, gap: 12 }}>
        <SectionHeader title="Lịch hôm nay" />
        {!bookings.loading && !todays.length ? (
          <Txt color={colors.inkSoft}>
            Hôm nay trống lịch.{next ? ` Lịch gần nhất: ${next.time}, ${next.date.split("-").reverse().join("/")}.` : ""}
          </Txt>
        ) : null}
        {todays.map((b) => (
          <Press
            key={b.id}
            onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: b.id } })}
            style={{ flexDirection: "row", gap: 14, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 }}
          >
            <Txt v="title" tabular style={{ width: 56 }}>
              {b.time}
            </Txt>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt w={700}>{b.serviceName}</Txt>
              <Txt v="meta" color={colors.inkSoft}>
                {b.customer.name} · {b.atHome ? [b.address, b.district].filter(Boolean).join(", ") : "Tại studio"}
              </Txt>
              {b.atHome ? (
                <View style={{ flexDirection: "row", marginTop: 4 }}>
                  <Button label="Chỉ đường" icon="directions" size="sm" variant="secondary" onPress={() => void Linking.openURL(mapsUrl(b))} />
                </View>
              ) : null}
            </View>
          </Press>
        ))}
      </View>

      <View style={{ paddingHorizontal: gutter, gap: 12 }}>
        <SectionHeader title="Tuần này" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Card style={{ flex: 1 }}>
            <Txt v="h2" tabular>
              {formatPrice(earned)}
            </Txt>
            <Txt v="meta" color={colors.muted}>
              bạn nhận, từ lịch đã hoàn thành
            </Txt>
          </Card>
          <Card style={{ width: 110 }}>
            <Txt v="h2" tabular>
              {week.length}
            </Txt>
            <Txt v="meta" color={colors.muted}>
              lịch xong
            </Txt>
          </Card>
        </View>
        <Txt v="meta" color={colors.muted}>
          Tính từ thứ 2, sau hoa hồng 360dep. Tiền mặt khách trả trực tiếp cho bạn.
        </Txt>
      </View>
    </ScrollView>
  )
}
