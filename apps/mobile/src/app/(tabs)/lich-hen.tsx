import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { isUpcoming, listBookings } from "@/data/bookings"
import { BookingRow } from "@/components/booking-row"
import { SignInGate } from "@/components/sign-in-gate"
import { TextTabs } from "@/components/switches"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter } from "@/theme"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { Txt } from "@/ui/text"

export default function MyBookings() {
  const { uid } = useApp()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming")
  const bookings = useAsync(uid ? () => listBookings(uid, "customer") : null, [uid])

  if (!uid) return <SignInGate title="Lịch hẹn" text="Đăng nhập để xem, đổi hoặc huỷ lịch hẹn của bạn." />

  const all = bookings.value ?? []
  const list =
    tab === "upcoming"
      ? all.filter(isUpcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      : all.filter((b) => !isUpcoming(b))

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + 8 }}>
      <Txt v="h1" style={{ paddingHorizontal: gutter }}>
        Lịch hẹn
      </Txt>
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line, marginTop: 4 }}>
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
        data={list}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: gutter }}
        renderItem={({ item }) => (
          <View style={{ paddingBottom: 10 }}>
            <BookingRow booking={item} as="customer" />
          </View>
        )}
        refreshing={bookings.refreshing}
        onRefresh={() => void bookings.refresh()}
        ListHeaderComponent={bookings.error ? <ErrorNote text={bookings.error} onRetry={() => void bookings.reload()} /> : null}
        ListEmptyComponent={
          bookings.loading ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 96, borderRadius: 12 }} />
              ))}
            </View>
          ) : bookings.error ? null : tab === "upcoming" ? (
            <EmptyState title="Chưa có lịch sắp tới" text="Tìm người làm và đặt lịch, họ sẽ gọi xác nhận trong 2 giờ." action="Khám phá" onAction={() => router.navigate("/")} />
          ) : (
            <EmptyState title="Chưa có lịch nào đã qua" />
          )
        }
      />
    </View>
  )
}
