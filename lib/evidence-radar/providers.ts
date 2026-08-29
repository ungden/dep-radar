import "server-only"

import { createHash } from "node:crypto"

import { canonicalEvidencePlatform } from "@/lib/evidence-radar/focus"
import type { CreatorAccount } from "@/lib/types"

export interface DiscoveredSourcePost {
  external_post_id: string | null
  source_url: string
  published_at: string | null
  title: string
  caption: string
  media_url: string | null
  media_metadata: Record<string, unknown>
  raw_payload: Record<string, unknown>
  content_hash: string
}

export interface EvidenceSourceProvider {
  readonly name: string
  listNewPosts(account: CreatorAccount, cursor: string | null): Promise<DiscoveredSourcePost[]>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {}
}

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function hashPost(platform: string, id: string | null, url: string, caption: string) {
  return createHash("sha256")
    .update([platform.toLowerCase(), id ?? "", url, caption].join("|"))
    .digest("hex")
}

export function normalizeBrightDataPost(platform: string, value: unknown): DiscoveredSourcePost | null {
  const row = asRecord(value)
  const externalId = asString(row.post_id || row.id || row.shortcode) || null
  const caption = asString(row.description || row.caption || row.content || row.title)
  const url = asString(row.url || row.post_url || row.video_url_web)
  if (!url && !externalId) return null

  const mediaUrl = asString(
    row.video_url || row.media_url || row.image_url || row.thumbnail || row.display_url
  ) || null
  const publishedAt = asString(
    row.create_time || row.datetime || row.date_posted || row.date || row.timestamp
  ) || null
  const sourceUrl = url || buildPostUrl(platform, row, externalId)
  if (!sourceUrl) return null

  return {
    external_post_id: externalId,
    source_url: sourceUrl,
    published_at: publishedAt,
    title: caption.slice(0, 180) || `${platform} post`,
    caption,
    media_url: mediaUrl,
    media_metadata: {
      hashtags: row.hashtags ?? row.post_hashtags ?? [],
      duration: row.video_duration ?? null,
      post_type: row.post_type ?? row.content_type ?? null,
      sponsored: row.is_sponsored ?? null,
      attachments: row.attachments ?? null,
    },
    raw_payload: row,
    content_hash: hashPost(platform, externalId, sourceUrl, caption),
  }
}

function buildPostUrl(platform: string, row: Record<string, unknown>, id: string | null) {
  if (!id) return ""
  if (platform === "tiktok") {
    const username = asString(row.profile_username).replace(/^@/, "")
    return username ? `https://www.tiktok.com/@${username}/video/${id}` : ""
  }
  return ""
}

class BrightDataProvider implements EvidenceSourceProvider {
  readonly name = "bright-data"
  constructor(private readonly platform: "tiktok" | "instagram" | "facebook") {}

  async listNewPosts(account: CreatorAccount, cursor: string | null) {
    const token = process.env.BRIGHT_DATA_API_KEY
    if (!token) throw new Error("BRIGHT_DATA_API_KEY is not configured")

    const config = {
      tiktok: {
        datasetId: process.env.BRIGHT_DATA_TIKTOK_DATASET_ID || "gd_lu702nij2f790tmv9h",
        discoverBy: "profile_url",
      },
      instagram: {
        datasetId: process.env.BRIGHT_DATA_INSTAGRAM_DATASET_ID || "gd_l1vikfch901nx3by4",
        discoverBy: "url",
      },
      facebook: {
        datasetId: process.env.BRIGHT_DATA_FACEBOOK_DATASET_ID || "gd_lkaxegm826bjpoo9m5",
        discoverBy: "url",
      },
    }[this.platform]

    const endpoint = new URL("https://api.brightdata.com/datasets/v3/scrape")
    endpoint.searchParams.set("dataset_id", config.datasetId)
    endpoint.searchParams.set("type", "discover_new")
    endpoint.searchParams.set("discover_by", config.discoverBy)
    endpoint.searchParams.set("include_errors", "true")

    const input: Record<string, unknown> = { url: account.profile_url, num_of_posts: 10 }
    if (cursor) input.posts_to_not_include = cursor.split(",").filter(Boolean).slice(0, 100)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ input: [input] }),
      signal: AbortSignal.timeout(55_000),
    })
    if (!response.ok) {
      throw new Error(`Bright Data ${this.platform} failed (${response.status}): ${await response.text()}`)
    }

    const payload: unknown = await response.json()
    const rows = asArray(payload).flatMap((item) => {
      const record = asRecord(item)
      return Array.isArray(record.posts) ? record.posts : [record]
    })

    return rows
      .map((row) => normalizeBrightDataPost(this.platform, row))
      .filter((post): post is DiscoveredSourcePost => Boolean(post))
  }
}

class YouTubeProvider implements EvidenceSourceProvider {
  readonly name = "youtube-data-api"

  async listNewPosts(account: CreatorAccount, cursor: string | null) {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) throw new Error("YOUTUBE_API_KEY is not configured")

    const channelId = account.external_account_id || await resolveYouTubeChannelId(account.profile_url, apiKey)
    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels")
    channelUrl.searchParams.set("part", "contentDetails")
    channelUrl.searchParams.set("id", channelId)
    channelUrl.searchParams.set("key", apiKey)
    const channelResponse = await fetch(channelUrl, { signal: AbortSignal.timeout(15_000) })
    if (!channelResponse.ok) throw new Error(`YouTube channels.list failed (${channelResponse.status})`)
    const channelPayload = asRecord(await channelResponse.json())
    const channel = asRecord(asArray(channelPayload.items)[0])
    const uploads = asString(asRecord(asRecord(channel.contentDetails).relatedPlaylists).uploads)
    if (!uploads) throw new Error(`YouTube uploads playlist not found for ${channelId}`)

    const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems")
    playlistUrl.searchParams.set("part", "snippet,contentDetails")
    playlistUrl.searchParams.set("playlistId", uploads)
    playlistUrl.searchParams.set("maxResults", "10")
    playlistUrl.searchParams.set("key", apiKey)
    const playlistResponse = await fetch(playlistUrl, { signal: AbortSignal.timeout(15_000) })
    if (!playlistResponse.ok) throw new Error(`YouTube playlistItems.list failed (${playlistResponse.status})`)
    const playlistPayload = asRecord(await playlistResponse.json())

    return asArray(playlistPayload.items)
      .flatMap((item): DiscoveredSourcePost[] => {
        const row = asRecord(item)
        const snippet = asRecord(row.snippet)
        const details = asRecord(row.contentDetails)
        const videoId = asString(details.videoId || asRecord(snippet.resourceId).videoId)
        if (!videoId || videoId === cursor) return []
        const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`
        const caption = asString(snippet.description)
        return [{
          external_post_id: videoId,
          source_url: sourceUrl,
          published_at: asString(details.videoPublishedAt || snippet.publishedAt) || null,
          title: asString(snippet.title) || "YouTube video",
          caption,
          media_url: sourceUrl,
          media_metadata: { thumbnail: asString(asRecord(asRecord(snippet.thumbnails).high).url) || null },
          raw_payload: row,
          content_hash: hashPost("youtube", videoId, sourceUrl, caption),
        } satisfies DiscoveredSourcePost]
      })
  }
}

async function resolveYouTubeChannelId(profileUrl: string, apiKey: string) {
  const parsed = new URL(profileUrl)
  const channelMatch = parsed.pathname.match(/\/channel\/([^/]+)/)
  if (channelMatch) return channelMatch[1]
  const handle = parsed.pathname.match(/\/@([^/]+)/)?.[1]
  if (!handle) throw new Error(`Cannot resolve YouTube channel from ${profileUrl}`)

  const endpoint = new URL("https://www.googleapis.com/youtube/v3/channels")
  endpoint.searchParams.set("part", "id")
  endpoint.searchParams.set("forHandle", handle)
  endpoint.searchParams.set("key", apiKey)
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`YouTube handle lookup failed (${response.status})`)
  const payload = asRecord(await response.json())
  const channelId = asString(asRecord(asArray(payload.items)[0]).id)
  if (!channelId) throw new Error(`No YouTube channel found for @${handle}`)
  return channelId
}

export function getEvidenceSourceProvider(account: CreatorAccount): EvidenceSourceProvider {
  const platform = canonicalEvidencePlatform(account.platform)
  if (platform !== "tiktok") {
    throw new Error(`Evidence collection is paused for ${platform}; TikTok KOL/KOC is the only active source focus.`)
  }
  if (account.collection_mode === "webhook") {
    throw new Error("TikTok webhook accounts are push-only and must not be polled.")
  }
  if (process.env.EVIDENCE_RADAR_ALLOW_PAID_TIKTOK_COLLECTION !== "true") {
    throw new Error("Paid TikTok collection is disabled; use the signed TikTok collector webhook.")
  }
  return new BrightDataProvider("tiktok")
}
