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

/**
 * One compact row: the logo, then where the customer is looking (a pill they
 * can change), chat and notifications with the real unread counts.
 */
export function TopBar() {
  const { city, setCity, uid, me } = useApp()
  const sheet = useSheet()
  const needSignIn = (path: "/tin-nhan" | "/thong-bao") => router.push(uid ? path : "/login")

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: gutter, paddingRight: gutter - 8, minHeight: 52, gap: 4 }}>
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <Wordmark size={22} />
      </View>
      <Press
        onPress={sheet.open}
        accessibilityLabel={`Khu vực: ${city ?? "Cả nước"}. Đổi khu vực`}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: 6, flexShrink: 1 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, height: 32, paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: colors.subtle }}>
          <Icon name="pin" size={14} />
          <Txt v="meta" w={600} numberOfLines={1} style={{ flexShrink: 1 }}>
            {city ?? "Cả nước"}
          </Txt>
          <Icon name="down" size={12} color={colors.muted} />
        </View>
      </Press>
      <IconButton name="chat" label="Tin nhắn" badge={me.unreadMessages} onPress={() => needSignIn("/tin-nhan")} />
      <IconButton name="bell" label="Thông báo" badge={me.unreadNotifications} onPress={() => needSignIn("/thong-bao")} />

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
