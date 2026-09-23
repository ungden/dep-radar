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
import { colors, gutter, radius } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { refreshControl } from "@/ui/refresh"
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
        refreshControl={refreshControl(bookings.refreshing, () => void bookings.refresh())}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 10 }}>
            <Press
              onPress={() => router.push("/yeu-cau")}
              accessibilityLabel="Yêu cầu của tôi"
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 }}
            >
              <Icon name="megaphone" size={20} color={colors.accentDark} />
              <View style={{ flex: 1 }}>
                <Txt w={700} color={colors.accentDark}>
                  Yêu cầu của tôi
                </Txt>
                <Txt v="meta" color={colors.accentDark}>
                  Yêu cầu đã đăng, và ai đã nhận việc.
                </Txt>
              </View>
              <Icon name="right" size={14} color={colors.accentDark} />
            </Press>
            {bookings.error ? <ErrorNote text={bookings.error} onRetry={() => void bookings.reload()} /> : null}
          </View>
        }
        ListEmptyComponent={
          bookings.loading ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 96, borderRadius: 12 }} />
              ))}
            </View>
          ) : bookings.error ? null : tab === "upcoming" ? (
            <EmptyState title="Chưa có lịch sắp tới" text="Tìm người làm và đặt lịch, họ sẽ xem và nhận lịch trong 2 giờ." action="Khám phá" onAction={() => router.navigate("/")} />
          ) : (
            <EmptyState title="Chưa có lịch nào đã qua" />
          )
        }
      />
    </View>
  )
}
