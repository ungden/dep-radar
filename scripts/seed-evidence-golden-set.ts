import "./load-local-env"

import { createClient } from "@supabase/supabase-js"

import type { SourcePost, SourcePostContentLane } from "@/lib/types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) throw new Error("seed:golden-evidence requires Supabase URL and service role key")

const db = createClient(url, serviceKey, { auth: { persistSession: false } })
const TARGET = 200
const QUOTAS: Array<[SourcePostContentLane, number]> = [
  ["product_review", 80],
  ["expert_education", 40],
  ["commercial_trend", 40],
  ["vision_required", 20],
  ["lifestyle", 20],
]

function deterministicRank(post: SourcePost) {
  return `${post.creator_id}:${post.external_post_id ?? post.id}`
}

async function main() {
  const { count: existingCount, error: countError } = await db.from("evidence_golden_samples").select("id", { count: "exact", head: true }).eq("cohort", "pilot-200")
  if (countError) throw countError
  if ((existingCount ?? 0) >= TARGET) {
    console.log(`Golden cohort already contains ${existingCount} samples.`)
    return
  }

  const { data, error } = await db.from("source_posts").select("*").in("transcription_status", ["ready", "no_speech"]).is("duplicate_of_source_post_id", null).order("priority_score", { ascending: false }).limit(2000)
  if (error) throw error
  const posts = ((data as SourcePost[] | null) ?? []).sort((a, b) => deterministicRank(a).localeCompare(deterministicRank(b)))
  const picked = new Map<string, SourcePost>()
  for (const [lane, quota] of QUOTAS) {
    for (const post of posts.filter((item) => item.content_lane === lane).slice(0, quota)) picked.set(post.id, post)
  }
  for (const post of posts) {
    if (picked.size >= TARGET) break
    picked.set(post.id, post)
  }
  if (picked.size < TARGET) throw new Error(`Only ${picked.size} eligible posts available; need ${TARGET}`)

  const rows = Array.from(picked.values()).slice(0, TARGET).map((post) => ({
    source_post_id: post.id,
    cohort: "pilot-200",
    content_class: "unlabeled",
    expected_claims: [],
    status: "pending",
  }))
  const { error: insertError } = await db.from("evidence_golden_samples").upsert(rows, { onConflict: "source_post_id", ignoreDuplicates: true })
  if (insertError) throw insertError

  const laneCounts = new Map<string, number>()
  for (const post of Array.from(picked.values()).slice(0, TARGET)) laneCounts.set(post.content_lane ?? "unclassified", (laneCounts.get(post.content_lane ?? "unclassified") ?? 0) + 1)
  console.log(`Seeded the pilot-200 golden review cohort with ${rows.length} source posts.`)
  for (const [lane, count] of Array.from(laneCounts.entries()).sort()) console.log(`- ${lane}: ${count}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
