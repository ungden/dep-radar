import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { View } from "react-native"
import { isUpcoming, listBookings, type BookingItem } from "@/data/bookings"
import { formatPrice } from "@/data/format"
import { rebookCart } from "@/shared"
import { BookingRow } from "@/components/booking-row"
import { PageBand } from "@/components/page-band"
import { SignInGate } from "@/components/sign-in-gate"
import { TextTabs } from "@/components/switches"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius, hairline } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

export default function MyBookings() {
  const { uid } = useApp()
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming")
  const bookings = useAsync(uid ? () => listBookings(uid, "customer") : null, [uid])

  if (!uid) return <SignInGate title="Lịch hẹn" text="Đăng nhập để xem, đổi hoặc huỷ lịch hẹn của bạn." />

  const all = bookings.value ?? []
  const list =
    tab === "upcoming"
      ? all.filter(isUpcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      : all.filter((b) => !isUpcoming(b))

  const completed = all.filter((b) => b.status === "completed")
  const rows: ({ id: string; month: string } | BookingItem)[] = []
  let lastMonth = ""
  for (const booking of list) {
    if (tab === "past" && lastMonth !== booking.date.slice(0, 7)) {
      lastMonth = booking.date.slice(0, 7)
      rows.push({ id: "month-" + lastMonth, month: `Tháng ${Number(lastMonth.slice(5))}/${lastMonth.slice(0, 4)}` })
    }
    rows.push(booking)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageBand title="Lịch hẹn">
        <TextTabs
          items={[
            { value: "upcoming", label: "Sắp tới" },
            { value: "past", label: "Đã qua" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </PageBand>
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        data={rows}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: gutter }}
        renderItem={({ item }) => "month" in item ? (
          <Txt v="lead" w={700} style={{ paddingVertical: 10 }}>{item.month}</Txt>
        ) : (
          <View style={{ paddingBottom: 10 }}>
            <BookingRow booking={item} as="customer" />
            {item.status === "completed" && item.pro.slug ? <Press onPress={() => router.push({ pathname: "/book/[proId]", params: { proId: item.pro.slug, cart: rebookCart(item) } })} style={{ minHeight: 44, alignSelf: "flex-end", justifyContent: "center", paddingHorizontal: 12 }}><Txt color={colors.accentDark} w={600}>Đặt lại</Txt></Press> : null}
          </View>
        )}
        refreshControl={refreshControl(bookings.refreshing, () => void bookings.refresh())}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 10 }}>
            {tab === "past" && completed.length ? <Txt v="meta" color={colors.inkSoft}>{completed.length} lịch hoàn thành · {formatPrice(completed.reduce((n, b) => n + b.quote.total - b.discount, 0))} giá trị lịch</Txt> : null}
            <Press
              onPress={() => router.push("/yeu-cau")}
              accessibilityLabel="Đơn theo dịch vụ"
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 }}
            >
              <Icon name="megaphone" size={20} color={colors.accentDark} />
              <View style={{ flex: 1 }}>
                <Txt w={700} color={colors.accentDark}>
                  Đơn theo dịch vụ
                </Txt>
                <Txt v="meta" color={colors.accentDark}>
                  Đơn đang chờ, và Artist đã nhận.
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
            <EmptyState title="Chưa có lịch sắp tới" text="Chọn Artist và đặt lịch, họ sẽ xem và nhận lịch trong 2 giờ." action="Khám phá" onAction={() => router.navigate("/")} />
          ) : (
            <EmptyState title="Chưa có lịch nào đã qua" />
          )
        }
      />
    </View>
  )
}
