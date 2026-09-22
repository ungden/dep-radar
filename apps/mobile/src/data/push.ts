import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

/**
 * Push notifications, permission only.
 *
 * TODO(push): the database has no table for device tokens yet, so nothing is
 * registered server-side and no push is ever sent. When a `push_tokens` table
 * (account_id, token, platform) and a sender exist, fetch the Expo push token
 * here (needs the EAS projectId) and upsert it. See apps/mobile/README.md.
 *
 * Asked lazily, at a moment the reason is obvious (right after booking, or
 * when a freelancer opens "Hôm nay"), never on first launch.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
})

export async function askForPushPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync()
    if (current.granted) return true
    if (!current.canAskAgain) return false
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "Lịch hẹn", importance: Notifications.AndroidImportance.HIGH })
    }
    const asked = await Notifications.requestPermissionsAsync()
    return asked.granted
  } catch {
    return false
  }
}

export async function pushPermissionGranted(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted
  } catch {
    return false
  }
}
