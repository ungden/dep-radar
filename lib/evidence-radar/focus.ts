import type { CreatorAccount } from "@/lib/types"

type FocusAccount = Pick<CreatorAccount, "platform" | "active" | "collection_mode">

export function canonicalEvidencePlatform(platform: string) {
  const normalized = platform.trim().toLowerCase()
  if (normalized.includes("youtube")) return "youtube"
  if (normalized.includes("instagram")) return "instagram"
  if (normalized.includes("facebook")) return "facebook"
  if (normalized.includes("tiktok")) return "tiktok"
  return normalized
}

export function isTikTokWebhookPilot(account: FocusAccount) {
  return canonicalEvidencePlatform(account.platform) === "tiktok"
    && account.active
    && account.collection_mode === "webhook"
}

export function collectionFocusBlockReason(account: FocusAccount) {
  const platform = canonicalEvidencePlatform(account.platform)
  if (platform !== "tiktok") return `Collection is paused for ${platform}; 360dep is in TikTok KOL/KOC focus mode.`
  if (!account.active) return "TikTok creator account is not active in the current pilot roster."
  if (account.collection_mode !== "webhook") return "TikTok paid/API collection is disabled; only the signed webhook pilot is allowed."
  return null
}
