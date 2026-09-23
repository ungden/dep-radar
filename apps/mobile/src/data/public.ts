import { getTemplate, type CategoryId, type Pro, type ProService, type Review, type VerificationStatus, type Work, type WorkStats } from "@/shared"
import { localDate } from "./format"
import { imageUrl } from "./links"
import { selectWithFallback, supabase, type Row } from "./supabase"

/**
 * What anyone may read: published freelancers, their works, reviews and price
 * lists. Mirrors lib/api/snapshot.ts on the web, column for column, so the two
 * never disagree about what a customer is shown.
 */
export interface PublicData {
  pros: AppPro[]
  works: AppWork[]
  reviews: Review[]
  services: ProService[]
  /** Work slug -> interest over the last 30 days. Empty when the view is not there yet. */
  stats: Record<string, WorkStats>
}

/** A freelancer, plus what only the app needs. */
export interface AppPro extends Pro {
  lat: number | null
  lng: number | null
}

export interface AppWork extends Work {
  /** Freelancer's database id, for RPCs. */
  proUuid: string
}

export const PRO_SELECT = `
  id, slug, display_name, avatar_path, title, bio, highlights, categories,
  city, district, lat, lng, areas, home_service, studio_address, max_travel_km,
  years_exp, accepting_jobs, published, identity_status, rating_avg, rating_count,
  completed_jobs, response_minutes, created_at
`

const WORK_BASE = "id, slug, pro_id, template_id, title, description, image_paths, sort_order, created_at"
const WORK_FULL = `${WORK_BASE}, kind, video_path`

const TONES = ["#E9C9C6", "#EBD5C3", "#DCD3E8", "#CFDDD6", "#F0D8C0", "#D8D2C7", "#E4CBD6"]

export function toPro(row: Row): AppPro {
  const slug = String(row.slug ?? "")
  const index = [...slug].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length
  return {
    uuid: row.id,
    id: slug,
    name: row.display_name || "Chuyên viên",
    title: row.title ?? "",
    phone: "",
    avatar: imageUrl(row.avatar_path, "avatars"),
    tone: TONES[index],
    categories: (row.categories ?? []) as CategoryId[],
    city: row.city ?? "",
    district: row.district ?? "",
    areas: row.areas ?? [],
    homeService: Boolean(row.home_service),
    studioAddress: row.studio_address ?? undefined,
    maxTravelKm: Number(row.max_travel_km ?? 10),
    yearsExp: row.years_exp ?? 0,
    acceptingJobs: Boolean(row.accepting_jobs),
    published: Boolean(row.published),
    joinedAt: row.created_at ? localDate(row.created_at) : "1970-01-01",
    bio: row.bio ?? "",
    highlights: row.highlights ?? [],
    identity: (row.identity_status ?? "none") as VerificationStatus,
    stats: { completedJobs: row.completed_jobs ?? 0, responseMinutes: row.response_minutes ?? 0 },
    rating: { average: Number(row.rating_avg ?? 0), count: row.rating_count ?? 0 },
    lat: row.lat ?? null,
    lng: row.lng ?? null,
  }
}

export function toWork(row: Row, slugOf: Map<string, string>): AppWork {
  const template = getTemplate(row.template_id)
  return {
    id: row.slug || row.id,
    dbId: row.id,
    proId: slugOf.get(row.pro_id) ?? row.pro_id,
    proUuid: row.pro_id,
    templateId: row.template_id,
    category: (template?.category ?? "nail") as CategoryId,
    title: row.title ?? "",
    description: row.description ?? "",
    images: ((row.image_paths ?? []) as string[]).map((p) => imageUrl(p)).filter((u): u is string => Boolean(u)),
    kind: row.kind === "before_after" ? "before_after" : "work",
    video: imageUrl(row.video_path) ?? undefined,
    createdAt: row.created_at ?? new Date(0).toISOString(),
  }
}

const REVIEW_COLUMNS_OLD = "booking_id, pro_id, author_name, service_label, rating, tags, body, photo_paths, reply, created_at"
// published_at (20260925100200): an author also reads their own blind review; it is not public yet.
const REVIEW_COLUMNS = [`${REVIEW_COLUMNS_OLD}, published_at`, REVIEW_COLUMNS_OLD]
const PRICE_COLUMNS = "pro_id, template_id, variant_id, price"
const LISTING_COLUMNS = "pro_id, template_id, active"

/** A PostgREST select builder, filtered further by forPros(). */
type Build = (columns: string) => any

/**
 * Rows that belong to some freelancers. `null` means everyone (the customer
 * browses the whole country); otherwise the ids go in chunks, so a URL never
 * grows past what the gateway accepts.
 */
async function forPros(label: string, ids: string[] | null, build: Build, columns: string[]): Promise<Row[]> {
  if (ids === null) return selectWithFallback(label, build, columns)
  if (!ids.length) return []
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 80) chunks.push(ids.slice(i, i + 80))
  const parts = await Promise.all(chunks.map((part) => selectWithFallback(label, (c) => build(c).in("pro_id", part), columns)))
  return parts.flat()
}

/** Interest over 30 days: an RPC on the web (work_stats_30d()). Without it every post ranks as "average appeal". */
async function loadStats(): Promise<Row[]> {
  const viaRpc = await supabase.rpc("work_stats_30d")
  if (!viaRpc.error) return (viaRpc.data ?? []) as Row[]
  const viaView = await supabase.from("work_stats_30d").select("*")
  return viaView.error ? [] : ((viaView.data ?? []) as Row[])
}

/**
 * The public catalogue for one city: its listed freelancers, filtered on the
 * server, and only their works, prices and reviews. `city` null is the whole
 * country. The viewer's own profile always comes along, listed or not.
 */
export async function loadPublic(ownId: string | null, city: string | null): Promise<PublicData> {
  const [proRows, ownPro] = await Promise.all([
    selectWithFallback(
      "pros",
      (c) => {
        const q = supabase.from("pros").select(c).eq("published", true).is("suspended_at", null)
        return city ? q.eq("city", city) : q
      },
      [PRO_SELECT],
    ),
    // The freelancer's own profile, which is not listed until it is published.
    ownId ? supabase.from("pros").select(PRO_SELECT).eq("id", ownId).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const own = (ownPro as { data: Row | null }).data
  if (own && !proRows.some((p) => p.id === own.id)) proRows.push(own)
  const ids = city ? proRows.map((p) => String(p.id)) : null

  const [workRows, reviewRows, priceRows, listingRows, statRows] = await Promise.all([
    forPros("works", ids, (c) => supabase.from("works").select(c).order("sort_order"), [WORK_FULL, WORK_BASE]),
    forPros("reviews", ids, (c) => supabase.from("reviews").select(c).is("hidden_at", null).order("created_at", { ascending: false }), REVIEW_COLUMNS),
    forPros("prices", ids, (c) => supabase.from("pro_service_prices").select(c), [PRICE_COLUMNS]),
    forPros("listings", ids, (c) => supabase.from("pro_services").select(c), [LISTING_COLUMNS]),
    loadStats(),
  ])
  return assemble(proRows, workRows, reviewRows, priceRows, listingRows, statRows)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * One freelancer from outside the loaded city (a link in a notification, a
 * chat, a quote), with their works, prices and reviews. Null when not listed.
 */
export async function loadOnePro(slugOrId: string): Promise<PublicData | null> {
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq(UUID.test(slugOrId) ? "id" : "slug", slugOrId)
    .maybeSingle()
  const row = data as Row | null
  if (!row) return null
  const ids = [String(row.id)]
  const [workRows, reviewRows, priceRows, listingRows] = await Promise.all([
    forPros("works", ids, (c) => supabase.from("works").select(c).order("sort_order"), [WORK_FULL, WORK_BASE]),
    forPros("reviews", ids, (c) => supabase.from("reviews").select(c).is("hidden_at", null).order("created_at", { ascending: false }), REVIEW_COLUMNS),
    forPros("prices", ids, (c) => supabase.from("pro_service_prices").select(c), [PRICE_COLUMNS]),
    forPros("listings", ids, (c) => supabase.from("pro_services").select(c), [LISTING_COLUMNS]),
  ])
  return assemble([row], workRows, reviewRows, priceRows, listingRows, [])
}

/** Which freelancer a work link (slug or id) belongs to. */
export async function proOfWork(slugOrId: string): Promise<string | null> {
  const { data } = await supabase
    .from("works")
    .select("pro_id")
    .eq(UUID.test(slugOrId) ? "id" : "slug", slugOrId)
    .maybeSingle()
  return ((data as Row | null)?.pro_id as string | undefined) ?? null
}

/** Adds what `extra` has that `base` lacks. */
export function mergePublic(base: PublicData, extra: PublicData): PublicData {
  const pros = new Set(base.pros.map((p) => p.uuid))
  const works = new Set(base.works.map((w) => w.dbId))
  const reviews = new Set(base.reviews.map((r) => r.id))
  const services = new Set(base.services.map((s) => s.id))
  return {
    pros: [...base.pros, ...extra.pros.filter((p) => !pros.has(p.uuid))],
    works: [...base.works, ...extra.works.filter((w) => !works.has(w.dbId))],
    reviews: [...base.reviews, ...extra.reviews.filter((r) => !reviews.has(r.id))],
    services: [...base.services, ...extra.services.filter((s) => !services.has(s.id))],
    stats: { ...extra.stats, ...base.stats },
  }
}

function assemble(proRows: Row[], workRows: Row[], reviewRows: Row[], priceRows: Row[], listingRows: Row[], statRows: Row[]): PublicData {
  const pros = proRows.map(toPro)
  const slugOf = new Map(pros.map((p) => [p.uuid, p.id]))

  // Works of freelancers who are neither listed nor the viewer are not shown.
  const works = workRows.filter((w) => slugOf.has(w.pro_id)).map((w) => toWork(w, slugOf))
  const workSlug = new Map(works.map((w) => [w.dbId, w.id]))

  const reviews: Review[] = reviewRows.filter((row) => slugOf.has(row.pro_id) && row.published_at !== null).map((row) => ({
    id: row.booking_id,
    proId: slugOf.get(row.pro_id) ?? row.pro_id,
    bookingId: row.booking_id,
    author: row.author_name ?? "Khách hàng",
    rating: row.rating,
    tags: row.tags ?? [],
    text: row.body ?? "",
    date: localDate(row.created_at),
    serviceName: row.service_label ?? "",
    photo: imageUrl((row.photo_paths ?? [])[0], "reviews"),
    reply: row.reply ?? undefined,
  }))

  const services: ProService[] = listingRows.filter((row) => slugOf.has(row.pro_id)).map((row) => {
    const slug = slugOf.get(row.pro_id) ?? row.pro_id
    return {
      id: `${slug}:${row.template_id}`,
      proId: slug,
      templateId: row.template_id,
      active: Boolean(row.active),
      prices: Object.fromEntries(
        priceRows.filter((p) => p.pro_id === row.pro_id && p.template_id === row.template_id).map((p) => [p.variant_id, p.price]),
      ),
    }
  })

  const stats: Record<string, WorkStats> = {}
  for (const row of statRows) {
    const slug = workSlug.get(row.work_id)
    if (!slug) continue
    stats[slug] = {
      impressions: Number(row.impressions ?? 0),
      opens: Number(row.opens ?? 0),
      saves: Number(row.saves ?? 0),
      bookClicks: Number(row.book_clicks ?? 0),
    }
  }

  return { pros, works, reviews, services, stats }
}

/** Lowest price a freelancer lists for a service, or null when they don't offer it. */
export function fromPrice(services: ProService[], proId: string, templateId?: string): number | null {
  let min: number | null = null
  for (const s of services) {
    if (s.proId !== proId || !s.active) continue
    if (templateId && s.templateId !== templateId) continue
    for (const price of Object.values(s.prices)) if (min === null || price < min) min = price
  }
  return min
}

/**
 * Photo & video people list their kit, models their card. Both are optional
 * and being added in parallel; when the column or table is missing this is
 * simply empty.
 */
export async function loadProExtras(proUuid: string): Promise<{ equipment?: string; model?: Pro["model"] }> {
  const [equipment, model] = await Promise.all([
    supabase
      .from("pros")
      .select("equipment")
      .eq("id", proUuid)
      .maybeSingle()
      .then(({ data, error }) => (error ? undefined : ((data as Row | null)?.equipment as string | undefined) || undefined)),
    supabase
      .from("model_profiles")
      .select("*")
      .eq("pro_id", proUuid)
      .maybeSingle()
      .then(({ data, error }) => {
        const row = data as Row | null
        if (error || !row) return undefined
        return {
          heightCm: row.height_cm ?? null,
          topSize: row.top_size ?? "",
          bottomSize: row.bottom_size ?? "",
          shoeSize: row.shoe_size ?? "",
          styles: row.styles ?? [],
          accepts: row.accepts ?? [],
          refuses: row.refuses ?? [],
        }
      }),
  ])
  return { equipment, model }
}
