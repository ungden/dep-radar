import { getTemplate } from "@/lib/catalog"
import { SUPABASE_URL } from "@/lib/supabase/env"
import { supabaseAdmin } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/database.types"
import { followUpDue, followUpMessage, missingSteps, type FollowUpFacts, type FollowUpKind } from "./followups"
import { AiError, aiConfigured, generateJson, modelName, type AiPart } from "./llm"
import { combineProfileDecision, hasContactInfo, profileRuleProblems, type ProfileVerdict } from "./rules"
import {
  PROFILE_SCHEMA,
  WORK_SCHEMA,
  buildProfilePrompt,
  buildWorkPrompt,
  hoursSummary,
  parseProfileVerdict,
  parseWorkVerdict,
  type PhotoFact,
  type ServiceFact,
  type WorkVerdict,
} from "./verdict"

/**
 * The reviewer. Server only (service role, OPENAI_API_KEY).
 *
 * Three jobs, each bounded so one run fits in a Vercel function:
 *  1. profiles waiting for review (pros.review_status = 'pending');
 *  2. new posts by approved partners (works.ai_checked_at is null);
 *  3. reminders (lib/ai/followups.ts).
 * Every outcome goes through a database function that applies it and writes
 * the log (ai_decisions), so what the staff read is what happened.
 *
 * When the AI fails (outage, bad answer), nothing is guessed: the profile stays
 * pending, a 'skipped' row says why (at most once an hour per profile), and the
 * next run tries again. With no AI key at all, profiles are decided on
 * the rules alone and the log says so; posts are then kept unless a rule says
 * otherwise.
 */

export const LIMITS = { profiles: 10, works: 20, nudges: 50 } as const
const MAX_PHOTOS = 5
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const AI_TIMEOUT_MS = 40_000
const SKIP_LOG_EVERY_MS = 60 * 60 * 1000

type Admin = ReturnType<typeof supabaseAdmin>
type Row = Record<string, any>

export type ProfileOutcome =
  | { status: "decided"; decision: ProfileVerdict["decision"]; model: string }
  | { status: "skipped"; error: string }
  | { status: "not_pending" }

const serviceName = (templateId: string) => getTemplate(templateId)?.name ?? templateId

/** A photo is fetched only from the partner's own folder in our storage: never an arbitrary URL. */
function ownUpload(url: string, proId: string): boolean {
  return Boolean(SUPABASE_URL) && url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/works/${proId}/`)
}

type Fetched = { ok: true; part: AiPart } | { ok: false; missing: boolean }

async function fetchImage(url: string): Promise<Fetched> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    // Gone for good: the partner has to post it again. Anything else may pass.
    if (res.status === 400 || res.status === 404) return { ok: false, missing: true }
    if (!res.ok) return { ok: false, missing: false }
    const type = res.headers.get("content-type") ?? ""
    if (!type.startsWith("image/")) return { ok: false, missing: true }
    const bytes = Buffer.from(await res.arrayBuffer())
    if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, missing: true }
    return { ok: true, part: { image: { mimeType: type.split(";")[0], data: bytes.toString("base64") } } }
  } catch {
    return { ok: false, missing: false }
  }
}

/** The images of one post worth showing: both halves of a before/after, a clip's cover, else the first photo. */
function photosOf(work: Row): { url: string; role: PhotoFact["role"] }[] {
  const images: string[] = work.image_paths ?? []
  if (work.kind === "before_after") {
    return [
      { url: images[0], role: "before" as const },
      { url: images[1], role: "after" as const },
    ].filter((p) => p.url)
  }
  return images[0] ? [{ url: images[0], role: work.video_path ? "poster" : "photo" }] : []
}

interface GatheredPhotos {
  parts: AiPart[]
  facts: PhotoFact[]
  urls: string[]
  foreign: number
  missing: number
  /** A photo we could not load for a reason that may pass (network, 5xx). */
  transient: boolean
}

async function gatherPhotos(proId: string, works: Row[], limit: number): Promise<GatheredPhotos> {
  const out: GatheredPhotos = { parts: [], facts: [], urls: [], foreign: 0, missing: 0, transient: false }
  const wanted = works.flatMap((w) => photosOf(w).map((p) => ({ ...p, work: w }))).slice(0, limit)
  const fetched = await Promise.all(wanted.map((p) => (ownUpload(p.url, proId) ? fetchImage(p.url) : null)))
  wanted.forEach((p, i) => {
    const result = fetched[i]
    out.urls.push(p.url)
    if (!result) {
      out.foreign++
      return
    }
    if (!result.ok) {
      if (result.missing) out.missing++
      else out.transient = true
      return
    }
    const fact: PhotoFact = {
      index: out.facts.length + 1,
      workTitle: String(p.work.title ?? ""),
      serviceName: serviceName(String(p.work.template_id)),
      role: p.role,
    }
    out.facts.push(fact)
    out.parts.push({ text: `Ảnh ${fact.index}:` }, result.part)
  })
  return out
}

const errorText = (err: unknown) =>
  err instanceof AiError ? `${err.kind}: ${err.message}` : err instanceof Error ? err.message : String(err)

/** A 'skipped' row, unless one was written for this profile in the last hour. */
async function logSkipped(admin: Admin, proId: string, error: string, input: Row) {
  const since = new Date(Date.now() - SKIP_LOG_EVERY_MS).toISOString()
  const { data: recent } = await admin
    .from("ai_decisions")
    .select("id")
    .eq("pro_id", proId)
    .eq("decision", "skipped")
    .gte("created_at", since)
    .limit(1)
  if (recent?.length) return
  const { error: rpcError } = await admin.rpc("apply_ai_profile_decision", {
    p_pro: proId,
    p_decision: "skipped",
    p_reasons: [],
    p_summary: `AI chưa trả lời được, hồ sơ vẫn chờ duyệt và sẽ thử lại: ${error}`.slice(0, 500),
    p_model: modelName(),
    p_input: input as Json,
  })
  if (rpcError) console.error("ai review: logging a skip failed:", rpcError.message)
}

// 1. Profiles ------------------------------------------------------------------

export async function reviewProfile(proId: string, admin: Admin = supabaseAdmin()): Promise<ProfileOutcome> {
  const { data: pro, error } = await admin
    .from("pros")
    .select(
      "id, display_name, title, bio, highlights, categories, city, district, identity_status, review_status, review_note",
    )
    .eq("id", proId)
    .maybeSingle()
  if (error) throw new Error(`load profile: ${error.message}`)
  if (!pro || pro.review_status !== "pending") return { status: "not_pending" }

  const [listings, prices, hours, works] = await Promise.all([
    admin.from("pro_services").select("template_id").eq("pro_id", proId).eq("active", true),
    admin.from("pro_service_prices").select("template_id, variant_id, price").eq("pro_id", proId),
    admin.from("working_hours").select("weekday, start_min, end_min").eq("pro_id", proId),
    admin
      .from("works")
      .select("id, title, template_id, image_paths, kind, video_path")
      .eq("pro_id", proId)
      .is("hidden_at", null)
      .order("sort_order")
      .order("created_at", { ascending: false })
      .limit(MAX_PHOTOS),
  ])
  for (const r of [listings, prices, hours, works]) if (r.error) throw new Error(`load profile: ${r.error.message}`)

  const active = new Set((listings.data ?? []).map((l) => l.template_id))
  const { data: variants } = active.size
    ? await admin
        .from("service_variants")
        .select("template_id, id, label, min_price, max_price, suggested_price")
        .in("template_id", [...active])
    : { data: [] as Row[] }
  const variantOf = new Map((variants ?? []).map((v) => [`${v.template_id}/${v.id}`, v]))
  const services: ServiceFact[] = (prices.data ?? [])
    .filter((p) => active.has(p.template_id))
    .map((p) => {
      const v = variantOf.get(`${p.template_id}/${p.variant_id}`)
      return {
        name: serviceName(p.template_id),
        option: v?.label ?? p.variant_id,
        price: p.price,
        min: v?.min_price ?? 0,
        max: v?.max_price ?? 0,
        suggested: v?.suggested_price ?? 0,
      }
    })

  const text = `${pro.display_name}\n${pro.title}\n${pro.bio}\n${(pro.highlights ?? []).join("\n")}`
  const { data: banned } = await admin.rpc("banned_content", { p_text: text })
  const photos = await gatherPhotos(proId, works.data ?? [], MAX_PHOTOS)

  const rules = profileRuleProblems({
    displayName: pro.display_name ?? "",
    title: pro.title ?? "",
    bio: `${pro.bio ?? ""}\n${(pro.highlights ?? []).join("\n")}`,
    categories: pro.categories ?? [],
    identityStatus: pro.identity_status,
    activeServices: active.size,
    hasHours: (hours.data ?? []).length > 0,
    visibleWorks: (works.data ?? []).length,
    foreignPhotos: photos.foreign,
    missingPhotos: photos.missing,
    bannedWords: banned === true,
  })

  // What was looked at, for the staff. No identity data: only whether it is verified.
  const input = {
    display_name: pro.display_name,
    title: pro.title,
    bio_excerpt: String(pro.bio ?? "").slice(0, 300),
    categories: pro.categories,
    area: `${pro.district}, ${pro.city}`,
    identity_verified: pro.identity_status === "verified",
    services,
    hours: hoursSummary(hours.data ?? []),
    work_count: (works.data ?? []).length,
    work_ids: (works.data ?? []).map((w) => w.id),
    photos: photos.urls,
    rules,
  }

  let ai: ProfileVerdict | null = null
  let model = "rules"
  if (aiConfigured()) {
    // A photo that did not load for a passing reason would be judged unseen.
    if (photos.transient) {
      await logSkipped(admin, proId, "không tải được ảnh tác phẩm", input)
      return { status: "skipped", error: "photos unavailable" }
    }
    try {
      const prompt = buildProfilePrompt({
        displayName: pro.display_name ?? "",
        title: pro.title ?? "",
        bio: pro.bio ?? "",
        highlights: pro.highlights ?? [],
        categories: pro.categories ?? [],
        city: pro.city,
        district: pro.district,
        identityStatus: pro.identity_status,
        services,
        hoursSummary: input.hours,
        photos: photos.facts,
        previousNote: pro.review_note,
      })
      ai = parseProfileVerdict(
        await generateJson({ parts: [{ text: prompt }, ...photos.parts], schema: PROFILE_SCHEMA, name: "profile_review", timeoutMs: AI_TIMEOUT_MS }),
      )
      model = modelName()
    } catch (err) {
      const message = errorText(err)
      console.error("ai review: profile", proId, "skipped:", message)
      await logSkipped(admin, proId, message, input)
      return { status: "skipped", error: message }
    }
  }

  const verdict = combineProfileDecision(rules, ai)
  const { error: applyError } = await admin.rpc("apply_ai_profile_decision", {
    p_pro: proId,
    p_decision: verdict.decision,
    p_reasons: verdict.reasons,
    p_summary: verdict.summary,
    p_model: model,
    p_input: { ...input, ai: ai ? { decision: ai.decision, reasons: ai.reasons } : null } as unknown as Json,
  })
  if (applyError) throw new Error(`apply decision: ${applyError.message}`)
  return { status: "decided", decision: verdict.decision, model }
}

async function reviewPendingProfiles(admin: Admin, deadline: number) {
  const { data, error } = await admin
    .from("pros")
    .select("id")
    .eq("review_status", "pending")
    .is("suspended_at", null)
    .order("review_requested_at")
    .limit(LIMITS.profiles)
  if (error) throw new Error(`pending profiles: ${error.message}`)
  const counts = { decided: 0, skipped: 0, failed: 0 }
  for (const { id } of data ?? []) {
    if (Date.now() > deadline) break
    try {
      const outcome = await reviewProfile(id, admin)
      if (outcome.status === "decided") counts.decided++
      else if (outcome.status === "skipped") counts.skipped++
    } catch (err) {
      counts.failed++
      console.error("ai review: profile", id, "failed:", errorText(err))
    }
  }
  return counts
}

// 2. Posts ---------------------------------------------------------------------

async function reviewWork(admin: Admin, work: Row): Promise<"kept" | "hidden" | "skipped"> {
  const pro = (Array.isArray(work.pros) ? work.pros[0] : work.pros) as Row
  const photos = await gatherPhotos(work.pro_id, [work], 3)
  const text = `${work.title}\n${work.description ?? ""}`
  const { data: banned } = await admin.rpc("banned_content", { p_text: text })

  const ruleReasons: string[] = []
  if (photos.foreign > 0) ruleReasons.push("Ảnh phải là ảnh bạn tải lên từ máy của mình, không dùng đường link ảnh ở nơi khác.")
  if (photos.missing > 0) ruleReasons.push("Ảnh không mở được: xoá bài này và đăng lại ảnh.")
  if (hasContactInfo(text)) ruleReasons.push("Bỏ số điện thoại, đường link, Zalo/Facebook khỏi tiêu đề và mô tả.")
  if (banned === true) ruleReasons.push("Tiêu đề hoặc mô tả có từ ngữ không được phép trên 360dep.")

  let verdict: WorkVerdict | null = null
  let model = "rules"
  if (!ruleReasons.length && aiConfigured()) {
    if (photos.transient) return "skipped"
    try {
      const prompt = buildWorkPrompt({
        proName: String(pro?.display_name ?? ""),
        categories: pro?.categories ?? [],
        title: work.title,
        description: work.description ?? "",
        serviceName: serviceName(work.template_id),
        photos: photos.facts,
      })
      verdict = parseWorkVerdict(
        await generateJson({ parts: [{ text: prompt }, ...photos.parts], schema: WORK_SCHEMA, name: "work_review", timeoutMs: AI_TIMEOUT_MS }),
      )
      model = modelName()
    } catch (err) {
      // The post stays in the queue; the next run asks again.
      console.error("ai review: work", work.id, "skipped:", errorText(err))
      return "skipped"
    }
  }
  const decision = ruleReasons.length
    ? { decision: "hidden" as const, reasons: ruleReasons, summary: "Vi phạm quy tắc bài đăng." }
    : (verdict ?? { decision: "kept" as const, reasons: [], summary: "Chưa có AI, giữ bài theo quy tắc." })

  const { error } = await admin.rpc("apply_ai_work_decision", {
    p_work: work.id,
    p_decision: decision.decision,
    p_reasons: decision.reasons,
    p_summary: decision.summary,
    p_model: model,
    // Kept posts are most of the log: only enough to find the photos again.
    p_input: (decision.decision === "kept"
      ? { photos: photos.urls }
      : { title: work.title, description: String(work.description ?? "").slice(0, 300), photos: photos.urls }) as Json,
  })
  if (error) throw new Error(`apply work decision: ${error.message}`)
  return decision.decision
}

async function reviewNewWorks(admin: Admin, deadline: number) {
  const { data, error } = await admin
    .from("works")
    .select(
      "id, pro_id, title, description, template_id, image_paths, kind, video_path, pros!works_pro_id_fkey!inner (display_name, categories, review_status)",
    )
    .is("ai_checked_at", null)
    // A post the staff hid stays hidden whatever the reviewer would say.
    .or("hidden_by.is.null,hidden_by.eq.ai")
    .eq("pros.review_status", "approved")
    .order("created_at")
    .limit(LIMITS.works)
  if (error) throw new Error(`new works: ${error.message}`)
  const counts = { kept: 0, hidden: 0, skipped: 0, failed: 0 }
  for (const work of (data ?? []) as Row[]) {
    if (Date.now() > deadline) break
    try {
      counts[await reviewWork(admin, work)]++
    } catch (err) {
      counts.failed++
      console.error("ai review: work", work.id, "failed:", errorText(err))
    }
  }
  return counts
}

// 3. Reminders ------------------------------------------------------------------

async function sendFollowUps(admin: Admin, now: Date) {
  const { data, error } = await admin.rpc("ai_followup_facts", { p_limit: 500 })
  if (error) throw new Error(`follow-up facts: ${error.message}`)
  const due = (data ?? [])
    .map(
      (r): FollowUpFacts => ({
        proId: r.pro_id,
        kind: r.kind as FollowUpKind,
        createdAt: r.created_at,
        since: r.since,
        hasService: r.has_service,
        hasHours: r.has_hours,
        hasWork: r.has_work,
        balance: r.balance,
        prior: r.prior,
        lastAt: r.last_at,
      }),
    )
    .filter((f) => followUpDue(f, now))
    .slice(0, LIMITS.nudges)
  let sent = 0
  for (const f of due) {
    const message = followUpMessage(f)
    const { error: rpcError } = await admin.rpc("log_ai_followup", {
      p_pro: f.proId,
      p_summary: message.summary,
      p_reasons: message.reasons,
      p_input: {
        kind: f.kind,
        nth: f.prior + 1,
        since: f.since,
        ...(f.kind === "fee" ? { balance: f.balance } : {}),
        ...(f.kind === "setup" ? { missing: missingSteps(f).map((s) => s.key) } : {}),
      },
      p_title: message.title,
      p_body: message.body,
      p_link: message.link,
    })
    if (rpcError) console.error("ai review: reminder for", f.proId, "failed:", rpcError.message)
    else sent++
  }
  return { due: due.length, sent }
}

// The run ------------------------------------------------------------------------

/** One cron run. `budgetMs` stops starting new profiles or posts once it is spent. */
export async function runAiReview(budgetMs = 240_000) {
  const admin = supabaseAdmin()
  const deadline = Date.now() + budgetMs
  const result: Record<string, unknown> = { ai: aiConfigured() ? modelName() : "rules" }
  // Each part on its own: a failing query in one must not stop the others.
  for (const [name, job] of [
    ["profiles", () => reviewPendingProfiles(admin, deadline)],
    ["works", () => reviewNewWorks(admin, deadline)],
    ["followUps", () => sendFollowUps(admin, new Date())],
  ] as const) {
    try {
      result[name] = await job()
    } catch (err) {
      result[name] = { error: errorText(err) }
      console.error(`ai review: ${name} failed:`, errorText(err))
    }
  }
  return result
}
