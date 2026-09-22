/** Only same-site paths, so a crafted link cannot bounce someone to another site. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}
