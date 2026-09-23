import { aspect, colors, fontSize, motion, radius, space } from "@/shared"

/** The shared tokens (lib/design/tokens.ts), plus what only the app needs. */
export { aspect, colors, fontSize, motion, radius, space }

/** Be Vietnam Pro, loaded in app/_layout.tsx. A custom font ignores fontWeight, so each weight is its own family. */
export const fonts = {
  400: "BeVietnamPro_400Regular",
  500: "BeVietnamPro_500Medium",
  600: "BeVietnamPro_600SemiBold",
  700: "BeVietnamPro_700Bold",
  800: "BeVietnamPro_800ExtraBold",
} as const

export type Weight = keyof typeof fonts

/** Side gutter of every screen. */
export const gutter = space[4]

/**
 * A white card lifted just off the warm page, the web's --shadow-soft. Cards
 * group a photo with what it costs and who does it.
 */
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  shadowColor: "#3A2A2C",
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const
