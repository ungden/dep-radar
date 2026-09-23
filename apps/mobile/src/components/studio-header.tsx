import { router } from "expo-router"
import { View } from "react-native"
import { useApp } from "@/state/app"
import { colors, gutter } from "@/theme"
import { IconButton } from "@/ui/button"
import { Txt } from "@/ui/text"

/** Studio screens: a big title, and the same chat and notification counts as the customer side. */
export function StudioHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { me } = useApp()
  return (
    <View style={{ paddingHorizontal: gutter, paddingBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Txt v="label" w={700} color={colors.muted} style={{ letterSpacing: 1 }}>
          STUDIO
        </Txt>
        <View style={{ flexDirection: "row" }}>
          <IconButton name="chat" label="Tin nhắn" badge={me.unreadMessages} onPress={() => router.push("/tin-nhan")} />
          <IconButton name="bell" label="Thông báo" badge={me.unreadNotifications} onPress={() => router.push("/thong-bao")} />
        </View>
      </View>
      <Txt v="h1">{title}</Txt>
      {subtitle ? <Txt color={colors.inkSoft}>{subtitle}</Txt> : null}
    </View>
  )
}
