import { Platform } from "react-native"
import { colors } from "@/theme"

/**
 * The system tab bar, in the app's colours. iOS keeps its own glass; Android's
 * defaults would hide every label but the selected one and tint the bar from the
 * wallpaper.
 */
export const tabBarProps = {
  tintColor: colors.accent,
  ...(Platform.OS === "android"
    ? { backgroundColor: colors.surface, indicatorColor: colors.accentSoft, labelVisibilityMode: "labeled" as const, iconColor: colors.inkSoft }
    : null),
}
