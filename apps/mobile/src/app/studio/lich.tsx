import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import * as WebBrowser from "expo-web-browser"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { isUpcoming, listBookings, type BookingItem } from "@/data/bookings"
import { formatDay } from "@/data/format"
import { webLink } from "@/data/links"
import { BookingRow } from "@/components/booking-row"
import { StudioHeader } from "@/components/studio-header"
import { TextTabs } from "@/components/switches"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter } from "@/theme"
import { Button } from "@/ui/button"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

type Row = { kind: "day"; date: string } | { kind: "booking"; booking: BookingItem }

export default function StudioCalendar() {
  const { uid } = useApp()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming")
  const bookings = useAsync(uid ? () => listBookings(uid, "pro") : null, [uid])

  const all = bookings.value ?? []
  const list = tab === "upcoming" ? all.filter(isUpcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt)) : all.filter((b) => !isUpcoming(b))
  const rows: Row[] = []
  for (const b of list) {
    if (rows.length === 0 || (rows.at(-1)!.kind === "booking" && (rows.at(-1) as { booking: BookingItem }).booking.date !== b.date)) rows.push({ kind: "day", date: b.date })
    rows.push({ kind: "booking", booking: b })
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <StudioHeader title="Lịch" />
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <TextTabs
          items={[
            { value: "upcoming", label: "Sắp tới" },
            { value: "past", label: "Đã qua" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <FlashList
        data={rows}
        keyExtractor={(r) => (r.kind === "day" ? `d:${r.date}` : r.booking.id)}
        getItemType={(r) => r.kind}
        contentContainerStyle={{ padding: gutter }}
        refreshControl={refreshControl(bookings.refreshing, () => void bookings.refresh())}
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
        ListHeaderComponent={bookings.error ? <ErrorNote text={bookings.error} onRetry={() => void bookings.reload()} /> : null}
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
        ListFooterComponent={
          <View style={{ paddingTop: 16, gap: 8 }}>
            <Txt v="meta" color={colors.muted}>
              Giờ làm việc và ngày nghỉ quyết định giờ trống khách thấy.
            </Txt>
            <Button label="Giờ làm, ngày nghỉ (mở trên web)" size="sm" variant="secondary" icon="external" onPress={() => void WebBrowser.openBrowserAsync(webLink("/studio/schedule"))} />
          </View>
        }
      />
    </View>
  )
}
