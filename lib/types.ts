export type CategoryId = "nail" | "makeup" | "skincare" | "hair" | "lash-brow" | "massage"

export interface Category {
  id: CategoryId
  label: string
}

// ---------------------------------------------------------------------------
// Service catalogue (owned by dep360). Freelancers can only list services from
// this catalogue and price each option inside its band.

export interface ServiceVariant {
  id: string
  /** e.g. "60 phút", "Đính đá/charm" */
  label: string
  durationMin: number
  minPrice: number
  maxPrice: number
  suggestedPrice: number
  /** Price and duration are per head: the customer picks a head count. */
  perPerson?: boolean
  /** Highest head count accepted (1 for everything but group services). */
  maxQuantity?: number
}

export interface ServiceTemplate {
  id: string
  category: CategoryId
  name: string
  description: string
  includes: string[]
  variants: ServiceVariant[]
  /** Only offered at the freelancer's studio (equipment not portable). */
  studioOnly?: boolean
}

/** A freelancer's listing of one catalogue service. */
export interface ProService {
  id: string
  proId: string
  templateId: string
  /** variantId -> price. Variants missing here are not offered. */
  prices: Record<string, number>
  active: boolean
}

// ---------------------------------------------------------------------------
// Freelancers, trust & ranking

/** Optional identity verification (CCCD + selfie). Verified freelancers get a badge and rank higher. */
export type VerificationStatus = "none" | "pending" | "verified" | "rejected"

export interface ProStats {
  completedJobs: number
  responseMinutes: number
}

export interface RatingSummary {
  average: number
  count: number
}

export interface Pro {
  /** Public, readable id used in URLs. */
  id: string
  /** Database id, used when calling a server action. */
  uuid: string
  name: string
  title: string
  phone: string
  avatar?: string
  tone: string
  categories: CategoryId[]
  city: string
  district: string
  areas: string[]
  homeService: boolean
  studioAddress?: string
  /** Maximum distance the freelancer travels for home service. */
  maxTravelKm: number
  yearsExp: number
  /** Off means the freelancer is not taking new bookings right now. */
  acceptingJobs: boolean
  /** A profile is only listed once it has a service, hours and a photo. */
  published: boolean
  joinedAt: string
  bio: string
  highlights: string[]
  identity: VerificationStatus
  stats: ProStats
  rating: RatingSummary
}

export interface Work {
  /** Readable id used in URLs. */
  id: string
  /** Database id, used when editing or deleting it. */
  dbId: string
  proId: string
  templateId: string
  category: CategoryId
  title: string
  description: string
  images: string[]
}

export interface Review {
  id: string
  proId: string
  bookingId?: string
  author: string
  rating: number
  tags: string[]
  text: string
  date: string
  serviceName: string
  photo?: string
  reply?: string
}

// ---------------------------------------------------------------------------
// Bookings & requests

/** pending: waiting for the freelancer to call and accept. */
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "declined"
  | "cancelled"
  | "expired"
  | "no_show"

export interface PriceQuote {
  servicePrice: number
  distanceKm: number | null
  travelFee: number
  urgentFee: number
  /** What the customer pays. dep360 charges customers no platform fee. */
  total: number
  commissionRate: number
  commission: number
  /** What the freelancer receives: service minus commission, plus all fees. */
  payout: number
}

/** online: customer pays the full amount through dep360 when booking.
 *  cash: customer pays the freelancer directly after the service; the commission
 *  is recorded as the freelancer's debt and netted against online payouts. */
export type PaymentMethod = "online" | "cash"

export interface CustomerAddress {
  city: string
  district: string
  detail: string
}

export interface Booking {
  id: string
  proId: string
  templateId: string
  variantId: string
  serviceName: string
  variantLabel: string
  category: CategoryId
  durationMin: number
  date: string // yyyy-mm-dd
  time: string // HH:mm
  atHome: boolean
  address: string
  note: string
  quote: PriceQuote
  paymentMethod: PaymentMethod
  status: BookingStatus
  customerName: string
  customerPhone: string
  /** The freelancer's name and number as this viewer is allowed to see them. */
  proName: string
  /** Empty until the freelancer has accepted: before that, they call the customer. */
  proPhone: string
  /** true when the signed-in customer created it */
  mine: boolean
  source: "direct" | "job"
  reviewed: boolean
  /** Head count for a per-person service. */
  quantity: number
  /** The freelancer must call and accept before this moment. */
  confirmBy: string
  cancelReason?: string
  cancelledBy?: Role
  /** A start time one side proposed, waiting for the other to answer. */
  rescheduleTo?: string
  rescheduleBy?: Role
  createdAt: string
}

export type OfferStatus = "pending" | "accepted" | "rejected"

export interface Offer {
  id: string
  proId: string
  price: number
  message: string
  status: OfferStatus
  createdAt: string
}

export type JobStatus = "open" | "booked" | "closed"

export interface JobPost {
  id: string
  templateId: string
  variantId: string
  description: string
  date: string
  time: string
  city: string
  district: string
  addressDetail: string
  atHome: boolean
  paymentMethod: PaymentMethod
  customerName: string
  status: JobStatus
  offers: Offer[]
  quantity: number
  mine: boolean
  createdAt: string
}

export type Role = "customer" | "pro"

export interface Session {
  role: Role
  name: string
  phone: string
  /** freelancer profile the pro-mode session manages */
  proId?: string
}
