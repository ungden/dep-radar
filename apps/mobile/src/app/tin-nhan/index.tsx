import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { View } from "react-native"
import { listThreads } from "@/data/chat"
import { timeAgo } from "@/data/format"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter } from "@/theme"
import { Avatar, EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

export default function Threads() {
  const { uid, mode, blocked } = useApp()
  const threads = useAsync(uid ? () => listThreads(uid) : null, [uid])

  if (!uid) return <EmptyState title="Cần đăng nhập" action="Đăng nhập" onAction={() => router.push("/login")} />

  return (
    <FlashList
      style={{ backgroundColor: colors.canvas }}
      data={(threads.value ?? []).filter((t) => !blocked.has(t.otherId))}
      keyExtractor={(t) => t.id}
      refreshControl={refreshControl(threads.refreshing, () => void threads.refresh())}
      renderItem={({ item }) => (
        <Press
          onPress={() => router.push({ pathname: "/tin-nhan/[id]", params: { id: item.id } })}
          accessibilityLabel={`${item.otherName}${item.unread ? `, ${item.unread} tin chưa đọc` : ""}: ${item.lastMessage}`}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: gutter, paddingVertical: 12 }}
        >
          <Avatar name={item.otherName} uri={item.otherAvatar} size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Txt w={item.unread ? 800 : 600} numberOfLines={1} style={{ flexShrink: 1 }}>
                {item.otherName}
              </Txt>
              <Txt v="meta" color={colors.muted}>
                {timeAgo(item.lastMessageAt)}
              </Txt>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Txt v="meta" color={item.unread ? colors.ink : colors.inkSoft} w={item.unread ? 600 : 400} numberOfLines={1} style={{ flex: 1 }}>
                {item.lastMessage}
              </Txt>
              {item.unread ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent }} /> : null}
            </View>
          </View>
        </Press>
      )}
      ListHeaderComponent={threads.error ? <View style={{ padding: gutter }}><ErrorNote text={threads.error} onRetry={() => void threads.reload()} /></View> : null}
      ListEmptyComponent={
        threads.loading ? (
          <View style={{ padding: gutter, gap: 16 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Skeleton style={{ width: 48, height: 48, borderRadius: 24 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton style={{ height: 15, width: "50%" }} />
                  <Skeleton style={{ height: 13, width: "80%" }} />
                </View>
              </View>
            ))}
          </View>
        ) : threads.error ? null : (
          <EmptyState
            title="Chưa có tin nhắn"
            text={mode === "pro" ? "Khách nhắn cho bạn sẽ hiện ở đây." : "Nhắn cho người làm từ hồ sơ của họ hoặc từ lịch hẹn."}
            action={mode === "pro" ? undefined : "Khám phá"}
            onAction={() => router.navigate("/")}
          />
        )
      }
    />
  )
}
