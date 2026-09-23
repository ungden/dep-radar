/**
 * A fixed-window counter per key (an IP, an account), kept in memory.
 *
 * Deliberately simple: on Vercel every function instance has its own map, so
 * this only slows down one client hammering one instance. Supabase Auth's own
 * rate limits (Authentication → Rate Limits) are the real ceiling; this keeps a
 * script from spending them for everyone else.
 */
export function createThrottle({ limit, windowMs, now = Date.now }: { limit: number; windowMs: number; now?: () => number }) {
  const windows = new Map<string, { count: number; resetAt: number }>()
  return {
    /** Counts one attempt; false when this key is over the limit for the current window. */
    take(key: string): boolean {
      const t = now()
      if (windows.size > 10_000) {
        for (const [k, w] of windows) if (w.resetAt <= t) windows.delete(k)
        if (windows.size > 10_000) windows.clear()
      }
      const current = windows.get(key)
      if (!current || current.resetAt <= t) {
        windows.set(key, { count: 1, resetAt: t + windowMs })
        return true
      }
      current.count += 1
      return current.count <= limit
    },
  }
}

/** The caller's IP as the platform reports it (Vercel sets x-forwarded-for). */
export function clientIp(headers: Pick<Headers, "get">): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "unknown"
}
