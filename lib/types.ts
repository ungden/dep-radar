/**
 * 360dep books people who help you look good on camera, in three trades:
 * beauty (the original business), photo & video, and models.
 */
export type VerticalId = "beauty" | "photo" | "model"

export type CategoryId =
  // beauty
  | "nail"
  | "makeup"
  | "skincare"
  | "hair"
  | "lash-brow"
  | "massage"
  // photo & video
  | "photophone"
  | "camera"
  | "short-video"
  | "product-photo"
  // models
  | "model-photo"
  | "model-video"

export interface Vertical {
  id: VerticalId
  label: string
  /** What someone in this trade is called on a card: "thợ", "người chụp", "mẫu". */
  person: string
}

export interface Category {
  id: CategoryId
  label: string
  vertical: VerticalId
  /** For a small tile, where the full label would wrap or be cut. */
  short?: string
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
  /**
   * Done at a place the customer picks (a café, a park, the shop) rather than
   * at their home. Same booking rules as home service; different words.
   */
  onLocation?: boolean
  /** What the customer receives afterwards, e.g. "Toàn bộ ảnh gốc + 20 ảnh chỉnh". */
  deliverable?: string
  /** Days the freelancer has, after the session, to hand the files over. */
  deliveryDays?: number
  /** Only an identity-verified freelancer may list it (models). */
  requiresVerification?: boolean
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
  /** Photo & video: what they shoot with, e.g. "iPhone 16 Pro Max". */
  equipment?: string
  /** Present when the freelancer works as a model. */
  model?: ModelProfile
}

/**
 * What a client needs to cast a model. Body measurements are deliberately not
 * collected: they are not needed to book, and they are the data most often
 * abused on casting boards.
 */
export interface ModelProfile {
  heightCm: number | null
  topSize: string
  bottomSize: string
  shoeSize: string
  styles: string[]
  /** Kinds of work they take, in their own words ("Lookbook", "Mẫu tay"). */
  accepts: string[]
  /** Kinds of work they turn down. Shown so nobody has to ask. */
  refuses: string[]
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
  /** before_after: images[0] is before, images[1] is after. */
  kind: WorkKind
  /** A clip of up to 60 seconds, shown instead of the first image. */
  video?: string
  createdAt: string
}

export type WorkKind = "work" | "before_after"

/** Interest a post has earned in the last 30 days. Counts only, no people. */
export interface WorkStats {
  impressions: number
  opens: number
  saves: number
  bookClicks: number
}

export type WorkEventKind = "impression" | "open" | "save" | "book_click"

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
  customerId: string
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
  /** Personal use, or the images/clips will be used to sell something. */
  usageScope: UsageScope
  /** The customer agreed the freelancer may post the result as their work. */
  consentRepost: boolean
  /** Bookings made together (makeup + photos at the same time and place). */
  groupId?: string
  /** Photo & video only: the files owed after the session. */
  delivery?: Delivery
  /** When the job was completed; both reviews are due within 14 days of it. */
  completedAt?: string
  /** When it was cancelled, declined or marked a no-show. */
  cancelledAt?: string
  /**
   * A 360dep voucher on this booking. The customer pays the freelancer
   * total - discount; 360dep adds the discount to the freelancer's wallet when
   * the job is completed. 0 without one.
   */
  discount: number
  voucherId?: string
  /** The customer's review of this job, as far as the viewer may see it (a freelancer: once published). */
  review?: BookingReview
  /** The customer has disputed the freelancer's no-show report. */
  disputed?: boolean
}

export interface BookingReview {
  rating: number
  tags: string[]
  text: string
  photos: string[]
  /** Null while blind: written, but not shown to anyone else yet. */
  publishedAt: string | null
}

export type UsageScope = "personal" | "commercial"

export interface Delivery {
  /** Set when the session is completed: completed + the service's delivery days. */
  dueAt: string | null
  deliveredAt?: string
  url?: string
  note?: string
  acceptedAt?: string
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
  quantity: number
  /**
   * What the customer pays per person, fixed when posting: the first freelancer
   * to take the request works for this. Null before the match-then-chat
   * migration (supabase/migrations/20260926100000).
   */
  price: number | null
  /** The booking made when a freelancer took it. */
  bookingId: string | null
  /** How many freelancers were told about it; null when the database does not say. */
  notified: number | null
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

// ---------------------------------------------------------------------------
// Casting calls ("Tuyển mẫu").
// A freelancer needs a model: a nail artist who wants hands to practise on and
// photograph, a photographer building a portfolio. The model is paid in kind
// (a free or discounted service) or in money. Customers apply; the freelancer
// picks. It is the request board turned around.

export type CastingCompensation = "free" | "discount" | "paid"
export type CastingStatus = "open" | "closed"
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn"

export interface CastingApplication {
  id: string
  castingId: string
  applicantName: string
  message: string
  status: ApplicationStatus
  createdAt: string
}

export interface Casting {
  id: string
  proId: string
  category: CategoryId
  title: string
  description: string
  date: string
  time: string
  city: string
  district: string
  /** How many models are wanted. */
  slots: number
  compensation: CastingCompensation
  /** For "discount": percent off the freelancer's listed price. */
  discountPercent?: number
  /** For "paid": what the model receives, in đồng. */
  fee?: number
  status: CastingStatus
  /** Only the freelancer who posted it sees these. */
  applications: CastingApplication[]
  /** The signed-in customer's own application, if any. */
  myApplication?: CastingApplication
  acceptedCount: number
  createdAt: string
}
