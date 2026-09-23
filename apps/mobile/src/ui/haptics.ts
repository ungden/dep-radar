import * as Haptics from "expo-haptics"

/**
 * Haptics only where something happened: a choice was made, a request went
 * through, or it failed. An ordinary tap (open a screen, go back) stays silent.
 */
export const haptic = {
  select: () => void Haptics.selectionAsync().catch(() => {}),
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
}
