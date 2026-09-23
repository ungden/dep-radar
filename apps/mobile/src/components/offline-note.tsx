import { View } from "react-native"
import { formatDay, localDate, localTime } from "@/data/format"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** Shown while the screen is the copy saved on the phone because the network failed. Tap to try again. */
export function OfflineNote() {
  const { offlineSince, refresh, loading } = useApp()
  if (!offlineSince) return null
  const saved = new Date(offlineSince)
  return (
    <Press
      onPress={() => void refresh()}
      disabled={loading}
      accessibilityLabel="Đang offline. Chạm để thử lại"
      style={{ marginHorizontal: gutter, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.warningSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10 }}
    >
      <Icon name="wifiOff" size={18} color={colors.warning} />
      <View style={{ flex: 1 }}>
        <Txt v="meta" w={700} color={colors.warning}>
          Đang offline
        </Txt>
        <Txt v="meta" color={colors.warning}>
          Đang xem bản lưu lúc {localTime(saved)}, {formatDay(localDate(saved)).toLowerCase()}. Chạm để thử lại.
        </Txt>
      </View>
    </Press>
  )
}
