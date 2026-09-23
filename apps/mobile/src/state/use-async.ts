import * as React from "react"
import { useFocusEffect } from "expo-router"

/**
 * A read that belongs to one screen: loads when the screen gains focus,
 * refreshes on pull, and keeps the last good value while it reloads.
 */
export function useAsync<T>(load: (() => Promise<T>) | null, deps: React.DependencyList) {
  const [value, setValue] = React.useState<T | undefined>(undefined)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(Boolean(load))
  const [refreshing, setRefreshing] = React.useState(false)
  const loadRef = React.useRef(load)
  loadRef.current = load

  const run = React.useCallback(async (pull = false) => {
    const fn = loadRef.current
    if (!fn) {
      setLoading(false)
      return
    }
    if (pull) setRefreshing(true)
    try {
      setValue(await fn())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, deps)

  useFocusEffect(
    React.useCallback(() => {
      void run()
    }, [run]),
  )

  return { value, error, loading, refreshing, reload: () => run(false), refresh: () => run(true), setValue }
}
