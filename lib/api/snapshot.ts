import { cookies } from "next/headers"
import { getTemplate, getVariant } from "@/lib/catalog"
import { supabaseServer } from "@/lib/supabase/server"
import type {
  ApplicationStatus,
  Booking,
  BookingStatus,
  Casting,
  CastingApplication,
  CastingCompensation,
  CategoryId,
  CustomerAddress,
  JobPost,
  ModelProfile,
  Offer,
  PaymentMethod,
  Pro,
  ProService,
  Review,
  Session,
  UsageScope,
  VerificationStatus,
  Work,
  WorkStats,
} from "@/lib/types"
import { localDate, localTime } from "@/lib/utils"
import type { AddressItem, CustomerReviewItem } from "./types"

/**
 * One server read per page load that the whole UI renders from.
 *
 * The screens still speak in the shapes from lib/types.ts, but every value here
 * comes out of the database. A freelancer is addressed by `slug` in URLs and by
 * `uuid` when calling an RPC, so links stay readable without the client ever
 * having to guess an id.
 */
export const CITY_COOKIE = "dep360_city"

export interface AppSnapshot {
  session: Session | null
  /** Which city the customer is browsing; null means the whole country. */
  city: string | null
  pros: Pro[]
  works: Work[]
  reviews: Review[]
  proServices: ProService[]
  bookings: Booking[]
  jobs: JobPost[]
  addresses: AddressItem[]
  savedWorks: string[]
  followedPros: string[]
  /** Default address, used for distance estimates. Null until one is saved. */
  customerAddress: CustomerAddress | null
  /** The signed-in freelancer's own listings and switches. */
  myServices: ProService[]
  myIdentity: VerificationStatus
  acceptingJobs: boolean
  unreadNotifications: number
  /** Work slug -> interest over the last 30 days, for ranking the feed. */
  workStats: Record<string, WorkStats>
  /** Open casting calls, plus the signed-in freelancer's own closed ones. */
  castings: Casting[]
  /** Categories the signed-in person told us they care about. */
  interests: CategoryId[]
  /**
   * Freelancers' reviews of customers. A freelancer gets the ones they wrote and
   * every review of a customer they have a booking with; a customer gets the
   * ones about themselves. Nobody else, ever.
   */
  customerReviews: CustomerReviewItem[]
}

export const emptySnapshot: AppSnapshot = {
  session: null,
  city: null,
  pros: [],
  works: [],
  reviews: [],
  proServices: [],
  bookings: [],
  jobs: [],
  addresses: [],
  savedWorks: [],
  followedPros: [],
  customerAddress: null,
  myServices: [],
  myIdentity: "none",
  acceptingJobs: true,
  unreadNotifications: 0,
  workStats: {},
  castings: [],
  interests: [],
  customerReviews: [],
}

/**
 * A row from a select with joins. The generated types cannot describe the shape
 * of an arbitrary join, so these reads are deliberately loose; every field is
 * given a fallback below, because a missing column must not blank a screen.
 */
type Row = Record<string, any>

const first = (v: unknown): Row => (Array.isArray(v) ? ((v[0] ?? {}) as Row) : ((v ?? {}) as Row))

const PRO_BASE = `
  id, slug, display_name, avatar_path, title, bio, highlights, categories,
  city, district, lat, lng, areas, home_service, studio_address, max_travel_km,
  years_exp, accepting_jobs, published, identity_status, rating_avg, rating_count,
  completed_jobs, response_minutes, created_at`
const PRO_SELECT = `${PRO_BASE}, equipment`

/**
 * The web can reach production before the 2026-09-23 migrations do (or be
 * rolled back after them). A select naming a column that is not there fails
 * whole -- which once blanked the feed -- so on "undefined column" (42703)
 * read again without the new columns: the new features stay empty, the rest
 * of the site keeps working.
 */
async function orLegacy<T extends { error: { code?: string } | null }>(run: (legacy: boolean) => PromiseLike<T>): Promise<T> {
  const first = await run(false)
  if (first.error?.code === "42703") {
    console.warn("snapshot: new columns missing, reading without them (migrations not applied?)")
    return run(true)
  }
  return first
}

/** Tone used behind an avatar while its image loads. Stable per freelancer. */
const TONES = ["#E9C9C6", "#EBD5C3", "#DCD3E8", "#CFDDD6", "#F0D8C0", "#D8D2C7", "#E4CBD6"]

function toModelProfile(row: Row): ModelProfile {
  return {
    heightCm: row.height_cm ?? null,
    topSize: row.top_size ?? "",
    bottomSize: row.bottom_size ?? "",
    shoeSize: row.shoe_size ?? "",
    styles: row.styles ?? [],
    accepts: row.accepts ?? [],
    refuses: row.refuses ?? [],
  }
}

function toPro(row: Row, model?: Row): Pro & { uuid: string } {
  const index = Math.abs([...String(row.slug)].reduce((n, c) => n + c.charCodeAt(0), 0)) % TONES.length
  return {
    uuid: row.id,
    id: row.slug,
    name: row.display_name || "Chuyên viên",
    title: row.title ?? "",
    // A phone number is not public; it arrives with a booking, for the party
    // entitled to make the call.
    phone: "",
    avatar: row.avatar_path ?? undefined,
    tone: TONES[index],
    categories: (row.categories ?? []) as CategoryId[],
    city: row.city,
    district: row.district,
    areas: row.areas ?? [],
    homeService: Boolean(row.home_service),
    studioAddress: row.studio_address ?? undefined,
    maxTravelKm: Number(row.max_travel_km ?? 10),
    yearsExp: row.years_exp ?? 0,
    acceptingJobs: Boolean(row.accepting_jobs),
    published: Boolean(row.published),
    joinedAt: localDate(row.created_at),
    bio: row.bio ?? "",
    highlights: row.highlights ?? [],
    identity: (row.identity_status ?? "none") as VerificationStatus,
    stats: {
      completedJobs: row.completed_jobs ?? 0,
      responseMinutes: row.response_minutes ?? 0,
    },
    rating: { average: Number(row.rating_avg ?? 0), count: row.rating_count ?? 0 },
    equipment: row.equipment || undefined,
    model: model ? toModelProfile(model) : undefined,
  }
}

const APPLICATION_STATUSES: ApplicationStatus[] = ["pending", "accepted", "rejected", "withdrawn"]
const COMPENSATIONS: CastingCompensation[] = ["free", "discount", "paid"]

function toApplication(row: Row, castingId: string): CastingApplication {
  return {
    id: row.id,
    castingId,
    applicantName: row.applicant_name ?? "Người ứng tuyển",
    message: row.message ?? "",
    status: APPLICATION_STATUSES.includes(row.status) ? row.status : "pending",
    createdAt: row.created_at,
  }
}

/**
 * A query that fails here must not silently return an empty screen: that is how
 * an ambiguous join once made the whole feed look like it had no freelancers.
 */
function rowsOf<T>(label: string, result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) console.error(`snapshot ${label} failed:`, result.error.message)
  return result.data ?? []
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const me = auth.user?.id ?? null
  const city = (await cookies()).get(CITY_COOKIE)?.value ?? null

  const [prosRes, ownProRes, worksRes, reviewsRes, pricesRes, listingsRes, modelsRes, statsRes, castingsRes] =
    await Promise.all([
      orLegacy((legacy) =>
        supabase.from("pros").select(legacy ? PRO_BASE : PRO_SELECT).eq("published", true).is("suspended_at", null),
      ),
      // The caller's own profile is not in that list until it is published, and
      // without it their studio cannot see their own services or works.
      me
        ? orLegacy((legacy) => supabase.from("pros").select(legacy ? PRO_BASE : PRO_SELECT).eq("id", me).maybeSingle())
        : Promise.resolve({ data: null, error: null }),
      orLegacy((legacy) =>
        supabase
          .from("works")
          // Row level security already makes works public; the freelancer's own
          // unpublished ones have to be here too, or they cannot manage them.
          .select(
            `id, slug, pro_id, template_id, title, description, image_paths, sort_order, created_at${legacy ? "" : ", kind, video_path"}`,
          )
          .order("sort_order"),
      ),
      supabase
        .from("reviews")
        // No join: `bookings` is private, and a review has to be readable by
        // anyone looking at the profile.
        .select("booking_id, pro_id, author_name, service_label, rating, tags, body, photo_paths, reply, created_at")
        .is("hidden_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("pro_service_prices").select("pro_id, template_id, variant_id, price"),
      supabase.from("pro_services").select("pro_id, template_id, active"),
      // Separate from the pros query: a failed embed would blank the whole feed.
      supabase
        .from("model_profiles")
        .select("pro_id, height_cm, top_size, bottom_size, shoe_size, styles, accepts, refuses"),
      supabase.rpc("work_stats_30d"),
      supabase
        .from("castings")
        // Row level security decides which calls come back (open ones, the
        // caller's own, the ones they applied to) and which applications (the
        // caller's own, or all of them on the caller's own call).
        .select(`
          id, pro_id, category, title, description, starts_at, city, district, slots,
          compensation, discount_percent, fee, status, accepted_count, created_at,
          casting_applications (id, account_id, applicant_name, message, status, created_at)
        `)
        .order("starts_at")
        .limit(300),
    ])

  const modelOf = new Map(rowsOf("model profiles", modelsRes).map((row: Row) => [row.pro_id as string, row]))
  const pros = rowsOf("pros", prosRes).map((row: Row) => toPro(row, modelOf.get(row.id)))
  if (ownProRes.data && !pros.some((p) => p.id === (ownProRes.data as Row).slug)) {
    const own = ownProRes.data as Row
    pros.push(toPro(own, modelOf.get(own.id)))
  }
  const slugOf = new Map(pros.map((p) => [p.uuid, p.id]))

  const workRows = rowsOf("works", worksRes)
  const works: Work[] = workRows.map((row: Row) => {
    const template = getTemplate(row.template_id)
    return {
      id: row.slug,
      dbId: row.id,
      proId: slugOf.get(row.pro_id) ?? row.pro_id,
      templateId: row.template_id,
      category: (template?.category ?? "nail") as CategoryId,
      title: row.title,
      description: row.description ?? "",
      images: row.image_paths ?? [],
      kind: row.kind === "before_after" ? "before_after" : "work",
      video: row.video_path ?? undefined,
      createdAt: row.created_at ?? new Date(0).toISOString(),
    }
  })

  const reviews: Review[] = rowsOf("reviews", reviewsRes).map((row: Row) => {
    return {
      id: row.booking_id,
      proId: slugOf.get(row.pro_id) ?? row.pro_id,
      bookingId: row.booking_id,
      author: row.author_name ?? "Khách hàng",
      rating: row.rating,
      tags: row.tags ?? [],
      text: row.body,
      date: localDate(row.created_at),
      serviceName: row.service_label ?? "",
      photo: (row.photo_paths ?? [])[0],
      reply: row.reply ?? undefined,
    }
  })

  const priceRows = rowsOf("prices", pricesRes)
  const proServices: ProService[] = rowsOf("listings", listingsRes).map((row: Row) => {
    const slug = slugOf.get(row.pro_id) ?? row.pro_id
    return {
      id: `${slug}:${row.template_id}`,
      proId: slug,
      templateId: row.template_id,
      active: row.active,
      prices: Object.fromEntries(
        priceRows
          .filter((p) => p.pro_id === row.pro_id && p.template_id === row.template_id)
          .map((p) => [p.variant_id, p.price]),
      ),
    }
  })

  const workSlugOf = new Map(workRows.map((w: Row) => [w.id as string, w.slug as string]))

  const workStats: Record<string, WorkStats> = {}
  for (const row of rowsOf<Row>("work stats", statsRes)) {
    const slug = workSlugOf.get(row.work_id)
    if (!slug) continue
    workStats[slug] = {
      impressions: row.impressions ?? 0,
      opens: row.opens ?? 0,
      saves: row.saves ?? 0,
      bookClicks: row.book_clicks ?? 0,
    }
  }

  const castings: Casting[] = rowsOf("castings", castingsRes).map((row: Row) => {
    const applications = ((row.casting_applications ?? []) as Row[]).map((a) => ({
      accountId: a.account_id as string,
      item: toApplication(a, row.id),
    }))
    const own = me ? applications.find((a) => a.accountId === me) : undefined
    return {
      id: row.id,
      proId: slugOf.get(row.pro_id) ?? row.pro_id,
      category: row.category as CategoryId,
      title: row.title,
      description: row.description ?? "",
      date: localDate(row.starts_at),
      time: localTime(row.starts_at),
      city: row.city,
      district: row.district,
      slots: row.slots ?? 1,
      compensation: COMPENSATIONS.includes(row.compensation) ? row.compensation : "free",
      discountPercent: row.discount_percent ?? undefined,
      fee: row.fee ?? undefined,
      status: row.status === "closed" ? "closed" : "open",
      // Only the poster is shown the list; an applicant sees their own below.
      applications: me && row.pro_id === me ? applications.map((a) => a.item) : [],
      myApplication: own?.item,
      acceptedCount: row.accepted_count ?? 0,
      createdAt: row.created_at,
    }
  })

  const base: AppSnapshot = { ...emptySnapshot, city, pros, works, reviews, proServices, workStats, castings }
  if (!me) return base

  // Signed in: their own bookings, requests, addresses and shortlist.
  const [accountRes, bookingsRes, jobsRes, addressesRes, savedRes, followsRes, unreadRes] = await Promise.all([
    orLegacy((legacy) =>
      supabase
        .from("accounts")
        .select(legacy ? "id, full_name, phone, active_role, is_admin" : "id, full_name, phone, active_role, is_admin, interests")
        .eq("id", me)
        .maybeSingle(),
    ),
    orLegacy((legacy) =>
      supabase
        .from("bookings")
        .select(`
          id, customer_id, pro_id, template_id, variant_id, quantity, source, status,
          starts_at, duration_min, at_home, city, district, address, address_note, note,
          service_price, distance_km, travel_fee, urgent_fee, total, commission_rate, commission, payout,
          payment_method, confirm_by, cancel_reason, cancelled_by, reschedule_to, reschedule_by, created_at,
          ${legacy ? "" : "usage_scope, consent_repost, booking_group_id, delivery_due_at, delivered_at, delivery_url, delivery_note, delivery_accepted_at,"}
          customer:accounts!bookings_customer_id_fkey (full_name, phone),
          pro:pros!bookings_pro_id_fkey!inner (slug, display_name, avatar_path, accounts!pros_id_fkey (phone)),
          reviews (booking_id)
        `)
        .or(`customer_id.eq.${me},pro_id.eq.${me}`)
        .order("starts_at", { ascending: false }),
    ),
    supabase
      .from("jobs")
      .select(`
        id, customer_id, template_id, variant_id, quantity, description, starts_at,
        at_home, address_id, city, district, customer_name, payment_method, status, created_at,
        offers (id, pro_id, price, message, status, expires_at, created_at)
      `)
      .order("created_at", { ascending: false }),
    supabase.from("addresses").select("*").eq("account_id", me).order("created_at"),
    supabase.from("saved_works").select("work_id").eq("account_id", me),
    supabase.from("follows").select("pro_id").eq("account_id", me),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("account_id", me).is("read_at", null),
  ])

  // Loose on purpose: the select differs by whether the migrations are in.
  const account = accountRes.data as Row | null
  const myPro = pros.find((p) => p.uuid === me)
  const session: Session | null = account
    ? {
        role: account.active_role === "pro" && myPro ? "pro" : "customer",
        name: account.full_name || "Bạn",
        phone: account.phone,
        proId: myPro?.id,
      }
    : null

  const bookings: Booking[] = rowsOf("bookings", bookingsRes).map((row: Row) => {
    const template = getTemplate(row.template_id)
    const variant = getVariant(row.template_id, row.variant_id)
    const customer = first(row.customer)
    const proRow = first(row.pro)
    const mine = row.customer_id === me
    return {
      id: row.id,
      proId: slugOf.get(row.pro_id) ?? row.pro_id,
      templateId: row.template_id,
      variantId: row.variant_id,
      serviceName: template?.name ?? row.template_id,
      variantLabel: variant?.label ?? row.variant_id,
      category: (template?.category ?? "nail") as CategoryId,
      durationMin: row.duration_min,
      date: localDate(row.starts_at),
      time: localTime(row.starts_at),
      atHome: row.at_home,
      address: row.address,
      note: row.note ?? "",
      quote: {
        servicePrice: row.service_price,
        distanceKm: row.distance_km === null ? null : Number(row.distance_km),
        travelFee: row.travel_fee,
        urgentFee: row.urgent_fee,
        total: row.total,
        commissionRate: Number(row.commission_rate),
        commission: row.commission,
        payout: row.payout,
      },
      paymentMethod: row.payment_method as PaymentMethod,
      status: row.status as BookingStatus,
      customerId: row.customer_id,
      customerName: customer.full_name ?? "Khách hàng",
      // Present for the freelancer, who has to make the call; a customer only
      // ever sees their own number here.
      customerPhone: customer.phone ?? "",
      // Row level security releases this once the job has been accepted.
      proPhone: first(proRow.accounts).phone ?? "",
      proName: proRow.display_name ?? "Chuyên viên",
      mine,
      source: row.source as Booking["source"],
      reviewed: Array.isArray(row.reviews) ? row.reviews.length > 0 : Boolean(row.reviews),
      quantity: row.quantity ?? 1,
      confirmBy: row.confirm_by,
      cancelReason: row.cancel_reason ?? undefined,
      cancelledBy: row.cancelled_by ?? undefined,
      rescheduleTo: row.reschedule_to ?? undefined,
      rescheduleBy: row.reschedule_by ?? undefined,
      createdAt: row.created_at,
      usageScope: (row.usage_scope === "commercial" ? "commercial" : "personal") as UsageScope,
      consentRepost: Boolean(row.consent_repost),
      groupId: row.booking_group_id ?? undefined,
      // Only services that owe files have a delivery step at all.
      delivery: template?.deliveryDays
        ? {
            dueAt: row.delivery_due_at ?? null,
            deliveredAt: row.delivered_at ?? undefined,
            url: row.delivery_url ?? undefined,
            note: row.delivery_note || undefined,
            acceptedAt: row.delivery_accepted_at ?? undefined,
          }
        : undefined,
    }
  })

  // What freelancers said about customers: the caller's own reviews either way
  // round, plus -- for a freelancer -- the history of every customer they have a
  // booking with, so they can see who they are about to go and meet.
  const customersOfMine = [...new Set(bookings.filter((b) => !b.mine).map((b) => b.customerId))]
  const reviewFilter = [`pro_id.eq.${me}`, `customer_id.eq.${me}`]
  if (customersOfMine.length) reviewFilter.push(`customer_id.in.(${customersOfMine.join(",")})`)
  const customerReviewsRes = await supabase
    .from("customer_reviews")
    .select("booking_id, pro_id, customer_id, rating, body, created_at, pro:pros!customer_reviews_pro_id_fkey (slug, display_name)")
    .or(reviewFilter.join(","))
    .order("created_at", { ascending: false })
    .limit(500)
  const customerReviews: CustomerReviewItem[] = rowsOf("customer reviews", customerReviewsRes).map((row: Row) => {
    const pro = first(row.pro)
    return {
      bookingId: row.booking_id,
      customerId: row.customer_id,
      proId: pro.slug ?? slugOf.get(row.pro_id) ?? row.pro_id,
      proName: pro.display_name ?? "Chuyên viên",
      rating: row.rating,
      body: row.body ?? "",
      createdAt: row.created_at,
      mine: row.pro_id === me,
    }
  })

  const jobs: JobPost[] = rowsOf("jobs", jobsRes).map((row: Row) => ({
    id: row.id,
    templateId: row.template_id,
    variantId: row.variant_id,
    description: row.description ?? "",
    date: localDate(row.starts_at),
    time: localTime(row.starts_at),
    city: row.city,
    district: row.district,
    addressDetail: "",
    atHome: row.at_home,
    paymentMethod: row.payment_method as PaymentMethod,
    customerName: row.customer_name ?? "Khách hàng",
    status: row.status === "expired" ? "closed" : (row.status as JobPost["status"]),
    quantity: row.quantity ?? 1,
    mine: row.customer_id === me,
    offers: ((row.offers ?? []) as Row[])
      .filter((o) => o.status !== "withdrawn")
      .map(
        (o): Offer => ({
          id: o.id,
          proId: slugOf.get(o.pro_id) ?? o.pro_id,
          price: o.price,
          message: o.message,
          status: o.status === "rejected" ? "rejected" : (o.status as Offer["status"]),
          createdAt: o.created_at,
        }),
      ),
    createdAt: row.created_at,
  }))

  const addresses: AddressItem[] = rowsOf("addresses", addressesRes).map((row: Row) => ({
    id: row.id,
    label: row.label,
    city: row.city,
    district: row.district,
    detail: row.detail,
    note: row.note ?? "",
    lat: row.lat,
    lng: row.lng,
    isDefault: row.is_default,
  }))
  const preferred = addresses.find((a) => a.isDefault) ?? addresses[0]

  return {
    ...base,
    session,
    bookings,
    jobs,
    addresses,
    customerAddress: preferred ? { city: preferred.city, district: preferred.district, detail: preferred.detail } : null,
    savedWorks: rowsOf("saved", savedRes)
      .map((r) => workSlugOf.get(r.work_id))
      .filter((s): s is string => Boolean(s)),
    followedPros: rowsOf("follows", followsRes)
      .map((r) => slugOf.get(r.pro_id))
      .filter((s): s is string => Boolean(s)),
    myServices: myPro ? proServices.filter((s) => s.proId === myPro.id) : [],
    myIdentity: myPro?.identity ?? "none",
    acceptingJobs: myPro?.acceptingJobs ?? true,
    unreadNotifications: unreadRes.count ?? 0,
    interests: ((account as Row | null)?.interests ?? []) as CategoryId[],
    customerReviews,
  }
}
