import { router } from "expo-router"
import { View } from "react-native"
import { CITIES } from "@/shared"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Wordmark } from "@/ui/bits"
import { IconButton } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

/** City · logo · chat and notifications, with the real unread counts. */
export function TopBar() {
  const { city, setCity, uid, me } = useApp()
  const sheet = useSheet()
  const needSignIn = (path: "/tin-nhan" | "/thong-bao") => router.push(uid ? path : "/login")

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: gutter - 4, height: 52 }}>
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <Press
          onPress={sheet.open}
          accessibilityLabel={`Khu vực: ${city ?? "Cả nước"}. Đổi khu vực`}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, height: 44, paddingHorizontal: 4 }}
        >
          <Icon name="pin" size={16} />
          <Txt w={700} numberOfLines={1}>
            {city ?? "Cả nước"}
          </Txt>
          <Icon name="down" size={14} color={colors.muted} />
        </Press>
      </View>
      <Wordmark size={24} />
      <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}>
        <IconButton name="chat" label="Tin nhắn" badge={me.unreadMessages} onPress={() => needSignIn("/tin-nhan")} />
        <IconButton name="bell" label="Thông báo" badge={me.unreadNotifications} onPress={() => needSignIn("/thong-bao")} />
      </View>

      <Sheet sheet={sheet} title="Bạn đang ở đâu?" size="medium">
        <Txt color={colors.inkSoft}>
          Đang xem:{" "}
          <Txt w={700} color={colors.accentDark}>
            {city ?? "Cả nước"}
          </Txt>
        </Txt>
        <View style={{ gap: 6 }} accessibilityRole="radiogroup">
          {[...CITIES, null].map((c) => {
            const selected = c === city
            return (
              <Press
                key={c ?? "all"}
                haptic="select"
                onPress={() => {
                  setCity(c)
                  sheet.close()
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: radius.md,
                  backgroundColor: selected ? colors.accentSoft : colors.surface,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.accent : colors.line,
                }}
              >
                <Txt v="lead" w={selected ? 700 : 500} color={selected ? colors.accentDark : colors.ink}>
                  {c ?? "Cả nước"}
                </Txt>
                {selected ? <Icon name="check" size={18} color={colors.accent} /> : null}
              </Press>
            )
          })}
        </View>
      </Sheet>
    </View>
  )
}
