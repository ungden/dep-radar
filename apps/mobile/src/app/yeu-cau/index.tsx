import { FlashList } from "@shopify/flash-list"
import { Stack, router } from "expo-router"
import { View } from "react-native"
import { getTemplate, getVariant } from "@/shared"
import { formatDateLong, timeAgo } from "@/data/format"
import { listMyRequests } from "@/data/requests"
import { REQUEST_STATUS } from "@/components/request-status"
import { SignInGate } from "@/components/sign-in-gate"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/** The customer's own requests and how many quotes each has. */
export default function MyRequests() {
  const { uid } = useApp()
  const requests = useAsync(uid ? () => listMyRequests(uid) : null, [uid])
  if (!uid) return <SignInGate title="Yêu cầu" text="Đăng nhập để đăng yêu cầu và xem báo giá." />

  return (
    <>
      <Stack.Screen options={{ headerRight: () => <Button label="Đăng" icon="plus" size="sm" variant="ghost" onPress={() => router.push("/yeu-cau/moi")} /> }} />
      <FlashList
        style={{ backgroundColor: colors.canvas }}
        data={requests.value ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: gutter }}
        refreshControl={refreshControl(requests.refreshing, () => void requests.refresh())}
        renderItem={({ item }) => {
          const t = getTemplate(item.templateId)
          const v = getVariant(item.templateId, item.variantId)
          const status = REQUEST_STATUS[item.status] ?? REQUEST_STATUS.closed
          const pending = item.offers.filter((o) => o.status === "pending").length
          return (
            <Press
              onPress={() => router.push({ pathname: "/yeu-cau/[id]", params: { id: item.id } })}
              accessibilityLabel={`${t?.name ?? "Yêu cầu"}, ${status.label}, ${item.offers.length} báo giá`}
              style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, gap: 6, marginBottom: 10 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <View style={{ backgroundColor: status.bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Txt v="meta" w={700} color={status.fg}>
                    {status.label}
                  </Txt>
                </View>
                <Txt v="meta" color={colors.muted}>
                  {timeAgo(item.createdAt)}
                </Txt>
              </View>
              <Txt w={700}>
                {t?.name ?? item.templateId}
                {v ? ` · ${v.label}` : ""}
              </Txt>
              <Txt v="meta" color={colors.inkSoft}>
                {item.time}, {formatDateLong(item.date)} · {item.district}, {item.city}
              </Txt>
              <Txt v="meta" w={600} color={item.offers.length ? colors.accentDark : colors.muted}>
                {item.offers.length ? `${item.offers.length} báo giá${pending && item.status === "open" ? `, ${pending} đang chờ bạn chọn` : ""}` : "Chưa có báo giá"}
              </Txt>
            </Press>
          )
        }}
        ListHeaderComponent={requests.error ? <ErrorNote text={requests.error} onRetry={() => void requests.reload()} /> : null}
        ListEmptyComponent={
          requests.loading ? (
            <View style={{ gap: 10 }}>
              {[0, 1].map((i) => (
                <Skeleton key={i} style={{ height: 110, borderRadius: radius.md }} />
              ))}
            </View>
          ) : requests.error ? null : (
            <EmptyState
              title="Bạn chưa đăng yêu cầu nào"
              text="Mô tả bạn cần làm gì, người làm gần bạn sẽ gửi báo giá."
              action="Đăng yêu cầu"
              onAction={() => router.push("/yeu-cau/moi")}
            />
          )
        }
      />
    </>
  )
}
