import { createHash } from "node:crypto"

import type { CreatorAccount } from "@/lib/types"

export const TIKTOK_COLLECTOR_SCHEMA = "360dep.tiktok-manifest.v2"
const LEGACY_TIKTOK_COLLECTOR_SCHEMA = "360dep.tiktok-manifest.v1"
export const TIKTOK_COLLECTOR_NAME = "downloadtiktok"
export const TIKTOK_COLLECTOR_MAX_POSTS = 200

export interface TikTokCollectorPost {
  external_post_id: string
  source_url: string
  published_at: string | null
  title: string
  caption: string
  media_url: string | null
  media_metadata: Record<string, unknown>
  raw_payload: Record<string, unknown>
  content_hash: string
  raw_media_expires_at: string
  transcription_status: "pending" | "ready" | "no_speech" | "failed"
  transcript_text: string | null
  transcript_language: string | null
  transcript_segments: Array<{ start: number; end: number; text: string }>
  transcription_provider: string | null
  transcription_model: string | null
  transcribed_at: string | null
  archive_video_path: string | null
  archive_audio_path: string | null
  media_sha256: string | null
  audio_sha256: string | null
  vision_fallback_required: boolean
}

export interface NormalizedTikTokCollectorBatch {
  batchId: string
  collectedAt: string
  posts: TikTokCollectorPost[]
  rejected: Array<{ index: number; reason: string }>
  recordsSeen: number
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function asString(value: unknown, maxLength = 5_000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function finiteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseDate(value: unknown): Date | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value < 10_000_000_000 ? value * 1_000 : value
    const parsed = new Date(milliseconds)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof value !== "string" || !value.trim()) return null
  const numeric = Number(value)
  if (Number.isFinite(numeric) && /^\d{10,13}$/.test(value.trim())) return parseDate(numeric)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function profileUsername(profileUrl: string) {
  try {
    const url = new URL(profileUrl)
    if (url.protocol !== "https:" || !isTikTokHost(url.hostname)) return null
    return decodeURIComponent(url.pathname.match(/^\/@([^/]+)\/?$/)?.[1] ?? "").toLowerCase() || null
  } catch {
    return null
  }
}

function isTikTokHost(hostname: string) {
  const host = hostname.toLowerCase()
  return host === "tiktok.com" || host.endsWith(".tiktok.com")
}

function parsePostUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || !isTikTokHost(url.hostname)) return null
    const match = url.pathname.match(/^\/@([^/]+)\/video\/(\d{8,30})\/?$/)
    if (!match) return null
    url.hash = ""
    url.search = ""
    return {
      username: decodeURIComponent(match[1]).toLowerCase(),
      postId: match[2],
      sourceUrl: url.toString().replace(/\/$/, ""),
    }
  } catch {
    return null
  }
}

function isAllowedMediaUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return false
    const host = url.hostname.toLowerCase()
    if (/^(?:[a-z0-9-]+\.)*tiktokcdn(?:-[a-z0-9-]+)?\.com$/.test(host)) return true
    return [
      "tiktokv.com",
      "byteoversea.com",
      "ibytedtos.com",
      "b-cdn.net",
      "bunnycdn.com",
    ].some((domain) => host === domain || host.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

function hashPost(id: string, sourceUrl: string, caption: string) {
  return createHash("sha256")
    .update(["tiktok", id, sourceUrl, caption].join("|"))
    .digest("hex")
}

function archivePath(value: unknown, kind: "source.mp4" | "audio.mp3") {
  const path = asString(value, 1_000)
  if (!path) return null
  return /^evidence-radar\/tiktok\/[a-zA-Z0-9._-]+\/\d{8,30}\/(source\.mp4|audio\.mp3)$/.test(path)
    && path.endsWith(kind) ? path : null
}

function sha256(value: unknown) {
  const hash = asString(value, 64).toLowerCase()
  return /^[a-f0-9]{64}$/.test(hash) ? hash : null
}

function transcriptSegments(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 500).flatMap((item) => {
    const segment = asRecord(item)
    const start = finiteNumber(segment.start)
    const end = finiteNumber(segment.end)
    const text = asString(segment.text, 2_000)
    return start !== null && end !== null && start >= 0 && end >= start && text
      ? [{ start, end, text }]
      : []
  })
}

function normalizePost(
  value: unknown,
  index: number,
  expectedUsername: string,
  batchId: string,
  collectedAt: Date,
): { post: TikTokCollectorPost | null; rejection?: { index: number; reason: string } } {
  const row = asRecord(value)
  const id = asString(row.id || row.external_post_id, 40)
  if (!/^\d{8,30}$/.test(id)) return { post: null, rejection: { index, reason: "invalid_post_id" } }

  const parsedUrl = parsePostUrl(asString(row.url || row.source_url, 1_000))
  if (!parsedUrl) return { post: null, rejection: { index, reason: "invalid_tiktok_post_url" } }
  if (parsedUrl.postId !== id) return { post: null, rejection: { index, reason: "post_id_url_mismatch" } }
  if (parsedUrl.username !== expectedUsername) {
    return { post: null, rejection: { index, reason: "creator_profile_mismatch" } }
  }

  const published = parseDate(row.published_at ?? row.timestamp)
  if (published && published.getTime() > collectedAt.getTime() + 15 * 60_000) {
    return { post: null, rejection: { index, reason: "published_at_in_future" } }
  }

  const caption = asString(row.caption || row.title)
  const title = asString(row.title, 500) || caption.slice(0, 180) || `TikTok ${id}`
  const requestedMediaUrl = asString(row.media_url, 2_000)
  const mediaUrl = requestedMediaUrl && isAllowedMediaUrl(requestedMediaUrl) ? requestedMediaUrl : null
  const requestedCoverUrl = asString(row.cover_url || row.cover, 2_000)
  const coverUrl = requestedCoverUrl && isAllowedMediaUrl(requestedCoverUrl) ? requestedCoverUrl : null
  const requestedExpiry = parseDate(row.media_expires_at)
  const defaultExpiry = new Date(collectedAt.getTime() + (mediaUrl ? 6 : 1) * 60 * 60_000)
  const maxExpiry = new Date(collectedAt.getTime() + 7 * 24 * 60 * 60_000)
  const expiry = requestedExpiry && requestedExpiry > collectedAt && requestedExpiry < maxExpiry
    ? requestedExpiry
    : defaultExpiry

  const metrics = asRecord(row.metrics)
  const duration = finiteNumber(row.duration ?? metrics.duration)
  const viewCount = finiteNumber(row.view_count ?? metrics.view_count)
  const likeCount = finiteNumber(row.like_count ?? metrics.like_count)
  const commentCount = finiteNumber(row.comment_count ?? metrics.comment_count)
  const transcriptText = asString(row.transcript_text, 100_000) || null
  const requestedTranscriptionStatus = asString(row.transcription_status, 20)
  const transcriptionStatus = transcriptText
    ? "ready"
    : requestedTranscriptionStatus === "no_speech" || requestedTranscriptionStatus === "failed"
      ? requestedTranscriptionStatus
      : "pending"
  const archiveVideoPath = archivePath(row.archive_video_path, "source.mp4")
  const archiveAudioPath = archivePath(row.archive_audio_path, "audio.mp3")

  return {
    post: {
      external_post_id: id,
      source_url: parsedUrl.sourceUrl,
      published_at: published?.toISOString() ?? null,
      title,
      caption,
      media_url: mediaUrl,
      media_metadata: {
        collector: TIKTOK_COLLECTOR_NAME,
        schema_version: TIKTOK_COLLECTOR_SCHEMA,
        batch_id: batchId,
        cover_url: coverUrl,
        duration_seconds: duration,
        view_count: viewCount,
        like_count: likeCount,
        comment_count: commentCount,
        media_resolved: Boolean(mediaUrl),
      },
      raw_payload: {
        collector: TIKTOK_COLLECTOR_NAME,
        batch_id: batchId,
        collected_at: collectedAt.toISOString(),
      },
      content_hash: hashPost(id, parsedUrl.sourceUrl, caption),
      raw_media_expires_at: expiry.toISOString(),
      transcription_status: transcriptionStatus,
      transcript_text: transcriptText,
      transcript_language: transcriptText ? asString(row.transcript_language, 20) || "vi" : null,
      transcript_segments: transcriptText ? transcriptSegments(row.transcript_segments) : [],
      transcription_provider: transcriptText ? asString(row.transcription_provider, 100) || null : null,
      transcription_model: transcriptText ? asString(row.transcription_model, 200) || null : null,
      transcribed_at: transcriptText ? (parseDate(row.transcribed_at) ?? collectedAt).toISOString() : null,
      archive_video_path: archiveVideoPath,
      archive_audio_path: archiveAudioPath,
      media_sha256: archiveVideoPath ? sha256(row.media_sha256) : null,
      audio_sha256: archiveAudioPath ? sha256(row.audio_sha256) : null,
      vision_fallback_required: !transcriptText && requestedTranscriptionStatus === "no_speech",
    },
  }
}

export function normalizeTikTokCollectorBatch(
  value: unknown,
  account: Pick<CreatorAccount, "creator_id" | "platform" | "profile_url">,
  now = new Date(),
): NormalizedTikTokCollectorBatch {
  const body = asRecord(value)
  if (![TIKTOK_COLLECTOR_SCHEMA, LEGACY_TIKTOK_COLLECTOR_SCHEMA].includes(asString(body.schema_version, 100))) {
    throw new Error("Unsupported collector schema")
  }
  if (body.collector !== TIKTOK_COLLECTOR_NAME) throw new Error("Unsupported collector")
  if (asString(body.creator_id, 100) !== account.creator_id) throw new Error("Creator account mismatch")
  if (!account.platform.toLowerCase().includes("tiktok")) throw new Error("Creator account is not TikTok")

  const expectedUsername = profileUsername(account.profile_url)
  const requestedUsername = profileUsername(asString(body.profile_url, 1_000))
  if (!expectedUsername || requestedUsername !== expectedUsername) throw new Error("Profile URL mismatch")

  const batchId = asString(body.batch_id, 100)
  if (!/^[a-zA-Z0-9._:-]{8,100}$/.test(batchId)) throw new Error("Invalid batch id")
  const collectedAt = parseDate(body.collected_at) ?? now
  if (Math.abs(collectedAt.getTime() - now.getTime()) > 24 * 60 * 60_000) {
    throw new Error("Collector timestamp outside allowed window")
  }

  const rows = Array.isArray(body.posts) ? body.posts : []
  if (rows.length === 0) throw new Error("Collector batch has no posts")
  if (rows.length > TIKTOK_COLLECTOR_MAX_POSTS) throw new Error("Collector batch exceeds 200 posts")

  const posts: TikTokCollectorPost[] = []
  const rejected: Array<{ index: number; reason: string }> = []
  const seenIds = new Set<string>()
  rows.forEach((row, index) => {
    const normalized = normalizePost(row, index, expectedUsername, batchId, collectedAt)
    if (!normalized.post) {
      rejected.push(normalized.rejection ?? { index, reason: "invalid_post" })
      return
    }
    if (seenIds.has(normalized.post.external_post_id)) {
      rejected.push({ index, reason: "duplicate_post_id" })
      return
    }
    seenIds.add(normalized.post.external_post_id)
    posts.push(normalized.post)
  })

  return { batchId, collectedAt: collectedAt.toISOString(), posts, rejected, recordsSeen: rows.length }
}
