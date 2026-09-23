import * as React from "react"
import Constants from "expo-constants"
import * as Notifications from "expo-notifications"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"
import { openLink } from "./routes"
import { rpcOptional } from "./supabase"

/**
 * Push notifications.
 *
 * Permission is asked lazily, at a moment the reason is obvious (right after
 * booking, or when a freelancer opens "Hôm nay"), never on first launch. Once
 * granted, and after every sign-in, the Expo push token is sent to the
 * database with register_push_token(p_token, p_platform).
 *
 * TODO(db): register_push_token and the push_tokens table are being added in
 * parallel; until they exist the call is skipped quietly. Sending (an Edge
 * Function or cron reading push_tokens) is server work.
 *
 * The token needs the EAS projectId from app.json `expo.extra.eas.projectId`
 * (the owner's Expo account). Without it nothing is registered.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
})

const SENT_KEY = "dep360_push_sent"

function projectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null
}

export async function askForPushPermission(uid?: string | null): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync()
    let granted = current.granted
    if (!granted && current.canAskAgain) {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", { name: "Lịch hẹn", importance: Notifications.AndroidImportance.HIGH })
      }
      granted = (await Notifications.requestPermissionsAsync()).granted
    }
    if (granted && uid) void registerPushToken(uid)
    return granted
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

/** Sends this phone's token for the signed-in person. Never asks for permission itself. */
export async function registerPushToken(uid: string): Promise<void> {
  try {
    if (!(await pushPermissionGranted())) return
    const id = projectId()
    if (!id) {
      if (__DEV__) console.warn("push: no EAS projectId in app.json extra.eas.projectId; token not registered")
      return
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id })
    // Once per person and token; a new sign-in or a new token sends again.
    const sent = await SecureStore.getItemAsync(SENT_KEY)
    if (sent === `${uid}:${token}`) return
    const res = await rpcOptional("register_push_token", { p_token: token, p_platform: Platform.OS })
    if (res.ok) await SecureStore.setItemAsync(SENT_KEY, `${uid}:${token}`)
  } catch {
    // Simulators have no push token; nothing to register.
  }
}

export async function forgetPushToken() {
  // TODO(db): no unregister RPC yet; the server should drop tokens of signed-out
  // devices when Expo reports them as DeviceNotRegistered.
  await SecureStore.deleteItemAsync(SENT_KEY).catch(() => {})
}

let handled: string | null = null

/** A tap on a push opens what it is about: `data.link` is a web path, mapped to the native screen. */
export function useNotificationTaps(ready: boolean) {
  React.useEffect(() => {
    if (!ready) return
    const handle = (response: Notifications.NotificationResponse | null) => {
      if (!response) return
      const id = response.notification.request.identifier
      if (handled === id) return
      handled = id
      const link = (response.notification.request.content.data as { link?: unknown } | undefined)?.link
      if (typeof link === "string") openLink(link)
    }
    handle(Notifications.getLastNotificationResponse())
    const sub = Notifications.addNotificationResponseReceivedListener(handle)
    return () => sub.remove()
  }, [ready])
}
