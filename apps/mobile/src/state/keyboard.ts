import * as React from "react"
import { useIsFocused } from "expo-router"
import { AppState, Keyboard, Platform } from "react-native"

/** True while the software keyboard is up: a bar pinned to the bottom drops its home-indicator padding then. */
export function useKeyboardVisible() {
  const [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setVisible(true))
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setVisible(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])
  return visible
}

/**
 * The current time, ticking every second only while `active` (a countdown is
 * on screen), the screen is focused and the app is in the foreground.
 */
export function useNow(active: boolean) {
  const focused = useIsFocused()
  const [now, setNow] = React.useState(() => Date.now())
  const [foreground, setForeground] = React.useState(AppState.currentState === "active")
  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => setForeground(s === "active"))
    return () => sub.remove()
  }, [])
  const ticking = active && focused && foreground
  React.useEffect(() => {
    if (!ticking) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [ticking])
  return now
}
