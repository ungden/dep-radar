const INTERNAL_SOURCE_PATTERN = /^https:\/\/(?:www\.)?360dep\.vn(?:\/|$)/i

export function getTikTokPostId(sourceUrl: string | null | undefined) {
  if (!sourceUrl) return null
  try {
    const url = new URL(sourceUrl)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== "https:" || (host !== "tiktok.com" && !host.endsWith(".tiktok.com"))) return null
    return url.pathname.match(/^\/@[^/]+\/(?:video|photo)\/(\d{8,30})\/?$/)?.[1] ?? null
  } catch {
    return null
  }
}

export function isDirectTikTokPostUrl(sourceUrl: string | null | undefined, expectedPostId?: string | null) {
  const postId = getTikTokPostId(sourceUrl)
  return Boolean(postId && (!expectedPostId || postId === expectedPostId))
}

export function isDirectCreatorEvidenceSource(
  platform: string,
  sourceUrl: string | null | undefined,
  sourcePostId?: string | null,
) {
  if (!sourceUrl?.startsWith("https://") || INTERNAL_SOURCE_PATTERN.test(sourceUrl) || !sourcePostId) return false
  if (platform.toLowerCase().includes("tiktok")) return isDirectTikTokPostUrl(sourceUrl, sourcePostId)
  return true
}
