import { supabaseServer } from "@/lib/supabase/server"
import { toProDetail, toProSummary, toReviewItem, toWorkItem } from "./map"
import type { ListedService, ProDetail, ProSummary, ReviewItem, WorkItem } from "./types"

/** Public profile fields. A phone number is not one of them. */
const PRO_PUBLIC = `
  id, slug, title, bio, highlights, categories, city, district, lat, lng, areas,
  home_service, studio_address, max_travel_km, years_exp, accepting_jobs,
  identity_status, rating_avg, rating_count, completed_jobs, response_minutes,
  accounts!inner (full_name, avatar_path)
`

const WORK_WITH_PRO = `
  id, pro_id, template_id, title, description, image_paths, sort_order,
  pros!inner (slug, rating_avg, rating_count, identity_status, published,
              accounts!inner (full_name, avatar_path))
`

export async function listPros(filter: { city?: string; category?: string } = {}): Promise<ProSummary[]> {
  const supabase = await supabaseServer()
  let query = supabase.from("pros").select(PRO_PUBLIC).eq("published", true).is("suspended_at", null)
  if (filter.city) query = query.eq("city", filter.city)
  if (filter.category) query = query.contains("categories", [filter.category])
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => toProSummary(row as never))
}

export async function getProBySlug(slug: string): Promise<ProDetail | null> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.from("pros").select(PRO_PUBLIC).eq("slug", slug).maybeSingle()
  if (error) throw error
  return data ? toProDetail(data as never) : null
}

export async function listProServices(proId: string): Promise<ListedService[]> {
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
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      booking_id, pro_id, rating, tags, body, photo_paths, reply, created_at,
      accounts!reviews_customer_id_fkey (full_name),
      bookings!inner (template_id, variant_id)
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
