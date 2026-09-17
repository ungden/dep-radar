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
}

export interface ServiceTemplate {
  id: string
  category: CategoryId
  name: string
  description: string
  includes: string[]
  variants: ServiceVariant[]
  /** Needs a dep360 skill check / certificate before a freelancer can list it. */
  requiresSkillCheck?: boolean
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

export type VerificationId = "phone" | "identity" | "skill" | "hygiene"
export type VerificationStatus = "verified" | "pending" | "none"

export type TierId = "new" | "standard" | "pro" | "top"

export interface ProStats {
  completedJobs: number
  /** 0..1 share of accepted bookings the freelancer cancelled */
  cancellationRate: number
  /** 0..1 share of booking requests answered within 2 hours */
  responseRate: number
  responseMinutes: number
  /** 0..1 share of jobs where the freelancer arrived on time */
  onTimeRate: number
  /** 0..1 share of customers who booked again */
  repeatRate: number
}

export interface RatingSummary {
  average: number
  count: number
  skill: number
  punctuality: number
  hygiene: number
  attitude: number
}

export interface Pro {
  id: string
  name: string
  title: string
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
  joinedAt: string
  bio: string
  highlights: string[]
  verifications: Record<VerificationId, VerificationStatus>
  stats: ProStats
  rating: RatingSummary
}

export interface Work {
  id: string
  proId: string
  templateId: string
  category: CategoryId
  title: string
  description: string
  images: string[]
  likes: number
  comments: number
}

export interface Review {
  id: string
  proId: string
  bookingId?: string
  author: string
  rating: number
  skill: number
  punctuality: number
  hygiene: number
  attitude: number
  tags: string[]
  text: string
  date: string
  serviceName: string
  photo?: string
  reply?: string
}

// ---------------------------------------------------------------------------
// Bookings & requests

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "declined"

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
  /** true when the signed-in customer created it */
  mine: boolean
  source: "direct" | "job"
  reviewed: boolean
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
