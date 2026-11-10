import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { Alert, ScrollView, View } from "react-native"
import { isUpcoming, listBookings, type BookingItem } from "@/data/bookings"
import { addDays, formatDateLong, formatDay, todayISO, weekdayShort } from "@/data/format"
import { addDayOff, loadSchedule, removeDayOff, weekSummary, windowsLabel } from "@/data/schedule"
import { BookingRow } from "@/components/booking-row"
import { PartnerAppointments } from "@/components/partner-appointments"
import { StudioHeader } from "@/components/studio-header"
import { TextTabs } from "@/components/switches"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, hairline, radius } from "@/theme"
import { Button } from "@/ui/button"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"
import { useToast } from "@/ui/toast"

type Row = { kind: "day"; date: string } | { kind: "booking"; booking: BookingItem }

const LIVE = ["pending", "confirmed", "in_progress"]

/**
 * The partner's calendar: two weeks at a glance, the chosen day's bookings
 * and hours, a day off in one tap, the weekly hours, then every booking.
 */
export default function StudioCalendar() {
  const { uid } = useApp()
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming")
  const bookings = useAsync(uid ? () => listBookings(uid, "pro") : null, [uid])
  const schedule = useAsync(uid ? () => loadSchedule(uid) : null, [uid])
  const today = todayISO()
  const [day, setDay] = React.useState(today)
  const [busy, setBusy] = React.useState(false)
  const toast = useToast(112)

  const all = bookings.value ?? []
  const list = tab === "upcoming" ? all.filter(isUpcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt)) : all.filter((b) => !isUpcoming(b))
  const rows: Row[] = []
  for (const b of list) {
    if (rows.length === 0 || (rows.at(-1)!.kind === "booking" && (rows.at(-1) as { booking: BookingItem }).booking.date !== b.date)) rows.push({ kind: "day", date: b.date })
    rows.push({ kind: "booking", booking: b })
  }

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))
  const daysOff = schedule.value?.daysOff ?? []
  const hours = schedule.value?.hours ?? []
  const offOn = (d: string) => daysOff.find((o) => o.startsOn <= d && d <= o.endsOn)
  const liveOn = (d: string) => all.filter((b) => b.date === d && LIVE.includes(b.status))
  const weekday = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay()
  const chosenOff = offOn(day)
  const chosen = liveOn(day).sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  const toggleOff = async () => {
    if (!uid) return
    setBusy(true)
    const res = chosenOff ? await removeDayOff(chosenOff.id) : await addDayOff(uid, day, day)
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return Alert.alert(chosenOff ? "Chưa bỏ được ngày nghỉ" : "Chưa báo nghỉ được", res.error)
    }
    haptic.success()
    toast.show(chosenOff ? `Đã mở lại ${formatDateLong(day)}` : `Đã báo nghỉ ${formatDateLong(day)}. Khách không đặt được ngày này.`)
    void schedule.reload()
  }

  const dayPanel = (
    <View style={{ gap: 24, paddingBottom: 28 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -gutter }} contentContainerStyle={{ paddingHorizontal: gutter, gap: 8 }}>
        {days.map((d) => {
          const selected = d === day
          const off = Boolean(offOn(d)) || (schedule.value ? windowsLabel(hours, weekday(d)) === "Nghỉ" : false)
          const has = liveOn(d).length > 0
          return (
            <Press
              key={d}
              haptic="select"
              onPress={() => setDay(d)}
              accessibilityState={{ selected }}
              accessibilityLabel={`${formatDateLong(d)}${off ? ", nghỉ" : ""}${has ? `, có ${liveOn(d).length} lịch` : ""}`}
              style={{ width: 56, paddingVertical: 10, borderRadius: radius.md, alignItems: "center", gap: 2, backgroundColor: selected ? colors.accent : off ? colors.subtle : colors.surface }}
            >
              <Txt v="meta" color={selected ? colors.surface : colors.muted}>
                {d === today ? "Nay" : weekdayShort(d)}
              </Txt>
              <Txt v="lead" w={700} tabular color={selected ? colors.surface : off ? colors.muted : colors.ink}>
                {Number(d.slice(8))}
              </Txt>
              <View style={{ height: 20, justifyContent: "center" }}>
                {off ? (
                  <Txt v="label" color={selected ? colors.surface : colors.muted}>
                    Nghỉ
                  </Txt>
                ) : has ? (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: selected ? colors.surface : colors.accent }} />
                ) : null}
              </View>
            </Press>
          )
        })}
      </ScrollView>

      <View style={{ gap: 12 }}>
        <Txt v="title">{formatDay(day) === formatDateLong(day) ? formatDateLong(day) : `${formatDay(day)}, ${formatDateLong(day)}`}</Txt>
        {chosen.length ? (
          chosen.map((b) => <BookingRow key={b.id} booking={b} as="pro" />)
        ) : (
          <Txt color={colors.inkSoft}>{chosenOff ? "Bạn nghỉ ngày này. Khách không đặt được." : "Chưa có lịch."}</Txt>
        )}
        {schedule.value && !chosenOff ? (
          <Txt v="meta" color={colors.muted}>
            Giờ làm ngày này: {windowsLabel(hours, weekday(day))}
          </Txt>
        ) : null}
        <Button
          label={chosenOff ? "Mở lại ngày này" : "Báo nghỉ ngày này"}
          icon={chosenOff ? "calendar" : "dayOff"}
          variant="secondary"
          full
          busy={busy}
          disabled={!schedule.value}
          onPress={() =>
            chosenOff
              ? void toggleOff()
              : Alert.alert(`Nghỉ ${formatDateLong(day)}?`, "Khách sẽ không đặt được lịch với bạn ngày này.", [
                  { text: "Thôi", style: "cancel" },
                  { text: "Báo nghỉ", onPress: () => void toggleOff() },
                ])
          }
        />
        {chosenOff && chosenOff.startsOn !== chosenOff.endsOn ? (
          <Txt v="meta" color={colors.muted}>
            Đợt nghỉ {formatDateLong(chosenOff.startsOn)} – {formatDateLong(chosenOff.endsOn)}. Mở lại sẽ bỏ cả đợt.
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
          <Txt v="title">Giờ làm việc</Txt>
          <Press onPress={() => router.push({ pathname: "/ho-so-doi-tac", params: { step: "3" } })} accessibilityRole="button" style={{ minHeight: 32, justifyContent: "center" }}>
            <Txt v="meta" w={600} color={colors.accentDark}>
              Sửa
            </Txt>
          </Press>
        </View>
        {schedule.error ? <ErrorNote text={schedule.error} onRetry={() => void schedule.reload()} /> : null}
        {schedule.value ? (
          <Press onPress={() => router.push({ pathname: "/ho-so-doi-tac", params: { step: "3" } })} accessibilityLabel="Sửa giờ làm việc" style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 18 }}>
            {weekSummary(hours).map(([label, value], i) => (
              <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 52, borderTopWidth: i ? hairline : 0, borderTopColor: colors.line }}>
                <Txt w={600}>{label}</Txt>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Txt color={value === "Nghỉ" ? colors.muted : colors.ink} tabular>
                    {value}
                  </Txt>
                  <Icon name="right" size={14} color={colors.muted} />
                </View>
              </View>
            ))}
          </Press>
        ) : (
          <Skeleton style={{ height: 104, borderRadius: radius.lg }} />
        )}
        <Txt v="meta" color={colors.muted}>
          Khách chỉ thấy giờ trống trong khung này, trừ ngày nghỉ.
        </Txt>
      </View>

      <TextTabs
        items={[
          { value: "upcoming", label: "Tất cả lịch sắp tới" },
          { value: "past", label: "Đã qua" },
        ]}
        value={tab}
        onChange={setTab}
      />
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StudioHeader title="Lịch" />
      <FlashList
        data={rows}
        keyExtractor={(r) => (r.kind === "day" ? `d:${r.date}` : r.booking.id)}
        getItemType={(r) => r.kind}
        extraData={[day, schedule.value, busy]}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: gutter }}
        refreshControl={refreshControl(bookings.refreshing || schedule.refreshing, () => {
          void bookings.refresh()
          void schedule.refresh()
        })}
        renderItem={({ item }) =>
          item.kind === "day" ? (
            <Txt w={700} style={{ paddingTop: 8, paddingBottom: 8 }}>
              {formatDay(item.date)}
            </Txt>
          ) : (
            <View style={{ paddingBottom: 10 }}>
              <BookingRow booking={item.booking} as="pro" />
            </View>
          )
        }
        ListHeaderComponent={
          <>
            {bookings.error ? <ErrorNote text={bookings.error} onRetry={() => void bookings.reload()} /> : null}
            {dayPanel}
            {tab === "upcoming" ? <PartnerAppointments reloadKey={bookings.value} /> : null}
          </>
        }
        ListEmptyComponent={
          bookings.loading ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 96, borderRadius: 12 }} />
              ))}
            </View>
          ) : bookings.error ? null : (
            <EmptyState title={tab === "upcoming" ? "Chưa có lịch sắp tới" : "Chưa có lịch đã qua"} text={tab === "upcoming" ? "Khách đặt lịch với bạn sẽ hiện ở đây." : undefined} />
          )
        }
      />
      {toast.element}
    </View>
  )
}
