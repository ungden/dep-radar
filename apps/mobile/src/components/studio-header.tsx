import type { ReactNode } from "react"
import { router } from "expo-router"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useApp } from "@/state/app"
import { colors, gutter } from "@/theme"
import { IconButton } from "@/ui/button"
import { Txt } from "@/ui/text"

/** The top of a Studio tab: the same flat rose bar as the customer side, with chat and notification counts. */
export function StudioHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  const { me } = useApp()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ backgroundColor: colors.accentSoft, paddingTop: insets.top + 4, paddingBottom: children ? 0 : 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: gutter, paddingRight: gutter - 8, gap: 4 }}>
        <View style={{ flex: 1 }}>
          <Txt v="h1">{title}</Txt>
          {subtitle ? <Txt v="meta" color={colors.inkSoft}>{subtitle}</Txt> : null}
        </View>
        <IconButton name="chat" label="Tin nhắn" badge={me.unreadMessages} onPress={() => router.push("/tin-nhan")} />
        <IconButton name="bell" label="Thông báo" badge={me.unreadNotifications} onPress={() => router.push("/thong-bao")} />
      </View>
      {children}
    </View>
  )
}
