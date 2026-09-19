"use client"

import * as React from "react"

/** Retires service workers and caches left by pre-native dep360 releases. */
export function UnregisterServiceWorker() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
      if ("caches" in window) {
        const names = await caches.keys()
        await Promise.all(names.filter((name) => name.startsWith("dep360-")).map((name) => caches.delete(name)))
      }
    })()
  }, [])

  return null
}
