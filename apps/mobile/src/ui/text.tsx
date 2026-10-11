import { StyleSheet, Text, useWindowDimensions, type TextProps, type TextStyle } from "react-native"
import { colors, fontSize, fonts, type Weight } from "@/theme"

type Variant = "hero" | "h1" | "h2" | "title" | "lead" | "body" | "meta" | "label"

const VARIANTS: Record<Variant, { size: number; line: number; weight: Weight; track?: number }> = {
  hero: { size: fontSize.hero, line: 50, weight: 800, track: -1.2 },
  h1: { size: fontSize.h1, line: 38, weight: 800, track: -0.8 },
  h2: { size: fontSize.h2, line: 30, weight: 800, track: -0.5 },
  title: { size: fontSize.title, line: 30, weight: 700, track: -0.3 },
  lead: { size: fontSize.lead, line: 24, weight: 600, track: -0.2 },
  body: { size: fontSize.body, line: 26, weight: 400 },
  meta: { size: fontSize.meta, line: 21, weight: 400 },
  // Compact tags and control labels use the same readable 14px baseline.
  label: { size: fontSize.label, line: 20, weight: 600 },
}

export interface TxtProps extends TextProps {
  v?: Variant
  w?: Weight
  color?: string
  center?: boolean
  tabular?: boolean
}

/** All text in the app. Body is 17; labels stay readable and respect system text size. */
export function Txt({ v = "body", w, color = colors.ink, center, tabular, style, ...rest }: TxtProps) {
  const spec = VARIANTS[v]
  const { fontScale } = useWindowDimensions()
  const override = StyleSheet.flatten(style)
  const scale = rest.allowFontScaling === false ? 1 : fontScale
  const multiplier = rest.maxFontSizeMultiplier && rest.maxFontSizeMultiplier > 0 ? Math.min(scale, rest.maxFontSizeMultiplier) : scale
  const base: TextStyle = {
    fontFamily: fonts[w ?? spec.weight],
    fontSize: spec.size,
    lineHeight: spec.line,
    letterSpacing: spec.track ?? 0,
    color,
    textAlign: center ? "center" : undefined,
    fontVariant: tabular ? ["tabular-nums"] : undefined,
  }
  // Scale the line box with the font. iOS can otherwise enlarge the custom
  // font while leaving an explicit lineHeight unchanged, clipping every line.
  // Native scaling is disabled only to avoid applying this same system scale twice.
  return <Text {...rest} allowFontScaling={false} style={[base, style, {
    fontSize: (override?.fontSize ?? spec.size) * multiplier,
    lineHeight: (override?.lineHeight ?? spec.line) * multiplier,
  }]} />
}
