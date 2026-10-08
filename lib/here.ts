"use client"

import * as React from "react"
import { isLatLng, type LatLng } from "./geo"

/**
 * The customer's own location, from the browser, for "Khoảng cách". It is asked
 * for only when the customer taps "Dùng vị trí hiện tại", kept in this tab
 * (sessionStorage, rounded to about 100 m) and never sent to the server: the
 * distance is worked out here, in the browser.
 */
const KEY = "dep360_here"

let memory: LatLng | null | undefined
const listeners = new Set<() => void>()

function read(): LatLng | null {
  if (memory !== undefined) return memory
  try {
    const raw = window.sessionStorage.getItem(KEY)
    const value: unknown = raw ? JSON.parse(raw) : null
    memory = isLatLng(value) ? value : null
  } catch {
    memory = null
  }
  return memory
}

function write(point: LatLng | null) {
  memory = point
  try {
    if (point) window.sessionStorage.setItem(KEY, JSON.stringify(point))
    else window.sessionStorage.removeItem(KEY)
  } catch {
    // Private mode or storage blocked: it still works for this page.
  }
  for (const l of listeners) l()
}

const subscribe = (onChange: () => void) => {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export type HereStatus = "idle" | "asking" | "denied" | "unavailable"

const round = (n: number) => Math.round(n * 1000) / 1000

export function useHere() {
  const point = React.useSyncExternalStore(subscribe, read, () => null)
  const [status, setStatus] = React.useState<HereStatus>("idle")

  const request = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable")
      return
    }
    setStatus("asking")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        write([round(pos.coords.latitude), round(pos.coords.longitude)])
        setStatus("idle")
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }, [])

  const clear = React.useCallback(() => {
    write(null)
    setStatus("idle")
  }, [])

  return { point, status, request, clear }
}
