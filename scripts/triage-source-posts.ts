import "./load-local-env"

import { createClient } from "@supabase/supabase-js"

import { triageSourcePost } from "@/lib/evidence-radar/triage"
import type { SourcePost } from "@/lib/types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) throw new Error("triage:evidence requires Supabase URL and service role key")

const db = createClient(url, serviceKey, { auth: { persistSession: false } })
const PAGE_SIZE = 500
const UPDATE_CONCURRENCY = 20

async function loadAllPosts() {
  const posts: SourcePost[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db.from("source_posts").select("*").range(from, from + PAGE_SIZE - 1).order("created_at")
    if (error) throw error
    posts.push(...((data as SourcePost[] | null) ?? []))
    if ((data?.length ?? 0) < PAGE_SIZE) break
  }
  return posts
}

function duplicateTarget(post: SourcePost, seenHashes: Map<string, string>) {
  const keys = [post.media_sha256, post.audio_sha256].filter((value): value is string => Boolean(value))
  const duplicate = keys.map((key) => seenHashes.get(key)).find(Boolean) ?? null
  if (!duplicate) for (const key of keys) seenHashes.set(key, post.id)
  return duplicate
}

async function main() {
  const posts = await loadAllPosts()
  const seenHashes = new Map<string, string>()
  const counts = new Map<string, number>()
  let duplicateCount = 0

  for (let index = 0; index < posts.length; index += UPDATE_CONCURRENCY) {
    const chunk = posts.slice(index, index + UPDATE_CONCURRENCY)
    await Promise.all(chunk.map(async (post) => {
      const duplicateOf = duplicateTarget(post, seenHashes)
      const triage = triageSourcePost(post)
      const analysisStatus = duplicateOf
        ? "ignored"
        : !triage.shouldAnalyze && ["pending", "queued", "failed"].includes(post.analysis_status)
          ? "ignored"
          : post.analysis_status
      if (duplicateOf) duplicateCount += 1
      counts.set(triage.lane, (counts.get(triage.lane) ?? 0) + 1)

      const { error } = await db.from("source_posts").update({
        content_lane: triage.lane,
        priority_score: duplicateOf ? 0 : triage.priorityScore,
        triage_reason: duplicateOf ? `Duplicate media/audio of source post ${duplicateOf}.` : triage.reason,
        triaged_at: new Date().toISOString(),
        duplicate_of_source_post_id: duplicateOf,
        analysis_status: analysisStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", post.id)
      if (error) throw error
    }))
  }

  console.log(`Triaged ${posts.length} posts; ${duplicateCount} duplicate media/audio rows ignored.`)
  for (const [lane, count] of Array.from(counts.entries()).sort()) console.log(`- ${lane}: ${count}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
