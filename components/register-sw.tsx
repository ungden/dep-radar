"use client"

import * as React from "react"

/**
 * Registers the service worker, which exists for one reason: a page requested
 * with no network should say so instead of failing blankly. It caches no data,
 * so it cannot show a stale price or a slot that has since been taken.
 */
export function RegisterServiceWorker() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // A failed registration costs nothing: the app works without it.
      })
    }
    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
  }, [])

  return null
}
