import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native"
import { colors, radius } from "@/theme"
import { Icon, type IconName } from "./icon"
import { Press } from "./press"
import { Txt } from "./text"

type Variant = "primary" | "secondary" | "ghost" | "danger"

/** The main action is a rose pill. Secondary actions are outlined. */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  busy,
  disabled,
  style,
  full,
}: {
  label: string
  onPress?: () => void
  variant?: Variant
  size?: "sm" | "md" | "lg"
  icon?: IconName
  busy?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  full?: boolean
}) {
  const height = size === "sm" ? 36 : size === "lg" ? 54 : 46
  const bg = variant === "primary" ? colors.accent : variant === "ghost" ? "transparent" : colors.surface
  const fg = variant === "primary" ? colors.surface : variant === "danger" ? colors.danger : colors.ink
  return (
    <Press
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityLabel={label}
      style={[
        {
          height,
          paddingHorizontal: size === "sm" ? 14 : 22,
          borderRadius: radius.full,
          backgroundColor: bg,
          borderWidth: variant === "secondary" || variant === "danger" ? 1 : 0,
          borderColor: colors.line,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: full ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {busy ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} color={fg} /> : null}
        <Txt v={size === "sm" ? "meta" : "body"} w={700} color={fg} numberOfLines={1}>
          {label}
        </Txt>
      </View>
    </Press>
  )
}

/** A round icon button with a 44pt touch target. */
export function IconButton({
  name,
  onPress,
  label,
  color = colors.ink,
  background,
  badge,
  size = 22,
}: {
  name: IconName
  onPress?: () => void
  label: string
  color?: string
  background?: string
  badge?: number
  size?: number
}) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={badge ? `${label}, ${badge} chưa đọc` : label}
      hitSlop={6}
      style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: background }}
    >
      <Icon name={name} size={size} color={color} />
      {badge ? <CountBadge count={badge} style={{ position: "absolute", top: 4, right: 2 }} /> : null}
    </Press>
  )
}

/** Unread count. Accent, because that is one of the three things accent is for. */
export function CountBadge({ count, style }: { count: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          minWidth: 18,
          height: 18,
          paddingHorizontal: 4,
          borderRadius: 9,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: colors.canvas,
        },
        style,
      ]}
    >
      <Txt v="label" w={700} color={colors.surface} style={{ fontSize: 11, lineHeight: 13 }}>
        {count > 99 ? "99+" : count}
      </Txt>
    </View>
  )
}
