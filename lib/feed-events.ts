"use client"

import type { WorkEventKind } from "./types"

/**
 * Counts what people look at, open, save and try to book, so the feed can
 * learn which posts actually interest someone (lib/feed.ts, "appeal").
 *
 * Only counts leave the browser: a post id and what happened, no user id.
 * Events are batched and sent at most every few seconds, and when the page is
 * hidden, so scrolling a feed is one request rather than fifty.
 */
type Sender = (events: { work: string; kind: WorkEventKind }[]) => Promise<unknown>

const FLUSH_MS = 4000
const MAX_BATCH = 60

let queue: { work: string; kind: WorkEventKind }[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let sender: Sender | null = null
/** An impression is counted once per post per page view. */
const seen = new Set<string>()

export function setWorkEventSender(send: Sender) {
  sender = send
}

function flush() {
  timer = null
  if (!queue.length || !sender) return
  const batch = queue.slice(0, MAX_BATCH)
  queue = queue.slice(MAX_BATCH)
  // Losing a count is fine; breaking the page over one is not.
  void sender(batch).catch(() => {})
  if (queue.length) schedule()
}

function schedule() {
  if (!timer) timer = setTimeout(flush, FLUSH_MS)
}

export function trackWork(workDbId: string, kind: WorkEventKind) {
  if (typeof window === "undefined") return
  if (kind === "impression") {
    if (seen.has(workDbId)) return
    seen.add(workDbId)
  }
  queue.push({ work: workDbId, kind })
  schedule()
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush()
  })
}
