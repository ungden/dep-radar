import { aspect, colors, fontSize, motion, radius, space } from "@/shared"

/** The shared tokens (lib/design/tokens.ts), plus what only the app needs. */
export { aspect, colors, fontSize, motion, radius, space }

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
export const gutter = space[4]

/** Dense selection controls have their own type scale; reading text keeps full Dynamic Type. */
export const controlMetrics = {
  fontSize: 16,
  lineHeight: 22,
  metaFontSize: 14,
  metaLineHeight: 20,
  maxFontSizeMultiplier: 1.35,
  minHeight: 48,
  paddingVertical: 8,
} as const

/**
 * A white card lifted just off the warm page, the web's --shadow-soft. Cards
 * group a photo with what it costs and who does it.
 */
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  shadowColor: "#141213",
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const
