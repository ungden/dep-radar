import { cookies } from "next/headers"
import { getTemplate, getVariant } from "@/lib/catalog"
import { supabaseServer } from "@/lib/supabase/server"
import type {
  Booking,
  BookingStatus,
  CategoryId,
  CustomerAddress,
  JobPost,
  Offer,
  PaymentMethod,
  Pro,
  ProService,
  Review,
  Session,
  VerificationStatus,
  Work,
} from "@/lib/types"
import { localDate, localTime } from "@/lib/utils"
import type { AddressItem } from "./types"

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
}

/**
 * A row from a select with joins. The generated types cannot describe the shape
 * of an arbitrary join, so these reads are deliberately loose; every field is
 * given a fallback below, because a missing column must not blank a screen.
 */
type Row = Record<string, any>

const first = (v: unknown): Row => (Array.isArray(v) ? ((v[0] ?? {}) as Row) : ((v ?? {}) as Row))

const PRO_SELECT = `
  id, slug, display_name, avatar_path, title, bio, highlights, categories,
  city, district, lat, lng, areas, home_service, studio_address, max_travel_km,
  years_exp, accepting_jobs, published, identity_status, rating_avg, rating_count,
  completed_jobs, response_minutes, created_at
`

/** Tone used behind an avatar while its image loads. Stable per freelancer. */
const TONES = ["#E9C9C6", "#EBD5C3", "#DCD3E8", "#CFDDD6", "#F0D8C0", "#D8D2C7", "#E4CBD6"]

function toPro(row: Row): Pro & { uuid: string } {
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

  const [prosRes, ownProRes, worksRes, reviewsRes, pricesRes, listingsRes] = await Promise.all([
    supabase.from("pros").select(PRO_SELECT).eq("published", true).is("suspended_at", null),
    // The caller's own profile is not in that list until it is published, and
    // without it their studio cannot see their own services or works.
    me
      ? supabase.from("pros").select(PRO_SELECT).eq("id", me).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("works")
      // Row level security already makes works public; the freelancer's own
      // unpublished ones have to be here too, or they cannot manage them.
      .select("id, slug, pro_id, template_id, title, description, image_paths, sort_order")
      .order("sort_order"),
    supabase
      .from("reviews")
      // No join: `bookings` is private, and a review has to be readable by
      // anyone looking at the profile.
      .select("booking_id, pro_id, author_name, service_label, rating, tags, body, photo_paths, reply, created_at")
      .is("hidden_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("pro_service_prices").select("pro_id, template_id, variant_id, price"),
    supabase.from("pro_services").select("pro_id, template_id, active"),
  ])

  const pros = rowsOf("pros", prosRes).map(toPro)
  if (ownProRes.data && !pros.some((p) => p.id === (ownProRes.data as Row).slug)) {
    pros.push(toPro(ownProRes.data as Row))
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

  const base: AppSnapshot = { ...emptySnapshot, city, pros, works, reviews, proServices }
  if (!me) return base

  // Signed in: their own bookings, requests, addresses and shortlist.
  const [accountRes, bookingsRes, jobsRes, addressesRes, savedRes, followsRes, unreadRes] = await Promise.all([
    supabase.from("accounts").select("id, full_name, phone, active_role, is_admin").eq("id", me).maybeSingle(),
    supabase
      .from("bookings")
      .select(`
        id, customer_id, pro_id, template_id, variant_id, quantity, source, status,
        starts_at, duration_min, at_home, city, district, address, address_note, note,
        service_price, distance_km, travel_fee, urgent_fee, total, commission_rate, commission, payout,
        payment_method, confirm_by, cancel_reason, cancelled_by, reschedule_to, reschedule_by, created_at,
        customer:accounts!bookings_customer_id_fkey (full_name, phone),
        pro:pros!bookings_pro_id_fkey!inner (slug, display_name, avatar_path, accounts!pros_id_fkey (phone)),
        reviews (booking_id)
      `)
      .or(`customer_id.eq.${me},pro_id.eq.${me}`)
      .order("starts_at", { ascending: false }),
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

  const account = accountRes.data
  const myPro = pros.find((p) => p.uuid === me)
  const session: Session | null = account
    ? {
        role: account.active_role === "pro" && myPro ? "pro" : "customer",
        name: account.full_name || "Bạn",
        phone: account.phone,
        proId: myPro?.id,
      }
    : null

  const workSlugOf = new Map(workRows.map((w: Row) => [w.id, w.slug]))

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
  }
}
