"use client"

import * as React from "react"
import { claimOwnClient, logProVisit, type OwnChannel } from "@/lib/api/actions"
import { useApp } from "@/lib/store"

/**
 * A partner's own QR code (the portfolio pictures) opens /pros/<slug>?src=qr,
 * their booking link /pros/<slug>?src=link. The visit is counted, and which
 * partner brought this visitor is kept on this device for 30 days: once the
 * visitor is signed in it is claimed for them, once, and forgotten whatever
 * the answer. The database decides whether it counts (claim_own_client): a
 * customer who already booked that partner through 360đẹp does not.
 */
const KEY = "dep360_src"
const DAYS = 30

type Kept = { slug: string; channel: OwnChannel; at: number }

function read(): Kept | null {
  try {
    const kept = JSON.parse(localStorage.getItem(KEY) ?? "null") as Kept | null
    return kept && Date.now() - kept.at < DAYS * 86_400_000 ? kept : null
  } catch {
    return null
  }
}

function forget() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing stored, nothing to forget.
  }
}

export function OwnClientCapture() {
  const { session } = useApp()
  const tried = React.useRef(false)

  // Read once, on arrival. The parameter is then taken off the address, so a
  // reload is not a second visit and the page's own link stays clean.
  React.useEffect(() => {
    const url = new URL(window.location.href)
    const channel = url.searchParams.get("src")
    const slug = url.pathname.match(/^\/pros\/([^/]+)\/?$/)?.[1]
    if (!slug || (channel !== "qr" && channel !== "link")) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ slug: decodeURIComponent(slug), channel, at: Date.now() } satisfies Kept))
    } catch {
      // Private browsing: the visit still counts, the claim cannot wait for a sign-in.
    }
    void logProVisit(decodeURIComponent(slug), channel)
    url.searchParams.delete("src")
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash)
  }, [])

  React.useEffect(() => {
    if (tried.current || !session) return
    const kept = read()
    if (!kept) return forget()
    tried.current = true
    void claimOwnClient(kept.slug, kept.channel).then((result) => {
      // A network failure keeps it for the next page; any answer ends it.
      if (result.ok || !/mạng|network|fetch/i.test(result.error)) forget()
    })
  }, [session])

  return null
}
