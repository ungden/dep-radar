"use client"

import * as React from "react"

/**
 * One polite live region for the whole app.
 *
 * Most of what this product does — a booking sent, a price saved, a job accepted —
 * changed only the pixels. A screen reader user got silence. Errors were already
 * announced because they render with role="alert"; this covers the successes, and
 * shows a brief toast for everyone else.
 */
const AnnounceContext = React.createContext<(message: string) => void>(() => {})

export function useAnnounce() {
  return React.useContext(AnnounceContext)
}

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = React.useState("")
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const announce = React.useCallback((next: string) => {
    if (!next) return
    if (timer.current) clearTimeout(timer.current)
    // Clearing first makes a repeated message announce again.
    setMessage("")
    requestAnimationFrame(() => setMessage(next))
    timer.current = setTimeout(() => setMessage(""), 4000)
  }, [])

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
      {message && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8">
          <p className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-lg">{message}</p>
        </div>
      )}
    </AnnounceContext.Provider>
  )
}
