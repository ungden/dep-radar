import * as React from "react"
import { Image } from "expo-image"
import { Text, View, type StyleProp, type ViewStyle } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"
import { initials, formatRating } from "@/data/format"
import Svg, { Path, Rect } from "react-native-svg"
import {
  BRAND_DARK,
  BRAND_GOLD,
  LOGO_EYE_PATH,
  LOGO_EYE_STROKE,
  LOGO_EYE_STROKE_SMALL,
  LOGO_RADIUS,
  WORDMARK_BOX,
  WORDMARK_PATH,
  showsAverage,
} from "@/shared"
import { aspect, colors, radius } from "@/theme"
import { Button } from "./button"
import { Icon } from "./icon"
import { Press } from "./press"
import { Txt } from "./text"

/** A photo. Always a fixed ratio (4:5 unless told otherwise), never text on top. */
export function Photo({
  uri,
  ratio = aspect.photo,
  style,
  rounded = radius.md,
  recyclingKey,
}: {
  uri?: string
  ratio?: number
  style?: StyleProp<ViewStyle>
  rounded?: number
  recyclingKey?: string
}) {
  return (
    <View style={[{ aspectRatio: ratio, borderRadius: rounded, overflow: "hidden", backgroundColor: colors.subtle }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ flex: 1 }}
          contentFit="cover"
          transition={150}
          recyclingKey={recyclingKey}
          cachePolicy="memory-disk"
          accessible={false}
        />
      ) : null}
    </View>
  )
}

export function Avatar({ name, uri, tone = colors.subtle, size = 40 }: { name: string; uri?: string; tone?: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={150} accessible={false} />
      ) : (
        <Txt w={700} color={colors.inkSoft} style={{ fontSize: Math.max(13, size * 0.36), lineHeight: Math.max(16, size * 0.44) }}>
          {initials(name)}
        </Txt>
      )}
    </View>
  )
}

/** A chip. Selected is rose with white text, like every selected state. */
export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: React.ReactNode }) {
  return (
    <Press
      onPress={onPress}
      haptic="select"
      accessibilityState={{ selected }}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: radius.full,
        backgroundColor: selected ? colors.accent : colors.subtle,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon}
      <Txt v="meta" w={600} color={selected ? colors.surface : colors.ink} numberOfLines={1}>
        {label}
      </Txt>
    </Press>
  )
}

export function VerifiedMark({ size = 15 }: { size?: number }) {
  return <Icon name="verified" size={size} color={colors.ink} />
}

/**
 * "★ 4,9 (23)", or "Mới" below MIN_REVIEWS_FOR_AVERAGE reviews: one or two
 * reviews make an average that says more about luck than about the work.
 */
export function Rating({ average, count, showCount = true }: { average: number; count: number; showCount?: boolean }) {
  if (!showsAverage(count))
    return (
      <Txt v="meta" w={600} color={colors.inkSoft}>
        Mới
        {showCount && count > 0 ? <Txt v="meta" color={colors.muted}> · {count} đánh giá</Txt> : null}
      </Txt>
    )
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      <Icon name="star" size={13} color={colors.ink} />
      <Txt v="meta" w={600} tabular>
        {formatRating(average)}
      </Txt>
      {showCount ? (
        <Txt v="meta" color={colors.muted} tabular>
          ({count})
        </Txt>
      ) : null}
    </View>
  )
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Txt v="title" w={700} style={{ flexShrink: 1 }}>
        {title}
      </Txt>
      {action ? (
        <Press onPress={onAction} hitSlop={10} accessibilityLabel={action}>
          <Txt v="meta" w={600} color={colors.inkSoft}>
            {action}
          </Txt>
        </Press>
      ) : null}
    </View>
  )
}

/** Says what is true and offers one thing to do. */
export function EmptyState({ title, text, action, onAction }: { title: string; text?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ paddingVertical: 32, paddingHorizontal: 8, alignItems: "center", gap: 8 }}>
      <Txt v="lead" w={700} center>
        {title}
      </Txt>
      {text ? (
        <Txt color={colors.inkSoft} center style={{ maxWidth: 320 }}>
          {text}
        </Txt>
      ) : null}
      {action ? <Button label={action} onPress={onAction} style={{ marginTop: 8, alignSelf: "center" }} /> : null}
    </View>
  )
}

/** A grey block that breathes while the real card loads. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.55)
  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true)
  }, [opacity])
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ backgroundColor: colors.subtle, borderRadius: radius.sm }, style, animated]} />
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.line }, style]} />
}

/** The 360đẹp mark: a champagne closed eye on espresso. Same outline as the web (lib/design/brand.ts). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={LOGO_RADIUS} fill={BRAND_DARK} />
      <Path
        d={LOGO_EYE_PATH}
        fill="none"
        stroke={BRAND_GOLD}
        strokeWidth={size < 24 ? LOGO_EYE_STROKE_SMALL : LOGO_EYE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/** "360đẹp" in Noto Serif Display, from the same outline as the web header. */
export function Wordmark({ size = 24, tone = "dark" }: { size?: number; tone?: "dark" | "gold" }) {
  const height = size * 0.92
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="360đẹp">
      <Svg height={height} width={(height * WORDMARK_BOX.width) / WORDMARK_BOX.height} viewBox={`0 0 ${WORDMARK_BOX.width} ${WORDMARK_BOX.height}`}>
        <Path d={WORDMARK_PATH} fill={tone === "gold" ? BRAND_GOLD : BRAND_DARK} />
      </Svg>
    </View>
  )
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }} accessibilityLabel="360đẹp">
      <LogoMark size={size} />
      <Wordmark size={size * 0.8} />
    </View>
  )
}

/** A label/value line in a summary. */
export function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 4 }}>
      <Txt color={strong ? colors.ink : colors.inkSoft} w={strong ? 700 : 400} style={{ flexShrink: 1 }}>
        {label}
      </Txt>
      <Txt w={strong ? 800 : 500} tabular>
        {value}
      </Txt>
    </View>
  )
}

/** A block on a white surface, separated from the next by space, not a shadow. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, gap: 8 }, style]}>{children}</View>
}

export function ErrorNote({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <View style={{ backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 14, gap: 8 }}>
      <Txt color={colors.danger} selectable>
        {text}
      </Txt>
      {onRetry ? <Button label="Thử lại" size="sm" variant="secondary" onPress={onRetry} /> : null}
    </View>
  )
}
