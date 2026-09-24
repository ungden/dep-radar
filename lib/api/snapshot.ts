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
  PaymentMethod,
  Pro,
  ProService,
  Review,
  ReviewStatus,
  Session,
  UsageScope,
  VerificationStatus,
  Work,
  WorkStats,
} from "@/lib/types"
import { bookingChatOpen } from "@/lib/connection"
import { localDate, localTime } from "@/lib/utils"
import { orLegacy } from "./errors"
import type { AddressItem, CustomerReviewItem, PlatformSettings, TimeBlock, VoucherItem } from "./types"

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
  /** The signed-in freelancer's own busy time from now on, soonest first. */
  myTimeBlocks: TimeBlock[]
  /** Wallet top-up and support details; every field null until the owner fills them in. */
  platform: PlatformSettings
  /** Account ids the signed-in person has blocked. */
  blockedAccounts: string[]
  /** The signed-in person's 360dep vouchers, newest first, used and expired included. */
  vouchers: VoucherItem[]
  /**
   * Where the signed-in account stands with Giới thiệu bạn bè. Null when
   * signed out, or before the referral migration (so nothing is claimed).
   */
  referral: { referredBy: string | null; joinedAt: string } | null
  /**
   * The signed-in freelancer's wallet: below zero means a fee is owed and no
   * new job can be accepted until it is paid. `payCode` is what the transfer
   * memo carries (payMemo); null before the match-then-chat migration. Null
   * for a customer, or when the balance could not be read.
   */
  myWallet: { balance: number; payCode: string | null } | null
}

export const emptyPlatform: PlatformSettings = {
  topupBankBin: null,
  topupAccountNo: null,
  topupAccountName: null,
  bankLinked: false,
  supportZalo: null,
  supportEmail: null,
  companyName: null,
  companyTaxId: null,
  companyAddress: null,
  referralEnabled: false,
  referralCustomerAmount: 0,
  referralProAmount: 0,
  referralMinTotal: 0,
  referralMonthlyCap: 0,
  voucherDays: 0,
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
  myTimeBlocks: [],
  platform: emptyPlatform,
  blockedAccounts: [],
  vouchers: [],
  referral: null,
  myWallet: null,
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
/** The caller's own profile also carries where its review stands (20260929100000). */
const OWN_PRO_SELECT = `${PRO_SELECT}, review_status, review_note`
const REVIEW_STATUSES: ReviewStatus[] = ["draft", "pending", "approved", "changes_requested", "rejected"]

/*
 * Reads go through orLegacy (./errors) where they name columns a migration
 * added, so the site keeps working on a database that is behind the code.
 * The generations, newest first: 1 = the 2026-09-25 connection rules (blind
 * reviews, vouchers, referrals), 2 = the 2026-09-23 trades (delivery, usage,
 * interests, equipment, clips). A query with one step drops only its own new
 * columns.
 */

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
    reviewStatus: REVIEW_STATUSES.includes(row.review_status) ? row.review_status : undefined,
    reviewNote: row.review_note || undefined,
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

  const [prosRes, ownProRes, worksRes, reviewsRes, pricesRes, listingsRes, modelsRes, statsRes, castingsRes, platformRes] =
    await Promise.all([
      orLegacy((legacy) =>
        supabase.from("pros").select(legacy ? PRO_BASE : PRO_SELECT).eq("published", true).is("suspended_at", null),
      ),
      // The caller's own profile is not in that list until it is published, and
      // without it their studio cannot see their own services or works.
      // Generations: 1 = before the review columns, 2 = before equipment.
      me
        ? orLegacy(
            (legacy) =>
              supabase
                .from("pros")
                .select(legacy >= 2 ? PRO_BASE : legacy ? PRO_SELECT : OWN_PRO_SELECT)
                .eq("id", me)
                .maybeSingle(),
            2,
          )
        : Promise.resolve({ data: null, error: null }),
      orLegacy((legacy) =>
        supabase
          .from("works")
          // Row level security already makes works public; the freelancer's own
          // unpublished ones have to be here too, or they cannot manage them.
          // Generations: 1 = before hidden posts (20260929100000), 2 = before clips.
          .select(
            `id, slug, pro_id, template_id, title, description, image_paths, sort_order, created_at${legacy >= 2 ? "" : ", kind, video_path"}${legacy ? "" : ", hidden_at, hidden_reason"}`,
          )
          .order("sort_order"),
        2,
      ),
      orLegacy((legacy) =>
        supabase
          .from("reviews")
          // No join: `bookings` is private, and a review has to be readable by
          // anyone looking at the profile.
          .select(
            `booking_id, pro_id, author_name, service_label, rating, tags, body, photo_paths, reply, created_at${legacy ? "" : ", published_at"}`,
          )
          .is("hidden_at", null)
          .order("created_at", { ascending: false }),
      ),
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
      orLegacy((legacy) =>
        supabase
          .from("platform_settings")
          .select(
            `topup_bank_bin, topup_account_no, topup_account_name, support_zalo, support_email, company_name, company_tax_id, company_address${
              legacy ? "" : ", referral_enabled, referral_customer_amount, referral_pro_amount, referral_min_total, referral_monthly_cap, voucher_days"
            }`,
          )
          .maybeSingle(),
      ),
    ])

  const modelOf = new Map(rowsOf("model profiles", modelsRes).map((row: Row) => [row.pro_id as string, row]))
  const pros = rowsOf("pros", prosRes).map((row: Row) => toPro(row, modelOf.get(row.id)))
  if (ownProRes.data) {
    // Their own row, even when they are also in the public list: it carries the review.
    const own = ownProRes.data as Row
    const at = pros.findIndex((p) => p.id === own.slug)
    if (at === -1) pros.push(toPro(own, modelOf.get(own.id)))
    else pros[at] = toPro(own, modelOf.get(own.id))
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
      hiddenReason: row.hidden_at ? row.hidden_reason || "Bài đăng chưa phù hợp với quy định của 360dep." : undefined,
    }
  })

  // The public list: a blind review is readable by its author (row level
  // security), but it is not on the profile until it is published.
  const publicReviews = rowsOf<Row>("reviews", reviewsRes).filter((row) => row.published_at !== null)
  const reviews: Review[] = publicReviews.map((row: Row) => {
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

  // Missing before its migration is applied: the pages then show no bank details,
  // which is what they showed before.
  if (platformRes.error) console.error("snapshot platform settings failed:", platformRes.error.message)
  const settings = platformRes.data as Row | null
  const platform: PlatformSettings = settings
    ? {
        topupBankBin: settings.topup_bank_bin,
        topupAccountNo: settings.topup_account_no,
        topupAccountName: settings.topup_account_name,
        // The key is what app/api/payments/sepay checks; without it that route answers 503.
        bankLinked: Boolean(process.env.SEPAY_WEBHOOK_KEY) && Boolean(settings.topup_account_no),
        supportZalo: settings.support_zalo,
        supportEmail: settings.support_email,
        companyName: settings.company_name,
        companyTaxId: settings.company_tax_id,
        companyAddress: settings.company_address,
        referralEnabled: Boolean(settings.referral_enabled),
        referralCustomerAmount: settings.referral_customer_amount ?? 0,
        referralProAmount: settings.referral_pro_amount ?? 0,
        referralMinTotal: settings.referral_min_total ?? 0,
        referralMonthlyCap: settings.referral_monthly_cap ?? 0,
        voucherDays: settings.voucher_days ?? 0,
      }
    : emptyPlatform

  const base: AppSnapshot = { ...emptySnapshot, city, pros, works, reviews, proServices, workStats, castings, platform }
  if (!me) return base

  // Signed in: their own bookings, requests, addresses and shortlist.
  const [
    accountRes,
    bookingsRes,
    jobsRes,
    addressesRes,
    savedRes,
    followsRes,
    unreadRes,
    blocksRes,
    blockedRes,
    vouchersRes,
    disputesRes,
    walletRes,
    payCodeRes,
  ] = await Promise.all([
    orLegacy(
      (legacy) =>
        supabase
          .from("accounts")
          .select(
            `id, full_name, phone, active_role, is_admin, created_at${legacy >= 2 ? "" : ", interests"}${legacy >= 1 ? "" : ", referred_by"}`,
          )
          .eq("id", me)
          .maybeSingle(),
      2,
    ),
    orLegacy(
      (legacy) =>
        supabase
          .from("bookings")
          .select(`
            id, customer_id, pro_id, template_id, variant_id, quantity, source, status,
            starts_at, duration_min, at_home, city, district, address, address_note, note,
            service_price, distance_km, travel_fee, urgent_fee, total, commission_rate, commission, payout,
            payment_method, confirm_by, cancel_reason, cancelled_by, cancelled_at, completed_at,
            reschedule_to, reschedule_by, created_at,
            ${legacy >= 2 ? "" : "usage_scope, consent_repost, booking_group_id, delivery_due_at, delivered_at, delivery_url, delivery_note, delivery_accepted_at,"}
            ${legacy >= 1 ? "" : "discount, voucher_id,"}
            customer:accounts!bookings_customer_id_fkey (full_name, phone),
            pro:pros!bookings_pro_id_fkey!inner (slug, display_name, avatar_path, accounts!pros_id_fkey (phone)),
            reviews (booking_id, rating, tags, body, photo_paths${legacy >= 1 ? "" : ", published_at"})
          `)
          .or(`customer_id.eq.${me},pro_id.eq.${me}`)
          .order("starts_at", { ascending: false }),
      2,
    ),
    // Generation 1 = the 2026-09-26 match-then-chat columns (price, booking, call-out).
    orLegacy((legacy) =>
      supabase
        .from("jobs")
        .select(`
          id, customer_id, template_id, variant_id, quantity, description, starts_at,
          at_home, address_id, city, district, customer_name, payment_method, status, created_at
          ${legacy ? "" : ", price, booking_id, notified"}
        `)
        .order("created_at", { ascending: false }),
    ),
    supabase.from("addresses").select("*").eq("account_id", me).order("created_at"),
    supabase.from("saved_works").select("work_id").eq("account_id", me),
    supabase.from("follows").select("pro_id").eq("account_id", me),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("account_id", me).is("read_at", null),
    // Row level security returns only the caller's own; empty for a customer.
    supabase
      .from("time_blocks")
      .select("id, starts_at, ends_at, note")
      .eq("pro_id", me)
      .gt("ends_at", new Date().toISOString())
      .order("starts_at")
      .limit(200),
    supabase.from("user_blocks").select("blocked").eq("blocker", me),
    // Row level security returns only the caller's own. Missing before the
    // referral migration, which reads as none.
    supabase
      .from("vouchers")
      .select("id, amount, min_total, expires_at, booking_id, used_at, note, created_at")
      .eq("account_id", me)
      .order("created_at", { ascending: false })
      .limit(100),
    // The customer's own no-show disputes, so the form is not offered twice.
    supabase.from("reports").select("booking_id").eq("reporter_id", me).eq("reason", "no_show_dispute"),
    // A freelancer's wallet and the code their fee transfers carry. Only the
    // caller's own: my_wallet_balance reads auth.uid().
    ownProRes.data ? supabase.rpc("my_wallet_balance" as never, {} as never) : Promise.resolve({ data: null, error: null }),
    ownProRes.data
      ? supabase.from("pros").select("pay_code").eq("id", me).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
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
        login: {
          email: auth.user?.email ?? null,
          pendingEmail: auth.user?.new_email ?? null,
          password: Boolean(
            (auth.user?.app_metadata?.providers as string[] | undefined)?.includes("email") ||
              auth.user?.identities?.some((i) => i.provider === "email"),
          ),
        },
      }
    : null

  const disputed = new Set(rowsOf<Row>("disputes", disputesRes).map((row) => row.booking_id as string))
  const bookings: Booking[] = rowsOf("bookings", bookingsRes).map((row: Row) => {
    const template = getTemplate(row.template_id)
    const review = first(row.reviews)
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
      // The other side's number only while the two are matched (accepted and
      // not yet over), the same window as the chat. A customer always has
      // their own.
      customerPhone: mine || bookingChatOpen(row.status) ? (customer.phone ?? "") : "",
      proPhone: !mine || bookingChatOpen(row.status) ? (first(proRow.accounts).phone ?? "") : "",
      proName: proRow.display_name ?? "Chuyên viên",
      mine,
      source: row.source as Booking["source"],
      reviewed: Boolean(review.booking_id),
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
      completedAt: row.completed_at ?? undefined,
      cancelledAt: row.cancelled_at ?? undefined,
      discount: Number(row.discount ?? 0),
      voucherId: row.voucher_id ?? undefined,
      review: review.booking_id
        ? {
            rating: review.rating,
            tags: review.tags ?? [],
            text: review.body ?? "",
            photos: review.photo_paths ?? [],
            // Before blind reviews, a review was public as soon as it was written.
            publishedAt: review.published_at === undefined ? (row.completed_at ?? row.created_at) : review.published_at,
          }
        : undefined,
      disputed: disputed.has(row.id),
    }
  })

  // What freelancers said about customers: the caller's own reviews either way
  // round, plus -- for a freelancer -- the history of every customer they have a
  // booking with, so they can see who they are about to go and meet.
  const customersOfMine = [...new Set(bookings.filter((b) => !b.mine).map((b) => b.customerId))]
  const reviewFilter = [`pro_id.eq.${me}`, `customer_id.eq.${me}`]
  if (customersOfMine.length) reviewFilter.push(`customer_id.in.(${customersOfMine.join(",")})`)
  const customerReviewsRes = await orLegacy((legacy) =>
    supabase
      .from("customer_reviews")
      .select(
        `booking_id, pro_id, customer_id, rating, body, created_at${legacy ? "" : ", published_at"}, pro:pros!customer_reviews_pro_id_fkey (slug, display_name)`,
      )
      .or(reviewFilter.join(","))
      .order("created_at", { ascending: false })
      .limit(500),
  )
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
      publishedAt: row.published_at === undefined ? row.created_at : row.published_at,
    }
  })

  const jobs: JobPost[] = rowsOf<Row>("jobs", jobsRes).map((row: Row) => ({
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
    price: row.price ?? null,
    bookingId: row.booking_id ?? null,
    notified: row.notified ?? null,
    mine: row.customer_id === me,
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
    myTimeBlocks: rowsOf("time blocks", blocksRes).map((row) => ({
      id: row.id,
      date: localDate(row.starts_at),
      from: localTime(row.starts_at),
      to: localTime(row.ends_at),
      note: row.note ?? "",
    })),
    blockedAccounts: rowsOf("blocks", blockedRes).map((row) => row.blocked),
    vouchers: rowsOf<Row>("vouchers", vouchersRes).map((row) => ({
      id: row.id,
      amount: row.amount,
      minTotal: row.min_total ?? 0,
      expiresAt: row.expires_at,
      bookingId: row.booking_id ?? null,
      usedAt: row.used_at ?? null,
      note: row.note ?? "",
      createdAt: row.created_at,
    })),
    // Without the referral columns there is nothing to claim against.
    referral: account && "referred_by" in account ? { referredBy: account.referred_by ?? null, joinedAt: account.created_at } : null,
    myWallet:
      ownProRes.data && !walletRes.error
        ? { balance: Number(walletRes.data ?? 0), payCode: ((payCodeRes.data as Row | null)?.pay_code as string | undefined) ?? null }
        : null,
  }
}
