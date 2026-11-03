import { StyleSheet, Text, useWindowDimensions, type TextProps, type TextStyle } from "react-native"
import { colors, controlMetrics, fonts, type Weight } from "@/theme"

type Variant = "hero" | "h1" | "h2" | "title" | "lead" | "body" | "meta" | "label" | "control" | "controlMeta"

/**
 * The app's type scale, raised on 03/11/2026 because the owner found it hard
 * to read: 17 body as on iOS, nothing under 15 in running text, headings
 * 20-30, heavy weights only where a screen needs one loud line.
 */
const VARIANTS: Record<Variant, { size: number; line: number; weight: Weight; track?: number; maxScale?: number }> = {
  hero: { size: 36, line: 42, weight: 700, track: -0.8 },
  h1: { size: 30, line: 36, weight: 700, track: -0.5 },
  h2: { size: 24, line: 30, weight: 700, track: -0.3 },
  title: { size: 20, line: 26, weight: 600, track: -0.2 },
  lead: { size: 18, line: 26, weight: 600, track: -0.1 },
  body: { size: 17, line: 25, weight: 400 },
  meta: { size: 15, line: 21, weight: 400 },
  // Compact tags and control labels use the same readable baseline.
  label: { size: 15, line: 20, weight: 600 },
  // Opt-in for compact controls, never the default for paragraphs or prices.
  control: { size: controlMetrics.fontSize, line: controlMetrics.lineHeight, weight: 500, maxScale: controlMetrics.maxFontSizeMultiplier },
  controlMeta: { size: controlMetrics.metaFontSize, line: controlMetrics.metaLineHeight, weight: 400, maxScale: controlMetrics.maxFontSizeMultiplier },
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
  const maxScale = rest.maxFontSizeMultiplier ?? spec.maxScale
  const multiplier = maxScale && maxScale > 0 ? Math.min(scale, maxScale) : scale
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
