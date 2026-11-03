import { StyleSheet } from "react-native"
import { aspect, colors as sharedColors, fontSize, motion, radius, space } from "@/shared"

/** The shared tokens (lib/design/tokens.ts), plus what only the app needs. */
export { aspect, fontSize, motion, radius, space }

/**
 * A native grouped background: white cards stand out from it by themselves, so
 * they need no border. Lines are a hair thick, and that much darker to show.
 */
export const colors = { ...sharedColors, canvas: "#F3F0EA", line: "#D9D2C7" }
export const hairline = StyleSheet.hairlineWidth

/** Inter, as on the web; loaded in app/_layout.tsx. A custom font ignores fontWeight, so each weight is its own family. */
export const fonts = {
  400: "Inter_400Regular",
  500: "Inter_500Medium",
  600: "Inter_600SemiBold",
  700: "Inter_700Bold",
  800: "Inter_800ExtraBold",
} as const

export type Weight = keyof typeof fonts


/** Side gutter of every screen. */
export const gutter = 20

/** Dense selection controls have their own type scale; reading text keeps full Dynamic Type. */
export const controlMetrics = {
  fontSize: 17,
  lineHeight: 23,
  metaFontSize: 15,
  metaLineHeight: 21,
  maxFontSizeMultiplier: 1.35,
  minHeight: 48,
  paddingVertical: 8,
} as const

/** Photos: 16pt corners everywhere, 4:5 for work, 1:1 for small thumbnails. */
export const photoRadius = 16

/**
 * A white card on the grouped background: the photo inside does the lifting. Cards group a photo with what it costs
 * and who does it.
 */
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
} as const
