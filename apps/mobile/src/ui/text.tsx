import { Text, type TextProps, type TextStyle } from "react-native"
import { colors, fontSize, fonts, type Weight } from "@/theme"

type Variant = "hero" | "h1" | "h2" | "title" | "lead" | "body" | "meta" | "label"

const VARIANTS: Record<Variant, { size: number; line: number; weight: Weight; track?: number }> = {
  hero: { size: fontSize.hero, line: 50, weight: 800, track: -1.2 },
  h1: { size: fontSize.h1, line: 38, weight: 800, track: -0.8 },
  h2: { size: fontSize.h2, line: 30, weight: 800, track: -0.5 },
  title: { size: fontSize.title, line: 26, weight: 700, track: -0.3 },
  lead: { size: fontSize.lead, line: 24, weight: 600, track: -0.2 },
  body: { size: fontSize.body, line: 22, weight: 400 },
  meta: { size: fontSize.meta, line: 18, weight: 400 },
  // Only for tiny secondary tags; nothing someone needs to read.
  label: { size: fontSize.label, line: 16, weight: 600 },
}

export interface TxtProps extends TextProps {
  v?: Variant
  w?: Weight
  color?: string
  center?: boolean
  tabular?: boolean
}

/** All text in the app. Body is 15, nothing a person reads goes under 13. */
export function Txt({ v = "body", w, color = colors.ink, center, tabular, style, ...rest }: TxtProps) {
  const spec = VARIANTS[v]
  const base: TextStyle = {
    fontFamily: fonts[w ?? spec.weight],
    fontSize: spec.size,
    lineHeight: spec.line,
    letterSpacing: spec.track ?? 0,
    color,
    textAlign: center ? "center" : undefined,
    fontVariant: tabular ? ["tabular-nums"] : undefined,
  }
  return <Text maxFontSizeMultiplier={1.4} {...rest} style={[base, style]} />
}
