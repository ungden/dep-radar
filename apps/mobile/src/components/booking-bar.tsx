import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, gutter } from "@/theme"
import { Button } from "@/ui/button"
import { Txt } from "@/ui/text"

/** The price and the one main action, stuck to the bottom of the screen. */
export function BookingBar({
  title,
  note,
  action,
  onPress,
  disabled,
  busy,
}: {
  /** Already formatted, e.g. "Từ 250.000đ" or "Tổng 330.000đ". */
  title: string | null
  note?: string
  action: string
  onPress: () => void
  disabled?: boolean
  busy?: boolean
}) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingHorizontal: gutter,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 12),
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        {title ? (
          <Txt v="lead" w={800} tabular numberOfLines={1}>
            {title}
          </Txt>
        ) : null}
        {note ? (
          <Txt v="meta" color={colors.inkSoft} numberOfLines={2}>
            {note}
          </Txt>
        ) : null}
      </View>
      <Button label={action} onPress={onPress} disabled={disabled} busy={busy} size="lg" />
    </View>
  )
}
