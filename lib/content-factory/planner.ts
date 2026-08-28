import "server-only"

import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import { classifyRisk, slugifyVietnamese, stableHash } from "@/lib/content-factory/policy"
import { sendContentJob } from "@/lib/content-factory/server"
import type { BudgetStatus, ContentJobRecord, ContentSignalRecord, ContentSlotType } from "@/lib/content-factory/types"
import type { CreatorProductEvent, Product } from "@/lib/types"

const HUB_BY_CATEGORY: Record<string, string> = {
  skincare: "product-radar",
  haircare: "toc-da-dau",
  makeup: "makeup",
  fragrance: "mui-huong",
  bodycare: "bodycare",
  beauty_tools_tech: "beauty-tech",
  clinic_treatment: "clinic-treatment",
  nails_lash_brow: "nails-mi-long-may",
  men_grooming: "nam-gioi",
}

function vnParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(now)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ""
  return { date: `${value("year")}-${value("month")}-${value("day")}`, hour: Number(value("hour")) }
}

export function contentSlotFor(now: Date): ContentSlotType | null {
  const hour = vnParts(now).hour
  if (hour === 8) return "refresh"
  if (hour === 14) return "evidence"
  if (hour === 20) return "evergreen"
  return null
}

export async function seedEvidenceSignals() {
  const supabase = getSupabaseAdmin()
  const [eventsResult, productsResult, creatorsResult] = await Promise.all([
    supabase.from("creator_product_events").select("*")
      .eq("verification_status", "verified").eq("exact_sku_verified", true)
      .gte("confidence_score", 80).order("event_date", { ascending: false }).limit(50),
    supabase.from("radar_products").select("id,name,brand,description,category,source_url,source_label,source_type,category_key,status"),
    supabase.from("kols").select("id,name,trustscore,source_quality").limit(200),
  ])
  if (eventsResult.error) throw new Error(`Cannot read verified creator evidence: ${eventsResult.error.message}`)
  if (productsResult.error) throw new Error(`Cannot read products for content signals: ${productsResult.error.message}`)

  const products = new Map(((productsResult.data ?? []) as Product[]).map((product) => [product.id, product]))
  const creators = new Map((creatorsResult.data ?? []).map((creator) => [creator.id, creator]))
  let inserted = 0

  for (const event of (eventsResult.data ?? []) as CreatorProductEvent[]) {
    const product = products.get(event.product_id)
    const creator = creators.get(event.creator_id) as { name?: string; trustscore?: number; source_quality?: string } | undefined
    if (!product || product.status === "archived" || !event.source_url) continue
    const hub = HUB_BY_CATEGORY[product.category_key ?? ""] ?? "product-radar"
    const title = `${product.name}: đọc đúng bằng chứng từ ${creator?.name ?? "creator"}`
    const sources = [
      { url: event.source_url, title: event.source_title || title, publisher: creator?.name ?? event.source_platform, sourceType: "creator_evidence", excerpt: event.source_excerpt },
      ...(product.source_url ? [{ url: product.source_url, title: product.source_label ?? `${product.brand} ${product.name}`, publisher: product.brand, sourceType: product.source_type ?? "official_product", excerpt: product.description }] : []),
    ]
    const payload = {
      productIds: [product.id], creatorIds: [event.creator_id], eventId: event.id,
      eventType: event.event_type, disclosure: event.disclosure, evidenceNote: event.evidence_note,
      ownData: { product: { id: product.id, brand: product.brand, name: product.name, description: product.description }, creator: { id: event.creator_id, name: creator?.name }, event },
      sources,
    }
    const dedupeHash = stableHash({ type: "creator_evidence", event: event.id, product: product.id })
    const { data, error } = await supabase.from("content_signals").upsert({
      signal_type: "creator_evidence",
      source_type: event.source_platform,
      external_key: event.id,
      title,
      summary: event.source_excerpt || event.evidence_note || "Verified creator-product observation",
      source_url: event.source_url,
      hub_slug: hub,
      intent: "decision",
      risk_level: classifyRisk(`${product.name} ${product.category} ${event.source_excerpt}`),
      payload,
      evidence_score: Math.min(100, Number(event.confidence_score ?? 80)),
      freshness_score: 70,
      opportunity_score: 60,
      status: "pending",
      dedupe_hash: dedupeHash,
      observed_at: event.observed_at,
      expires_at: event.valid_until,
    }, { onConflict: "dedupe_hash", ignoreDuplicates: true }).select("id")
    if (error) throw new Error(`Cannot seed content signal: ${error.message}`)
    inserted += data?.length ?? 0
  }
  return inserted
}

async function chooseRefreshPost() {
  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()
  const due = await supabase.from("posts").select("*").eq("status", "published")
    .lte("refresh_due_at", now).order("refresh_due_at", { ascending: true }).limit(1).maybeSingle()
  if (due.data) return due.data as Record<string, unknown>
  const legacy = await supabase.from("posts").select("*").eq("status", "published")
    .eq("generation_method", "legacy_registry").order("last_verified_at", { ascending: true, nullsFirst: true })
    .order("published_at", { ascending: true }).limit(1).maybeSingle()
  if (legacy.error) throw new Error(`Cannot choose refresh post: ${legacy.error.message}`)
  return legacy.data as Record<string, unknown> | null
}

async function chooseSignal(slot: ContentSlotType) {
  const signalTypes = slot === "evidence" ? ["creator_evidence", "product_evidence"] : ["evergreen", "content_gap", "search_console"]
  const now = new Date().toISOString()
  const result = await getSupabaseAdmin().from("content_signals").select("*")
    .eq("status", "pending").in("signal_type", signalTypes)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("total_score", { ascending: false }).order("observed_at", { ascending: false }).limit(1).maybeSingle()
  if (result.error) throw new Error(`Cannot choose content signal: ${result.error.message}`)
  return result.data as ContentSignalRecord | null
}

export async function planSlot(now: Date, budget: BudgetStatus, shadowMode: boolean) {
  const slot = contentSlotFor(now)
  if (!slot) return { slot: null, job: null, skipped: "not_a_publication_window" }
  if (budget.stopAllPaidWork) return { slot, job: null, skipped: "monthly_budget_exhausted" }
  if (slot !== "refresh" && budget.stopNewPaidWork) return { slot, job: null, skipped: "budget_warning_net_new_paused" }

  const { date } = vnParts(now)
  const idempotencyKey = `content-slot:${date}:${slot}`
  const existing = await getSupabaseAdmin().from("content_jobs").select("*").eq("idempotency_key", idempotencyKey).maybeSingle()
  if (existing.data) return { slot, job: existing.data as ContentJobRecord, skipped: "slot_already_planned" }

  const supabase = getSupabaseAdmin()
  let postId: string | null = null
  let signal: ContentSignalRecord | null = null
  let riskLevel: "low" | "medium" | "high" = "low"
  let hubSlug: string | null = null
  let intent: string | null = null
  let jobType: "new" | "refresh" = "new"

  if (slot === "refresh") {
    const post = await chooseRefreshPost()
    if (!post) return { slot, job: null, skipped: "no_refresh_candidate" }
    postId = String(post.id)
    riskLevel = (post.risk_level as typeof riskLevel | null) ?? classifyRisk(`${post.title ?? ""} ${post.content ?? ""}`)
    hubSlug = (post.hub_slug as string | null) ?? null
    intent = (post.intent as string | null) ?? "problem-solving"
    jobType = "refresh"
  } else {
    signal = await chooseSignal(slot)
    if (!signal) return { slot, job: null, skipped: "no_qualified_signal" }
    riskLevel = signal.risk_level
    hubSlug = signal.hub_slug
    intent = signal.intent
    const slug = slugifyVietnamese(signal.title)
    postId = `cf-${stableHash(signal.id).slice(0, 20)}`
    const postInsert = await supabase.from("posts").insert({
      id: postId,
      title: signal.title,
      slug,
      excerpt: signal.summary,
      content: "",
      author_name: "360dep.vn Beauty Desk",
      author_avatar: "/brand/icon-192.png",
      category: "Beauty Decision Guide",
      tags: [], image: "/brand/social-share.jpg", likes: 0, comments: 0, product_ids: [],
      hub_slug: hubSlug, intent, risk_level: riskLevel, status: "draft",
      generation_method: "content_factory", provenance: { signal_id: signal.id },
    })
    if (postInsert.error) {
      if (postInsert.error.code !== "23505") throw new Error(`Cannot reserve content post: ${postInsert.error.message}`)
      const reserved = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle()
      postId = reserved.data?.id ?? postId
    }
  }

  const insert = await supabase.from("content_jobs").insert({
    signal_id: signal?.id ?? null,
    post_id: postId,
    job_type: jobType,
    slot_type: slot,
    status: "queued",
    risk_level: riskLevel,
    hub_slug: hubSlug,
    intent,
    scheduled_for: now.toISOString(),
    idempotency_key: idempotencyKey,
    max_attempts: 3,
    shadow_mode: shadowMode,
  }).select("*").single()
  if (insert.error) throw new Error(`Cannot create content job: ${insert.error.message}`)
  const job = insert.data as ContentJobRecord
  if (signal) await supabase.from("content_signals").update({ status: "selected" }).eq("id", signal.id)
  await sendContentJob(job.id, job.idempotency_key)
  return { slot, job, skipped: null }
}
