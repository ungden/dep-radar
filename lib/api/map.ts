/**
 * Row -> UI shape. Kept in one file so a column rename is one edit, and so the
 * screens never see snake_case or a nullable they have to guess about.
 */
import { getTemplate, getVariant } from "@/lib/catalog"
import type { CategoryId } from "@/lib/types"
import type { AddressItem, BookingItem, BookingQuote, ProDetail, ProSummary, ReviewItem, WorkItem } from "./types"

type Row = Record<string, unknown>

const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : v == null ? fallback : Number(v))
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback)
const strOrNull = (v: unknown) => (typeof v === "string" && v ? v : null)
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [])

/** A joined `accounts` row, which Supabase returns as an object or as an array. */
function joined(v: unknown): Row {
  if (Array.isArray(v)) return (v[0] ?? {}) as Row
  return (v ?? {}) as Row
}

export function toProSummary(row: Row): ProSummary {
  return {
    id: str(row.id),
    slug: str(row.slug),
    name: str(row.display_name, "Chuyên viên"),
    title: str(row.title),
    avatar: strOrNull(row.avatar_path),
    categories: arr(row.categories) as CategoryId[],
    city: str(row.city),
    district: str(row.district),
    areas: arr(row.areas),
    homeService: Boolean(row.home_service),
    studioAddress: strOrNull(row.studio_address),
    maxTravelKm: num(row.max_travel_km, 10),
    yearsExp: num(row.years_exp),
    acceptingJobs: Boolean(row.accepting_jobs),
    identity: (str(row.identity_status, "none") as ProSummary["identity"]),
    rating: { average: num(row.rating_avg), count: num(row.rating_count) },
    stats: { completedJobs: num(row.completed_jobs), responseMinutes: num(row.response_minutes) },
  }
}

export function toProDetail(row: Row): ProDetail {
  return {
    ...toProSummary(row),
    bio: str(row.bio),
    highlights: arr(row.highlights),
    // Not public: a number reaches the customer through their booking.
    phone: null,
    lat: row.lat == null ? null : num(row.lat),
    lng: row.lng == null ? null : num(row.lng),
  }
}

export function toWorkItem(row: Row): WorkItem {
  const pro = joined(row.pros)
  const template = getTemplate(str(row.template_id))
  return {
    id: str(row.slug) || str(row.id),
    proId: str(row.pro_id),
    proSlug: str(pro.slug),
    proName: str(pro.display_name, "Chuyên viên"),
    proAvatar: strOrNull(pro.avatar_path),
    proRating: { average: num(pro.rating_avg), count: num(pro.rating_count) },
    proIdentity: str(pro.identity_status, "none") as WorkItem["proIdentity"],
    templateId: str(row.template_id),
    category: (template?.category ?? "nail") as CategoryId,
    title: str(row.title),
    description: str(row.description),
    images: arr(row.image_paths),
  }
}

export function toReviewItem(row: Row): ReviewItem {
  return {
    bookingId: str(row.booking_id),
    proId: str(row.pro_id),
    author: str(row.author_name, "Khách hàng"),
    rating: num(row.rating),
    tags: arr(row.tags),
    body: str(row.body),
    photos: arr(row.photo_paths),
    reply: strOrNull(row.reply),
    createdAt: str(row.created_at),
    serviceName: str(row.service_label),
  }
}

function toQuote(row: Row): BookingQuote {
  return {
    servicePrice: num(row.service_price),
    distanceKm: row.distance_km == null ? null : num(row.distance_km),
    travelFee: num(row.travel_fee),
    urgentFee: num(row.urgent_fee),
    total: num(row.total),
    commissionRate: num(row.commission_rate),
    commission: num(row.commission),
    payout: num(row.payout),
  }
}

export function toBookingItem(row: Row): BookingItem {
  const template = getTemplate(str(row.template_id))
  const variant = getVariant(str(row.template_id), str(row.variant_id))
  const customer = joined(row.customer)
  const pro = joined(row.pro)
  const proAccount = joined(pro.accounts)
  return {
    id: str(row.id),
    status: str(row.status, "pending") as BookingItem["status"],
    source: str(row.source, "direct") as BookingItem["source"],
    startsAt: str(row.starts_at),
    endsAt: str(row.ends_at),
    durationMin: num(row.duration_min),
    quantity: num(row.quantity, 1),
    atHome: Boolean(row.at_home),
    address: str(row.address),
    addressNote: str(row.address_note),
    city: str(row.city),
    district: str(row.district),
    note: str(row.note),
    quote: toQuote(row),
    paymentMethod: str(row.payment_method, "cash") as BookingItem["paymentMethod"],
    templateId: str(row.template_id),
    variantId: str(row.variant_id),
    serviceName: template?.name ?? str(row.template_id),
    variantLabel: variant?.label ?? str(row.variant_id),
    category: (template?.category ?? "nail") as CategoryId,
    confirmBy: str(row.confirm_by),
    cancelReason: strOrNull(row.cancel_reason),
    cancelledBy: strOrNull(row.cancelled_by) as BookingItem["cancelledBy"],
    rescheduleTo: strOrNull(row.reschedule_to),
    rescheduleBy: strOrNull(row.reschedule_by) as BookingItem["rescheduleBy"],
    reviewed: Array.isArray(row.reviews) ? row.reviews.length > 0 : Boolean(row.reviews),
    customer: {
      id: str(row.customer_id),
      name: str(customer.full_name, "Khách hàng"),
      phone: strOrNull(customer.phone),
    },
    pro: {
      id: str(row.pro_id),
      slug: str(pro.slug),
      name: str(pro.display_name, "Chuyên viên"),
      avatar: strOrNull(pro.avatar_path),
      // Released by row level security once the job has been accepted.
      phone: strOrNull(proAccount.phone),
    },
  }
}

export function toAddressItem(row: Row): AddressItem {
  return {
    id: str(row.id),
    label: str(row.label, "Nhà"),
    city: str(row.city),
    district: str(row.district),
    detail: str(row.detail),
    note: str(row.note),
    lat: row.lat == null ? null : num(row.lat),
    lng: row.lng == null ? null : num(row.lng),
    isDefault: Boolean(row.is_default),
  }
}
