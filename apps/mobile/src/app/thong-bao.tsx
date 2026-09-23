import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { View } from "react-native"
import { timeAgo } from "@/data/format"
import { webLink } from "@/data/links"
import { listNotifications, markNotificationsRead, type NotificationItem } from "@/data/me"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter } from "@/theme"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** Links in notifications are web paths; open the native screen when there is one. */
function open(link: string | null) {
  if (!link) return
  const booking = link.match(/^\/bookings\/([0-9a-f-]{36})/)
  if (booking) return router.push({ pathname: "/bookings/[id]", params: { id: booking[1] } })
  const thread = link.match(/^\/tin-nhan\/([0-9a-f-]{36})/)
  if (thread) return router.push({ pathname: "/tin-nhan/[id]", params: { id: thread[1] } })
  if (link.startsWith("/")) void WebBrowser.openBrowserAsync(webLink(link))
}

export default function Notifications() {
  const { uid, refreshMe } = useApp()
  const notes = useAsync(uid ? () => listNotifications(uid) : null, [uid])
  const [readBefore, setReadBefore] = React.useState<Set<string>>(new Set())

  // Seen means read: stamp them once the list is on screen, but keep the dots
  // for this visit so the person can still tell what was new.
  React.useEffect(() => {
    if (!uid || !notes.value) return
    setReadBefore(new Set(notes.value.filter((n) => n.readAt).map((n) => n.id)))
    if (notes.value.some((n) => !n.readAt)) void markNotificationsRead(uid).then(() => refreshMe())
  }, [uid, notes.value, refreshMe])

  if (!uid) return <EmptyState title="Cần đăng nhập" action="Đăng nhập" onAction={() => router.push("/login")} />

  return (
    <FlashList<NotificationItem>
      style={{ backgroundColor: colors.canvas }}
      data={notes.value ?? []}
      keyExtractor={(n) => n.id}
      refreshing={notes.refreshing}
      onRefresh={() => void notes.refresh()}
      renderItem={({ item }) => {
        const unread = !item.readAt && !readBefore.has(item.id)
        return (
          <Press onPress={() => open(item.link)} style={{ flexDirection: "row", gap: 12, paddingHorizontal: gutter, paddingVertical: 14 }}>
            <View style={{ width: 9, paddingTop: 7 }}>
              {unread ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent }} /> : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt w={unread ? 700 : 600}>{item.title}</Txt>
              {item.body ? <Txt color={colors.inkSoft}>{item.body}</Txt> : null}
              <Txt v="meta" color={colors.muted}>
                {timeAgo(item.createdAt)}
              </Txt>
            </View>
          </Press>
        )
      }}
      ListHeaderComponent={notes.error ? <View style={{ padding: gutter }}><ErrorNote text={notes.error} onRetry={() => void notes.reload()} /></View> : null}
      ListEmptyComponent={
        notes.loading ? (
          <View style={{ padding: gutter, gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 56 }} />
            ))}
          </View>
        ) : notes.error ? null : (
          <EmptyState title="Chưa có thông báo" text="Khi lịch hẹn được xác nhận, đổi giờ hoặc có tin nhắn, bạn sẽ thấy ở đây." />
        )
      }
    />
  )
}
