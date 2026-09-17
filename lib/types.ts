export type CategoryId = "nail" | "makeup" | "skincare" | "hair" | "lash-brow"

export interface Category {
  id: CategoryId
  label: string
  short: string
}

export interface Pro {
  id: string
  name: string
  title: string
  categories: CategoryId[]
  city: string
  district: string
  areas: string[]
  rating: number
  reviewCount: number
  followers: number
  completedJobs: number
  yearsExp: number
  bio: string
  tags: string[]
  homeService: boolean
  studioAddress?: string
  responseTime: string
  verified: boolean
  tone: string
}

export interface Service {
  id: string
  proId: string
  category: CategoryId
  name: string
  description: string
  durationMin: number
  price: number
  active?: boolean
}

export interface Work {
  id: string
  proId: string
  serviceId: string
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
  author: string
  rating: number
  text: string
  date: string
  serviceName: string
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "declined"

export interface Booking {
  id: string
  proId: string
  serviceId: string | null
  serviceName: string
  category: CategoryId
  durationMin: number
  date: string // yyyy-mm-dd
  time: string // HH:mm
  atHome: boolean
  address: string
  note: string
  total: number
  deposit: number
  status: BookingStatus
  customerName: string
  customerPhone: string
  /** true when the signed-in customer created it */
  mine: boolean
  source: "direct" | "job"
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
  category: CategoryId
  title: string
  description: string
  date: string
  time: string
  city: string
  district: string
  atHome: boolean
  budgetMin: number
  budgetMax: number
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
