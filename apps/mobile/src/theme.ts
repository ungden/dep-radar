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
