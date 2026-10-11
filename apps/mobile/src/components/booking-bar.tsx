import { View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Txt } from "@/ui/text"

/** The price and the one main action, stuck to the bottom of the screen. */
export function BookingBar({
  title,
  summaryLabel,
  note,
  action,
  onPress,
  disabled,
  busy,
  inline,
  keyboard,
  actionOnly = false,
}: {
  /** Already formatted, e.g. "Từ 250.000đ" or "Tổng 330.000đ". */
  title: string | null
  /** A short label above the formatted price, e.g. "Tổng tạm tính". */
  summaryLabel?: string
  note?: string
  action: string
  onPress: () => void
  disabled?: boolean
  busy?: boolean
  /** Laid out after the content instead of floating over it (inside a keyboard-avoiding screen). */
  inline?: boolean
  /** The keyboard is up: no home-indicator padding. */
  keyboard?: boolean
  /** Keep only the action here when the summary belongs in the scrollable content. */
  actionOnly?: boolean
}) {
  const insets = useSafeAreaInsets()
  const { width, fontScale } = useWindowDimensions()
  const stacked = actionOnly || fontScale > 1.2 || width < 360
  return (
    <View
      style={{
        ...(inline ? null : { position: "absolute", left: 0, right: 0, bottom: 0 }),
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingHorizontal: gutter,
        paddingTop: 12,
        paddingBottom: keyboard ? 12 : Math.max(insets.bottom, 12),
        flexDirection: stacked ? "column" : "row",
        alignItems: stacked ? "stretch" : "center",
        gap: 12,
      }}
    >
      {!actionOnly && (summaryLabel || title || note) ? (
        <View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 2 }}>
          {summaryLabel ? (
            <Txt v="meta" color={colors.inkSoft}>
              {summaryLabel}
            </Txt>
          ) : null}
          {title ? (
            <Txt v="lead" w={700} tabular>
              {title}
            </Txt>
          ) : null}
          {note ? (
            <Txt v="meta" color={colors.inkSoft}>
              {note}
            </Txt>
          ) : null}
        </View>
      ) : null}
      <Button
        label={action}
        onPress={onPress}
        disabled={disabled}
        busy={busy}
        size="lg"
        full={stacked}
        style={{
          minHeight: 56,
          borderRadius: radius.md,
          paddingHorizontal: 16,
          paddingVertical: 12,
          ...(stacked ? null : { maxWidth: "52%" }),
        }}
      />
    </View>
  )
}
