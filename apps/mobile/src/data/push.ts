import * as React from "react"
import Constants from "expo-constants"
import * as Notifications from "expo-notifications"
import * as SecureStore from "expo-secure-store"
import { AppState, Platform } from "react-native"
import { isThreadOpen } from "./chat"
import { openLink } from "./routes"
import { rpcOptional, supabase } from "./supabase"

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
  handleNotification: async (notification) => {
    // A new message in the conversation already on screen: it is right there.
    const link = (notification.request.content.data as { link?: unknown } | undefined)?.link
    const thread = typeof link === "string" ? link.match(/\/tin-nhan\/([0-9a-f-]{36})$/i)?.[1] : undefined
    const quiet = Boolean(thread && isThreadOpen(thread))
    return { shouldShowBanner: !quiet, shouldShowList: !quiet, shouldPlaySound: !quiet, shouldSetBadge: false }
  },
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

let pending = Promise.resolve()
let signingOut = false

function serial(work: () => Promise<void>) {
  pending = pending.then(work, work)
  return pending
}

/** Refresh the lease without asking for permissions on app open. */
export function registerPushToken(uid: string): Promise<void> {
  if (signingOut) return Promise.resolve()
  return serial(async () => {
    try {
      const session = await supabase.auth.getSession()
      if (session.data.session?.user.id !== uid || !(await pushPermissionGranted())) return
      const id = projectId()
      if (!id) return
      let timer: ReturnType<typeof setTimeout> | undefined
      const result = await Promise.race([
        Notifications.getExpoPushTokenAsync({ projectId: id }),
        new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 3000) }),
      ]).finally(() => { if (timer) clearTimeout(timer) })
      if (!result || signingOut) return
      const token = result.data
      const marker = `${uid}:${token}`
      const sent = await SecureStore.getItemAsync(SENT_KEY)
      if (sent?.startsWith(marker + ":") && Date.now() - Number(sent.slice(marker.length + 1)) < 12 * 3600_000) return
      const abort = new AbortController()
      const deadline = setTimeout(() => abort.abort(), 2500)
      try {
        const { error } = await supabase.rpc("register_push_token_v2", { p_token: token, p_platform: Platform.OS }).abortSignal(abort.signal)
        if (!error) await SecureStore.setItemAsync(SENT_KEY, `${marker}:${Date.now()}`)
      } finally { clearTimeout(deadline) }
    } catch {
      // Foregrounding the app tries again.
    }
  })
}

export function watchPushLease(uid: string) {
  const sub = AppState.addEventListener("change", (state) => { if (state === "active") void registerPushToken(uid) })
  return () => sub.remove()
}

export async function signOutPush() {
  signingOut = true
  try {
    await serial(async () => {
      const sent = await SecureStore.getItemAsync(SENT_KEY).catch(() => null)
      const token = sent?.match(/Expo(?:nent)?PushToken\[[A-Za-z0-9_-]+\]/)?.[0]
      if (token) {
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
          await Promise.race([
            rpcOptional("unregister_push_token", { p_token: token }),
            new Promise<void>((resolve) => { timer = setTimeout(resolve, 2500) }),
          ])
        } catch { /* Offline: the server uses a generic alert and the token lease expires. */ }
        finally { if (timer) clearTimeout(timer) }
      }
      await SecureStore.deleteItemAsync(SENT_KEY).catch(() => {})
      await Notifications.dismissAllNotificationsAsync().catch(() => {})
      await Notifications.clearLastNotificationResponseAsync().catch(() => {})
    })
    await supabase.auth.signOut({ scope: "local" })
  } finally { signingOut = false }
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
