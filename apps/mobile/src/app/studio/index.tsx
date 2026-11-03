import * as React from "react"
import { router } from "expo-router"
import { Alert, ScrollView, View } from "react-native"
import { confirmBooking, listBookings, type BookingItem } from "@/data/bookings"
import { addDays, formatCountdown, formatDateLong, formatPrice, localDate, todayISO } from "@/data/format"
import { AcceptingSwitch } from "@/components/accepting-switch"
import { FeeCard, OWING_NOTE, useFee } from "@/components/fee-card"
import { PartnerAppointments } from "@/components/partner-appointments"
import { StudioHeader } from "@/components/studio-header"
import { useApp } from "@/state/app"
import { useNow } from "@/state/keyboard"
import { useAsync } from "@/state/use-async"
import { colors, gutter, hairline, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, ErrorNote, Skeleton } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/** The freelancer's home: a fee to pay first, bookings to accept, where to be today, what this week earned. */
export default function Today() {
  const app = useApp()
  const uid = app.uid
  const bookings = useAsync(uid ? () => listBookings(uid, "pro") : null, [uid])
  const fee = useFee(uid)
  const [busy, setBusy] = React.useState<string | null>(null)
  const all = bookings.value ?? []
  const hasPending = all.some((b) => b.status === "pending")
  // Ticks only while a confirmation countdown is on screen.
  const now = useNow(hasPending)

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
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StudioHeader title="Hôm nay" subtitle={formatDateLong(today)}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: gutter, paddingTop: 8, paddingBottom: 12 }}>
          {app.myPro?.published ? (
            <>
              <Txt w={600}>{app.myPro.acceptingJobs ? "Đang nhận lịch mới" : "Đang tạm nghỉ"}</Txt>
              <AcceptingSwitch />
            </>
          ) : (
            <Txt w={600}>Hồ sơ chưa hiện với khách, xem ở tab Tôi</Txt>
          )}
        </View>
      </StudioHeader>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: gutter, paddingTop: 24, paddingBottom: 40, gap: 32 }}
        refreshControl={refreshControl(bookings.refreshing || fee.refreshing, () => {
          void bookings.refresh()
          void fee.refresh()
        })}
      >
        {bookings.error ? <ErrorNote text={bookings.error} onRetry={() => void bookings.reload()} /> : null}
        {fee.owing ? <FeeCard fee={fee.value} /> : null}

        <Card>
          <Txt v="meta" color={colors.muted}>
            Tuần này bạn nhận
          </Txt>
          <Txt v="hero" tabular>
            {formatPrice(earned)}
          </Txt>
          <Txt v="meta" color={colors.inkSoft}>
            {week.length} lịch đã xong, tính từ thứ 2, sau phí 360dep
          </Txt>
        </Card>

        {bookings.loading || toAccept.length ? (
          <View style={{ gap: 12 }}>
            <Txt v="title">Cần trả lời</Txt>
            {bookings.loading ? <Skeleton style={{ height: 160, borderRadius: radius.lg }} /> : null}
            {toAccept.length && fee.owing ? (
              <Txt v="meta" color={colors.warning}>
                {OWING_NOTE}
              </Txt>
            ) : null}
            {toAccept.map((b) => {
              const left = Date.parse(b.confirmBy) - now
              const urgent = left > 0 && left < 30 * 60_000
              return (
                <Card key={b.id}>
                  <Press onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: b.id } })} accessibilityLabel={`${b.serviceName}, ${b.customer.name}. Xem chi tiết`} style={{ gap: 2 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                      <Txt v="lead" style={{ flex: 1 }}>
                        {b.serviceName}, {b.variantLabel}
                      </Txt>
                      <Txt v="lead" w={700} tabular color={colors.accentDark}>
                        {formatPrice(b.quote.payout)}
                      </Txt>
                    </View>
                    <Txt v="meta" color={colors.inkSoft}>
                      {b.customer.name} · {b.atHome ? b.district : "Tại studio"} · {b.time}, {b.date.split("-").reverse().join("/")}
                    </Txt>
                  </Press>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Icon name="clock" size={16} color={urgent ? colors.danger : colors.warning} />
                    <Txt v="meta" w={600} color={urgent ? colors.danger : colors.warning}>
                      {left > 0 ? `Còn ${formatCountdown(left)} để nhận` : "Quá hạn nhận"}
                    </Txt>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Button label="Nhận lịch" full busy={busy === b.id} disabled={fee.owing} onPress={() => void accept(b)} />
                    </View>
                    <Button label="Từ chối" variant="secondary" onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: b.id, decline: "1" } })} />
                  </View>
                </Card>
              )
            })}
          </View>
        ) : null}

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Txt v="title">Lịch hôm nay</Txt>
            <Press onPress={() => router.navigate("/studio/lich")} accessibilityRole="link" style={{ minHeight: 32, justifyContent: "center" }}>
              <Txt v="meta" w={600} color={colors.accentDark}>
                Xem lịch
              </Txt>
            </Press>
          </View>
          {!bookings.loading && !todays.length ? (
            <Txt color={colors.inkSoft}>
              Hôm nay trống lịch.{next ? ` Lịch gần nhất: ${next.time}, ${next.date.split("-").reverse().join("/")}.` : ""}
            </Txt>
          ) : null}
          {todays.length ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 20 }}>
              {todays.map((b, i) => (
                <Press
                  key={b.id}
                  onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: b.id } })}
                  accessibilityLabel={`${b.time}, ${b.serviceName}, ${b.customer.name}`}
                  style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 18, borderTopWidth: i ? hairline : 0, borderTopColor: colors.line }}
                >
                  <Txt v="title" tabular style={{ width: 62 }}>
                    {b.time}
                  </Txt>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt w={600}>{b.serviceName}</Txt>
                    <Txt v="meta" color={colors.inkSoft} numberOfLines={1}>
                      {b.customer.name} · {b.atHome ? b.district : "Tại studio"}
                    </Txt>
                  </View>
                  <Icon name="right" size={14} color={colors.muted} />
                </Press>
              ))}
            </View>
          ) : null}
        </View>

        <PartnerAppointments date={today} reloadKey={bookings.value} />
      </ScrollView>
    </View>
  )
}
