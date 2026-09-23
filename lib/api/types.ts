/**
 * Shapes the UI reads. They are deliberately close to the prototype's types in
 * lib/types.ts so screens can move over one at a time, but every number here
 * comes from the database rather than from a constant in the bundle.
 */
import type { CategoryId, PaymentMethod, VerificationStatus } from "@/lib/types"

export interface ProSummary {
  id: string
  slug: string
  name: string
  title: string
  avatar: string | null
  categories: CategoryId[]
  city: string
  district: string
  areas: string[]
  homeService: boolean
  studioAddress: string | null
  maxTravelKm: number
  yearsExp: number
  acceptingJobs: boolean
  identity: VerificationStatus
  rating: { average: number; count: number }
  stats: { completedJobs: number; responseMinutes: number }
}

export interface ProDetail extends ProSummary {
  bio: string
  highlights: string[]
  /** Only present for the freelancer and the customer of a confirmed booking. */
  phone: string | null
  lat: number | null
  lng: number | null
}

export interface ListedService {
  templateId: string
  active: boolean
  /** variantId -> price the freelancer charges. */
  prices: Record<string, number>
}

export interface WorkItem {
  id: string
  proId: string
  proSlug: string
  proName: string
  proAvatar: string | null
  proRating: { average: number; count: number }
  proIdentity: VerificationStatus
  templateId: string
  category: CategoryId
  title: string
  description: string
  images: string[]
}

export interface ReviewItem {
  bookingId: string
  proId: string
  author: string
  rating: number
  tags: string[]
  body: string
  photos: string[]
  reply: string | null
  createdAt: string
  serviceName: string
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "declined"
  | "cancelled"
  | "expired"
  | "no_show"

export interface BookingQuote {
  servicePrice: number
  distanceKm: number | null
  travelFee: number
  urgentFee: number
  total: number
  commissionRate: number
  commission: number
  payout: number
}

export interface BookingItem {
  id: string
  status: BookingStatus
  source: "direct" | "job"
  startsAt: string
  endsAt: string
  durationMin: number
  quantity: number
  atHome: boolean
  address: string
  addressNote: string
  city: string
  district: string
  note: string
  quote: BookingQuote
  paymentMethod: PaymentMethod
  templateId: string
  variantId: string
  serviceName: string
  variantLabel: string
  category: CategoryId
  confirmBy: string
  cancelReason: string | null
  cancelledBy: "customer" | "pro" | null
  rescheduleTo: string | null
  rescheduleBy: "customer" | "pro" | null
  reviewed: boolean
  customer: { id: string; name: string; phone: string | null }
  pro: { id: string; slug: string; name: string; avatar: string | null; phone: string | null }
}

/** A freelancer's review of a customer, after a completed job. Never public. */
export interface CustomerReviewItem {
  bookingId: string
  /** Account id of the customer it is about. */
  customerId: string
  /** Slug of the freelancer who wrote it. */
  proId: string
  proName: string
  rating: number
  body: string
  createdAt: string
  /** Written by the signed-in freelancer. */
  mine: boolean
  /** Null while blind: only its author sees it until the customer reviews too, or 14 days pass. */
  publishedAt: string | null
}

export interface AddressItem {
  id: string
  label: string
  city: string
  district: string
  detail: string
  note: string
  lat: number | null
  lng: number | null
  isDefault: boolean
}

export interface WalletSummary {
  balance: number
  entries: {
    id: string
    kind: "topup" | "commission" | "adjustment" | "refund" | "no_show_comp" | "voucher" | "referral"
    amount: number
    note: string
    createdAt: string
    bookingId: string | null
  }[]
}

export interface NotificationItem {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  readAt: string | null
  createdAt: string
}

/**
 * Time the signed-in freelancer marked busy outside 360dep. Shown in Vietnam
 * time: a block that runs past midnight shows `to` on the next day's clock.
 */
export interface TimeBlock {
  id: string
  /** yyyy-mm-dd, Vietnam time, of the start. */
  date: string
  /** HH:mm, Vietnam time. */
  from: string
  /** HH:mm, Vietnam time. */
  to: string
  note: string
}

/** The platform's own details (wallet top-up, support, company). Null means not set: show nothing. */
export interface PlatformSettings {
  topupBankBin: string | null
  topupAccountNo: string | null
  topupAccountName: string | null
  /**
   * The bank's webhook is switched on (SEPAY_WEBHOOK_KEY is set and there is an
   * account to pay into): a transfer with the right memo credits the wallet by
   * itself. False means staff record it by hand.
   */
  bankLinked: boolean
  supportZalo: string | null
  supportEmail: string | null
  companyName: string | null
  companyTaxId: string | null
  companyAddress: string | null
  /** Giới thiệu bạn bè. Off (and every amount 0) until its migration is in. */
  referralEnabled: boolean
  /** Voucher each side gets when a referred customer's first booking is completed. */
  referralCustomerAmount: number
  /** Wallet credit (or voucher) each side gets when a referred freelancer has done 3 jobs. */
  referralProAmount: number
  /** The smallest booking a referral counts for, and a voucher can be used on. */
  referralMinTotal: number
  /** Rewards one person can earn by inviting, per calendar month. */
  referralMonthlyCap: number
  /** How long a voucher lasts. */
  voucherDays: number
}

/** A 360dep voucher: money off one booking, paid to the freelancer by 360dep. */
export interface VoucherItem {
  id: string
  amount: number
  /** Only for a booking whose total is at least this. */
  minTotal: number
  expiresAt: string
  /** The booking it is on, while that booking is going ahead. */
  bookingId: string | null
  usedAt: string | null
  note: string
  createdAt: string
}

/** One reward from Giới thiệu bạn bè, seen from the signed-in side. */
export interface ReferralRewardItem {
  /** The friend booked as a customer, or worked as a freelancer. */
  kind: "customer" | "pro"
  /** I invited them (true), or they invited me. */
  iInvited: boolean
  /** What I received. */
  amount: number
  createdAt: string
}
