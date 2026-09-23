import { RefreshControl } from "react-native"
import { colors } from "@/theme"

/** Pull to refresh, in the brand rose on both platforms. */
export function refreshControl(refreshing: boolean, onRefresh: () => void) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.accent}
      colors={[colors.accent]}
      progressBackgroundColor={colors.surface}
    />
  )
}
