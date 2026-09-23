import { getTemplate, getVariant, verticalOf, type BookingStatus, type CategoryId, type PriceQuote } from "@/shared"
import { localDate, localTime } from "./format"
import { imageUrl } from "./links"
import { one, rpc, selectWithFallback, supabase, type Row } from "./supabase"

/** A booking as either side sees it. Same reads as lib/api/bookings.ts. */
export interface BookingItem {
  id: string
  status: BookingStatus
  startsAt: string
  endsAt: string
  date: string
  time: string
  durationMin: number
  quantity: number
  atHome: boolean
  address: string
  addressNote: string
  city: string
  district: string
  note: string
  quote: PriceQuote
  paymentMethod: "online" | "cash"
  templateId: string
  variantId: string
  serviceName: string
  variantLabel: string
  category: CategoryId
  confirmBy: string
  cancelReason: string | null
  cancelledBy: "customer" | "pro" | null
  /**
   * A review of the freelancer exists. The customer sees their own, blind or
   * not; the freelancer sees it only once it is published.
   */
  reviewed: boolean
  /** When that review went public; null while it is blind (or unknown). */
  reviewPublishedAt: string | null
  /** The freelancer's review of the customer, as far as row level security shows it. */
  customerReview: { rating: number; body: string; publishedAt: string | null } | null
  /** A 360dep voucher on this booking: the customer pays total − discount. */
  voucherId: string | null
  discount: number
  createdAt: string
  confirmedAt: string | null
  startedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  /** Photo & video only, and only once the delivery columns exist. */
  delivery: { dueAt: string | null; deliveredAt: string | null; url: string | null; acceptedAt: string | null } | null
  customer: { id: string; name: string; phone: string | null }
  pro: { id: string; slug: string; name: string; avatar?: string; phone: string | null }
}

/**
 * Each side sees the other's number only while the job is live: from the
 * freelancer accepting until it ends, the same window as the chat.
 */
const CONTACT_VISIBLE: BookingStatus[] = ["confirmed", "in_progress"]

const BASE = `
  id, customer_id, pro_id, template_id, variant_id, quantity, source, status,
  starts_at, ends_at, duration_min, at_home, city, district, address, address_note, note,
  service_price, distance_km, travel_fee, urgent_fee, total, commission_rate, commission, payout,
  payment_method, confirm_by, cancel_reason, cancelled_by, created_at,
  confirmed_at, started_at, completed_at, cancelled_at,
  customer:accounts!bookings_customer_id_fkey (full_name, phone),
  pro:pros!bookings_pro_id_fkey!inner (slug, display_name, avatar_path, accounts!pros_id_fkey (phone)),
  reviews (booking_id)
`
const WITH_DELIVERY = `${BASE}, delivery_due_at, delivered_at, delivery_url, delivery_accepted_at`
// 20260925100200_review_rules.sql and 20260925100300_referrals.sql.
const WITH_CONNECTION = `${WITH_DELIVERY.replace("reviews (booking_id)", "reviews (booking_id, published_at)")},
  voucher_id, discount, customer_reviews (booking_id, rating, body, published_at)`
const COLUMN_SETS = [WITH_CONNECTION, WITH_DELIVERY, BASE]

function toBooking(row: Row): BookingItem {
  const template = getTemplate(row.template_id)
  const variant = getVariant(row.template_id, row.variant_id)
  const customer = one(row.customer)
  const pro = one(row.pro)
  const status = (row.status ?? "pending") as BookingStatus
  const category = (template?.category ?? "nail") as CategoryId
  const hasDelivery = "delivery_due_at" in row && verticalOf(category) === "photo"
  const review = Array.isArray(row.reviews) ? (row.reviews[0] as Row | undefined) : (row.reviews as Row | null | undefined)
  const customerReview = Array.isArray(row.customer_reviews) ? (row.customer_reviews[0] as Row | undefined) : (row.customer_reviews as Row | null | undefined)
  return {
    id: row.id,
    status,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? new Date(Date.parse(row.starts_at) + (row.duration_min ?? 0) * 60_000).toISOString(),
    date: localDate(row.starts_at),
    time: localTime(row.starts_at),
    durationMin: row.duration_min ?? 0,
    quantity: row.quantity ?? 1,
    atHome: Boolean(row.at_home),
    address: row.address ?? "",
    addressNote: row.address_note ?? "",
    city: row.city ?? "",
    district: row.district ?? "",
    note: row.note ?? "",
    quote: {
      servicePrice: Number(row.service_price ?? 0),
      distanceKm: row.distance_km == null ? null : Number(row.distance_km),
      travelFee: Number(row.travel_fee ?? 0),
      urgentFee: Number(row.urgent_fee ?? 0),
      total: Number(row.total ?? 0),
      commissionRate: Number(row.commission_rate ?? 0),
      commission: Number(row.commission ?? 0),
      payout: Number(row.payout ?? 0),
    },
    paymentMethod: row.payment_method === "online" ? "online" : "cash",
    templateId: row.template_id,
    variantId: row.variant_id,
    serviceName: template?.name ?? row.template_id,
    variantLabel: variant?.label ?? row.variant_id,
    category,
    confirmBy: row.confirm_by,
    cancelReason: row.cancel_reason ?? null,
    cancelledBy: row.cancelled_by ?? null,
    reviewed: Boolean(review),
    reviewPublishedAt: review?.published_at ?? null,
    customerReview: customerReview
      ? { rating: Number(customerReview.rating ?? 0), body: customerReview.body ?? "", publishedAt: customerReview.published_at ?? null }
      : null,
    voucherId: row.voucher_id ?? null,
    discount: Number(row.discount ?? 0),
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at ?? null,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    cancelledAt: row.cancelled_at ?? null,
    delivery: hasDelivery
      ? {
          dueAt: row.delivery_due_at ?? null,
          deliveredAt: row.delivered_at ?? null,
          url: row.delivery_url ?? null,
          acceptedAt: row.delivery_accepted_at ?? null,
        }
      : null,
    customer: { id: row.customer_id, name: customer.full_name || "Khách hàng", phone: CONTACT_VISIBLE.includes(status) ? customer.phone || null : null },
    pro: {
      id: row.pro_id,
      slug: pro.slug ?? "",
      name: pro.display_name || "Chuyên viên",
      avatar: imageUrl(pro.avatar_path, "avatars"),
      phone: CONTACT_VISIBLE.includes(status) ? one(pro.accounts).phone || null : null,
    },
  }
}

export async function listBookings(uid: string, as: "customer" | "pro"): Promise<BookingItem[]> {
  const rows = await selectWithFallback(
    "bookings",
    (c) =>
      supabase
        .from("bookings")
        .select(c)
        .eq(as === "customer" ? "customer_id" : "pro_id", uid)
        .order("starts_at", { ascending: false })
        .limit(200),
    COLUMN_SETS,
  )
  return rows.map((r) => toBooking(r))
}

export async function getBooking(id: string, _uid: string): Promise<BookingItem | null> {
  const rows = await selectWithFallback("booking", (c) => supabase.from("bookings").select(c).eq("id", id).limit(1), COLUMN_SETS)
  const row = rows[0]
  return row ? toBooking(row) : null
}

// Writes: the same RPCs, with the same arguments, as lib/api/actions.ts.

/** Bookable start times for one day, generated from the freelancer's own hours. */
export async function fetchSlots(input: {
  proUuid: string
  templateId: string
  variantId: string
  quantity: number
  date: string
  atHome: boolean
  addressId: string | null
}): Promise<{ startsAt: string; time: string }[]> {
  let lat: number | null = null
  let lng: number | null = null
  if (input.atHome && input.addressId) {
    const { data } = await supabase.from("addresses").select("lat, lng").eq("id", input.addressId).maybeSingle()
    lat = (data as Row | null)?.lat ?? null
    lng = (data as Row | null)?.lng ?? null
  }
  if (lat == null || lng == null) {
    // No address yet: which hours are free, measured from the freelancer. Whether
    // they travel to a particular address is checked again by create_booking.
    const { data } = await supabase.from("pros").select("lat, lng").eq("id", input.proUuid).maybeSingle()
    lat = (data as Row | null)?.lat ?? null
    lng = (data as Row | null)?.lng ?? null
  }
  const { data, error } = await supabase.rpc("free_slots", {
    p_pro: input.proUuid,
    p_template: input.templateId,
    p_variant: input.variantId,
    p_quantity: input.quantity,
    p_date: input.date,
    p_at_home: input.atHome,
    p_lat: lat ?? undefined,
    p_lng: lng ?? undefined,
  })
  if (error) throw new Error("Không tải được giờ trống. Thử lại nhé.")
  return ((data ?? []) as string[]).map((startsAt) => ({ startsAt, time: localTime(startsAt) }))
}

export const createBooking = (input: {
  proUuid: string
  templateId: string
  variantId: string
  startsAt: string
  atHome: boolean
  addressId: string | null
  quantity: number
  note: string
}) =>
  rpc<string>("create_booking", {
    p_pro: input.proUuid,
    p_template: input.templateId,
    p_variant: input.variantId,
    p_starts_at: input.startsAt,
    p_at_home: input.atHome,
    p_address_id: input.addressId,
    p_quantity: input.quantity,
    p_note: input.note,
    p_payment: "cash",
  })

export const cancelBooking = (id: string, reason: string) => rpc("cancel_booking", { p_booking: id, p_reason: reason })
export const confirmBooking = (id: string) => rpc("confirm_booking", { p_booking: id })
export const declineBooking = (id: string, reason: string) => rpc("decline_booking", { p_booking: id, p_reason: reason })
export const startBooking = (id: string) => rpc("start_booking", { p_booking: id })
export const completeBooking = (id: string) => rpc("complete_booking", { p_booking: id })

// How a job ends from the customer's side (20260925100100_booking_finish.sql).
export const confirmBookingDone = (id: string) => rpc("confirm_booking_done", { p_booking: id })
export const reportProNoShow = (id: string, detail: string) => rpc("report_pro_no_show", { p_booking: id, p_detail: detail })
/** The customer's answer to being marked absent, within 24 hours (20260924100700_no_show_hold.sql). */
export const disputeNoShow = (id: string, reason: string) => rpc<string>("dispute_no_show", { p_booking: id, p_reason: reason })

/** Whether the caller already disputed this no-show: their own reports are readable to them. */
export async function hasDisputedNoShow(bookingId: string, uid: string): Promise<boolean> {
  const { data } = await supabase
    .from("reports")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("reporter_id", uid)
    .eq("reason", "no_show_dispute")
    .limit(1)
  return Boolean(data?.length)
}

/** The freelancer's review of the customer: blind until the customer's is in, or 14 days. */
export const reviewCustomer = (id: string, rating: number, body: string) =>
  rpc("review_customer", { p_booking: id, p_rating: rating, p_body: body })

// Vouchers (20260925100300_referrals.sql).
export const applyVoucher = (bookingId: string, voucherId: string) => rpc("apply_voucher", { p_booking: bookingId, p_voucher: voucherId })
export const removeVoucher = (bookingId: string) => rpc("remove_voucher", { p_booking: bookingId })

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã nhận lịch",
  in_progress: "Đang làm",
  completed: "Hoàn thành",
  declined: "Bị từ chối",
  cancelled: "Đã huỷ",
  expired: "Hết hạn xác nhận",
  no_show: "Vắng mặt",
}

export const isUpcoming = (b: BookingItem) => ["pending", "confirmed", "in_progress"].includes(b.status)
