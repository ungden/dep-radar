import { backendEnabled } from "@/lib/supabase/env"
import { supabaseServer } from "@/lib/supabase/server"
import { toProDetail, toProSummary, toReviewItem, toWorkItem } from "./map"
import type { ListedService, ProDetail, ProSummary, ReviewItem, WorkItem } from "./types"

/**
 * Without a configured database there is nothing to read, and a build must not
 * fail over it: CI builds with no Supabase variables on purpose, to prove the app
 * degrades instead of crashing.
 */

/** Public profile fields. A phone number is not one of them. */
// Public identity lives on `pros`; `accounts` is private and holds the phone.
const PRO_PUBLIC = `
  id, slug, display_name, avatar_path, title, bio, highlights, categories,
  city, district, lat, lng, areas, home_service, studio_address, max_travel_km,
  years_exp, accepting_jobs, identity_status, rating_avg, rating_count,
  completed_jobs, response_minutes
`

const WORK_WITH_PRO = `
  id, slug, pro_id, template_id, title, description, image_paths, sort_order,
  pros!works_pro_id_fkey!inner (slug, display_name, avatar_path, rating_avg, rating_count,
                                identity_status, published)
`

export async function listPros(filter: { city?: string; category?: string } = {}): Promise<ProSummary[]> {
  if (!backendEnabled) return []
  const supabase = await supabaseServer()
  let query = supabase.from("pros").select(PRO_PUBLIC).eq("published", true).is("suspended_at", null)
  if (filter.city) query = query.eq("city", filter.city)
  if (filter.category) query = query.contains("categories", [filter.category])
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => toProSummary(row as never))
}

export async function getProBySlug(slug: string): Promise<ProDetail | null> {
  if (!backendEnabled) return null
  const supabase = await supabaseServer()
  const { data, error } = await supabase.from("pros").select(PRO_PUBLIC).eq("slug", slug).maybeSingle()
  if (error) throw error
  return data ? toProDetail(data as never) : null
}

export async function listProServices(proId: string): Promise<ListedService[]> {
  if (!backendEnabled) return []
  const supabase = await supabaseServer()
  const [{ data: services, error: e1 }, { data: prices, error: e2 }] = await Promise.all([
    supabase.from("pro_services").select("template_id, active").eq("pro_id", proId),
    supabase.from("pro_service_prices").select("template_id, variant_id, price").eq("pro_id", proId),
  ])
  if (e1) throw e1
  if (e2) throw e2
  return (services ?? []).map((s) => ({
    templateId: s.template_id,
    active: s.active,
    prices: Object.fromEntries(
      (prices ?? []).filter((p) => p.template_id === s.template_id).map((p) => [p.variant_id, p.price]),
    ),
  }))
}

export async function listWorks(filter: { proId?: string; category?: string; limit?: number } = {}): Promise<WorkItem[]> {
  if (!backendEnabled) return []
  const supabase = await supabaseServer()
  let query = supabase.from("works").select(WORK_WITH_PRO).eq("pros.published", true).order("sort_order")
  if (filter.proId) query = query.eq("pro_id", filter.proId)
  if (filter.limit) query = query.limit(filter.limit)
  const { data, error } = await query
  if (error) throw error
  const items = (data ?? []).map((row) => toWorkItem(row as never))
  return filter.category ? items.filter((w) => w.category === filter.category) : items
}

export async function listReviews(proId: string): Promise<ReviewItem[]> {
  if (!backendEnabled) return []
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      booking_id, pro_id, author_name, rating, tags, body, photo_paths, reply, created_at,
      bookings!reviews_booking_id_fkey!inner (template_id, variant_id)
    `)
    .eq("pro_id", proId)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => toReviewItem(row as never))
}

/** Bookable start times for one local date, generated from the freelancer's hours. */
export async function freeSlots(input: {
  proId: string
  templateId: string
  variantId: string
  quantity?: number
  date: string
  atHome: boolean
  lat?: number | null
  lng?: number | null
}): Promise<string[]> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc("free_slots", {
    p_pro: input.proId,
    p_template: input.templateId,
    p_variant: input.variantId,
    p_quantity: input.quantity ?? 1,
    p_date: input.date,
    p_at_home: input.atHome,
    p_lat: input.lat ?? undefined,
    p_lng: input.lng ?? undefined,
  })
  if (error) throw error
  return (data ?? []) as unknown as string[]
}

/** Why a slot cannot be booked, in the customer's language, or null when it can. */
export async function availabilityProblem(input: {
  proId: string
  templateId: string
  variantId: string
  quantity?: number
  startsAt: string
  atHome: boolean
  lat?: number | null
  lng?: number | null
}): Promise<string | null> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc("availability_problem", {
    p_pro: input.proId,
    p_template: input.templateId,
    p_variant: input.variantId,
    p_quantity: input.quantity ?? 1,
    p_starts_at: input.startsAt,
    p_at_home: input.atHome,
    p_lat: input.lat ?? undefined,
    p_lng: input.lng ?? undefined,
  })
  if (error) throw error
  return (data as string | null) ?? null
}

/** For a work's own page: enough for metadata, without loading the whole feed. */
export async function getWorkBySlug(slug: string) {
  if (!backendEnabled) return null
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from("works")
    .select(
      "id, slug, title, description, image_paths, pros!works_pro_id_fkey!inner (slug, display_name, published)",
    )
    .eq("slug", slug)
    .eq("pros.published", true)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const pro = Array.isArray(data.pros) ? data.pros[0] : data.pros
  return {
    slug: data.slug,
    title: data.title,
    description: data.description ?? "",
    images: data.image_paths ?? [],
    proSlug: pro?.slug ?? "",
    proName: pro?.display_name ?? "Chuyên viên",
  }
}

/** Slugs for the sitemap, so it lists what is actually published. */
export async function listPublishedSlugs() {
  if (!backendEnabled) return { pros: [], works: [] }
  const supabase = await supabaseServer()
  const [pros, works] = await Promise.all([
    supabase.from("pros").select("slug").eq("published", true).is("suspended_at", null),
    supabase.from("works").select("slug, pros!works_pro_id_fkey!inner (published)").eq("pros.published", true),
  ])
  return {
    pros: (pros.data ?? []).map((p) => p.slug),
    works: (works.data ?? []).map((w) => w.slug),
  }
}
