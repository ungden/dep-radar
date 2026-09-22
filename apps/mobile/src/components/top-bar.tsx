import { router } from "expo-router"
import { View } from "react-native"
import { CITIES } from "@/shared"
import { useApp } from "@/state/app"
import { colors, gutter } from "@/theme"
import { LogoMark } from "@/ui/bits"
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
      <LogoMark size={28} />
      <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}>
        <IconButton name="chat" label="Tin nhắn" badge={me.unreadMessages} onPress={() => needSignIn("/tin-nhan")} />
        <IconButton name="bell" label="Thông báo" badge={me.unreadNotifications} onPress={() => needSignIn("/thong-bao")} />
      </View>

      <Sheet sheet={sheet} title="Bạn đang ở đâu?">
        {[null, ...CITIES].map((c) => {
          const selected = c === city
          return (
            <Press
              key={c ?? "all"}
              onPress={() => {
                setCity(c)
                sheet.close()
              }}
              accessibilityState={{ selected }}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 }}
            >
              <Txt v="lead" w={selected ? 700 : 500}>
                {c ?? "Cả nước"}
              </Txt>
              {selected ? <Icon name="check" size={18} /> : null}
            </Press>
          )
        })}
      </Sheet>
    </View>
  )
}
