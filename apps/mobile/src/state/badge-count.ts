import * as React from "react"
import { AppState } from "react-native"

/**
 * A count for a tab badge: read now, every minute while the app is open, and
 * when it comes back to the foreground. Failures keep the last count.
 */
export function useBadgeCount(load: (() => Promise<number>) | null, key: unknown) {
  const [count, setCount] = React.useState(0)
  const loadRef = React.useRef(load)
  loadRef.current = load
  React.useEffect(() => {
    if (!load) return setCount(0)
    let live = true
    const read = () => void loadRef.current?.().then((n) => { if (live) setCount(n) }).catch(() => {})
    read()
    const t = setInterval(read, 60_000)
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") read() })
    return () => {
      live = false
      clearInterval(t)
      sub.remove()
    }
  }, [key, Boolean(load)])
  return count
}
