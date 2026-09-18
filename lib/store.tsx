"use client"

import * as React from "react"
import { getTemplate, getVariant, isPriceAllowed } from "./catalog"
import { DEMO_CUSTOMER, DEMO_PRO_ID, PRO_SERVICES, REVIEWS, getPro } from "./data"
import { travelDistanceKm } from "./geo"
import { buildQuote, isUrgent } from "./pricing"
import { mergeRating } from "./trust"
import type {
  Booking,
  CustomerAddress,
  JobPost,
  Offer,
  PaymentMethod,
  PriceQuote,
  Pro,
  ProService,
  Review,
  Session,
  VerificationStatus,
} from "./types"
import { addDays, todayISO, uid } from "./utils"

export interface AppState {
  version: 6
  session: Session | null
  savedWorks: string[]
  followedPros: string[]
  city: string | null
  /** null until the customer actually enters one; distances are never guessed. */
  customerAddress: CustomerAddress | null
  bookings: Booking[]
  jobs: JobPost[]
  /** Listings of the demo freelancer (editable in Studio). */
  myServices: ProService[]
  /** Identity verification status of the demo freelancer. */
  myIdentity: VerificationStatus
  acceptingJobs: boolean
  /** Reviews written in this session. */
  reviews: Review[]
  /** Freelancer replies written in this session, by review id. */
  replies: Record<string, string>
}

const STORAGE_KEY = "dep360:v6"

// ---------------------------------------------------------------------------
// Derived helpers (pure, take state)

/** Pro with session changes applied (verification submissions, new reviews). */
export function proView(s: AppState, proId: string): Pro | undefined {
  const base = getPro(proId)
  if (!base) return undefined
  const extra = s.reviews.filter((r) => r.proId === proId)
  return {
    ...base,
    identity: proId === DEMO_PRO_ID ? s.myIdentity : base.identity,
    rating: mergeRating(base.rating, extra),
  }
}

export function servicesOf(s: AppState, proId: string, includeInactive = false): ProService[] {
  const list = proId === DEMO_PRO_ID ? s.myServices : PRO_SERVICES.filter((x) => x.proId === proId)
  return list.filter((x) => includeInactive || x.active)
}

export function priceOf(s: AppState, proId: string, templateId: string, variantId: string): number | null {
  const svc = servicesOf(s, proId).find((x) => x.templateId === templateId)
  return svc?.prices[variantId] ?? null
}

/** Lowest price of a template (or of all services) a freelancer offers. */
export function fromPrice(s: AppState, proId: string, templateId?: string): number | null {
  const prices = servicesOf(s, proId)
    .filter((x) => !templateId || x.templateId === templateId)
    .flatMap((x) => Object.values(x.prices))
  return prices.length ? Math.min(...prices) : null
}

export function reviewsOf(s: AppState, proId: string): Review[] {
  const fresh = s.reviews.filter((r) => r.proId === proId)
  const seed = REVIEWS.filter((r) => r.proId === proId)
  return [...fresh, ...seed].map((r) => (s.replies[r.id] ? { ...r, reply: s.replies[r.id] } : r))
}

export function distanceToCustomer(s: AppState, proId: string, address: CustomerAddress | null = s.customerAddress) {
  const pro = getPro(proId)
  if (!pro || !address) return null
  return travelDistanceKm(pro.city, pro.district, address.city, address.district)
}

export type HomeAvailability = { ok: true } | { ok: false; reason: string }

export function homeAvailability(s: AppState, proId: string, templateId: string, address: CustomerAddress): HomeAvailability {
  const pro = getPro(proId)!
  const template = getTemplate(templateId)
  if (!pro.homeService) return { ok: false, reason: `${pro.name} chỉ nhận làm tại studio.` }
  if (template?.studioOnly) return { ok: false, reason: `Dịch vụ này cần thiết bị tại studio.` }
  const km = travelDistanceKm(pro.city, pro.district, address.city, address.district)
  if (km === null) return { ok: false, reason: `${pro.name} chỉ nhận khách tại ${pro.city}.` }
  if (km > pro.maxTravelKm) return { ok: false, reason: `Khoảng ${km.toLocaleString("vi-VN")} km, vượt phạm vi di chuyển tối đa ${pro.maxTravelKm} km của ${pro.name}.` }
  return { ok: true }
}

export function quoteFor(
  s: AppState,
  input: { proId: string; price: number; atHome: boolean; address: CustomerAddress; date: string; time: string },
): PriceQuote {
  const pro = getPro(input.proId)!
  return buildQuote({
    servicePrice: input.price,
    atHome: input.atHome,
    distanceKm: input.atHome ? travelDistanceKm(pro.city, pro.district, input.address.city, input.address.district) : null,
    urgent: isUrgent(input.date, input.time),
  })
}

/** Slots already taken for a freelancer on a given day. */
export function takenSlots(s: AppState, proId: string, date: string): Set<string> {
  const taken = new Set<string>()
  for (const b of s.bookings) {
    if (b.proId === proId && b.date === date && (b.status === "pending" || b.status === "confirmed")) taken.add(b.time)
  }
  return taken
}

export const TIME_SLOTS = ["08:00", "09:00", "10:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30"]

export const formatAddress = (a: CustomerAddress) => [a.detail, a.district, a.city].filter(Boolean).join(", ")

// ---------------------------------------------------------------------------
// Seed

function seedState(): AppState {
  const t = todayISO()
  const now = new Date().toISOString()
  const base: Omit<AppState, "bookings" | "jobs"> = {
    version: 6,
    session: null,
    savedWorks: [],
    followedPros: [],
    city: null,
    customerAddress: null,
    myServices: PRO_SERVICES.filter((x) => x.proId === DEMO_PRO_ID).map((x) => ({ ...x, prices: { ...x.prices } })),
    myIdentity: getPro(DEMO_PRO_ID)!.identity,
    acceptingJobs: true,
    reviews: [],
    replies: {},
  }
  const draft = { ...base, bookings: [], jobs: [] } as AppState

  const booking = (
    id: string,
    proId: string,
    templateId: string,
    variantId: string,
    date: string,
    time: string,
    status: Booking["status"],
    opts: { customer?: [string, string]; address?: CustomerAddress; atHome?: boolean; note?: string; reviewed?: boolean; pay?: PaymentMethod } = {},
  ): Booking => {
    const tpl = getTemplate(templateId)!
    const variant = getVariant(templateId, variantId)!
    const pro = getPro(proId)!
    const atHome = opts.atHome ?? true
    const address = opts.address ?? DEMO_CUSTOMER.address
    const price = priceOf(draft, proId, templateId, variantId)!
    const quote = buildQuote({
      servicePrice: price,
      atHome,
      distanceKm: atHome ? travelDistanceKm(pro.city, pro.district, address.city, address.district) : null,
      urgent: false,
    })
    return {
      id,
      proId,
      templateId,
      variantId,
      serviceName: tpl.name,
      variantLabel: variant.label,
      category: tpl.category,
      durationMin: variant.durationMin,
      date,
      time,
      atHome,
      address: atHome ? formatAddress(address) : (pro.studioAddress ?? `${pro.district}, ${pro.city}`),
      note: opts.note ?? "",
      quote,
      paymentMethod: opts.pay ?? "cash",
      status,
      customerName: opts.customer?.[0] ?? DEMO_CUSTOMER.name,
      customerPhone: opts.customer?.[1] ?? DEMO_CUSTOMER.phone,
      mine: !opts.customer,
      source: "direct",
      reviewed: opts.reviewed ?? false,
      createdAt: now,
    }
  }
  const hn = (district: string, detail: string): CustomerAddress => ({ city: "Hà Nội", district, detail })

  const offer = (proId: string, price: number, message: string): Offer => ({
    id: `of-${proId}`,
    proId,
    price: price * 1000,
    message,
    status: "pending",
    createdAt: now,
  })
  const job = (j: Omit<JobPost, "createdAt" | "status" | "offers" | "customerName" | "mine" | "atHome" | "paymentMethod"> & Partial<JobPost>): JobPost => ({
    status: "open",
    offers: [],
    createdAt: now,
    customerName: DEMO_CUSTOMER.name,
    mine: false,
    atHome: true,
    paymentMethod: "cash",
    ...j,
  })

  return {
    ...base,
    bookings: [
      booking("bk-1001", "linh-pham", "nail-design", "stone", addDays(t, 2), "16:00", "confirmed"),
      booking("bk-1002", "thu-anh", "makeup-party", "makeup", addDays(t, 5), "10:30", "pending"),
      booking("bk-1003", "mai-tran", "skin-basic", "60m", addDays(t, -12), "14:30", "completed", {
        address: { city: "TP.HCM", district: "Quận 3", detail: "45 Võ Văn Tần" },
      }),
      booking("bk-1004", "quynh-vu", "hair-wash", "45m", addDays(t, -20), "09:00", "cancelled", { atHome: false }),
      booking("bk-2001", "linh-pham", "nail-gel", "hand", addDays(t, 1), "09:00", "pending", {
        customer: ["Trà My", "0987 111 222"],
        address: hn("Đống Đa", "Ngõ 12 Láng Hạ"),
      }),
      booking("bk-2002", "linh-pham", "nail-removal", "remove-care", t, "13:00", "confirmed", {
        customer: ["Hoàng Yến", "0936 222 333"],
        atHome: false,
      }),
      booking("bk-2003", "linh-pham", "nail-design", "simple", addDays(t, 3), "10:30", "pending", {
        customer: ["Kim Oanh", "0977 333 444"],
        address: hn("Cầu Giấy", "56 Trần Duy Hưng"),
        note: "Muốn làm mẫu milky giống ảnh trên trang",
      }),
      booking("bk-2004", "linh-pham", "nail-extension", "builder", addDays(t, -3), "17:30", "completed", {
        customer: ["Thanh Hương", "0904 444 555"],
        address: hn("Hai Bà Trưng", "21 Bạch Mai"),
        reviewed: true,
      }),
      booking("bk-2005", "linh-pham", "nail-design", "art", addDays(t, -6), "16:00", "completed", {
        customer: ["Ngân Hà", "0915 555 666"],
        address: hn("Long Biên", "8 Nguyễn Văn Cừ"),
        reviewed: true,
      }),
    ],
    jobs: [
      job({
        id: "job-501",
        mine: true,
        templateId: "makeup-party",
        variantId: "makeup-hair",
        description: "Mình da dầu, muốn makeup trong trẻo, tóc búi thấp. Làm tại nhà trước 10h.",
        date: addDays(t, 9),
        time: "08:00",
        city: "Hà Nội",
        district: "Cầu Giấy",
        addressDetail: "12 Xuân Thủy",
        offers: [offer("thu-anh", 800, "Chị làm được cả makeup và búi tóc, có kit cho da dầu. Đến trước 7h45 nhé.")],
      }),
      job({
        id: "job-502",
        templateId: "nail-design",
        variantId: "simple",
        description: "3 bạn phù dâu, sơn gel tone hồng sữa đồng bộ. Giá cho mỗi người.",
        date: addDays(t, 6),
        time: "14:30",
        city: "Hà Nội",
        district: "Đống Đa",
        addressDetail: "Ngõ 5 Thái Hà",
        customerName: "Phương Thảo",
      }),
      job({
        id: "job-503",
        templateId: "nail-gel",
        variantId: "hand",
        description: "Móng ngắn, muốn tone nude đi làm. Sau 19h mới rảnh.",
        date: addDays(t, 2),
        time: "19:00",
        city: "Hà Nội",
        district: "Thanh Xuân",
        addressDetail: "Royal City",
        customerName: "Bích Ngọc",
      }),
      job({
        id: "job-504",
        templateId: "nail-removal",
        variantId: "remove-care",
        description: "Móng đang yếu sau khi đắp bột, cần tháo và dưỡng.",
        date: addDays(t, 1),
        time: "17:30",
        city: "Hà Nội",
        district: "Cầu Giấy",
        addressDetail: "Chung cư Mandarin",
        customerName: "Thu Trang",
      }),
      job({
        id: "job-505",
        templateId: "makeup-photo",
        variantId: "group",
        description: "Nhóm 5 người chụp kỷ yếu, concept nữ sinh trong trẻo.",
        date: addDays(t, 11),
        time: "08:00",
        city: "Hà Nội",
        district: "Cầu Giấy",
        addressDetail: "ĐH Sư phạm",
        customerName: "Minh Anh",
      }),
      job({
        id: "job-506",
        templateId: "skin-basic",
        variantId: "90m",
        description: "Mẹ 55 tuổi da khô, muốn chăm sóc thư giãn 2 lần/tháng.",
        date: addDays(t, 4),
        time: "09:00",
        city: "TP.HCM",
        district: "Quận 7",
        addressDetail: "Sunrise City",
        customerName: "Gia Hân",
      }),
      job({
        id: "job-507",
        templateId: "massage-neck",
        variantId: "90m",
        description: "Ngồi máy tính nhiều, đau cổ vai. Làm buổi tối sau giờ làm.",
        date: addDays(t, 1),
        time: "20:30",
        city: "TP.HCM",
        district: "Phú Nhuận",
        addressDetail: "Phan Xích Long",
        customerName: "Hoàng Nam",
      }),
    ],
  }
}

// ---------------------------------------------------------------------------
// External store

type Listener = () => void
let state: AppState | null = null
let loaded = false
const listeners = new Set<Listener>()
const serverSnapshot = seedState()

function getState(): AppState {
  if (!state) state = serverSnapshot
  return state
}

function loadFromStorage() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.version === 6) state = parsed
    }
    for (const old of ["dep360:v1", "dep360:v2", "dep360:v3", "dep360:v4", "dep360:v5"]) window.localStorage.removeItem(old)
  } catch {
    // Storage unavailable (private mode): keep the in-memory seed.
  }
  hydrated = true
  listeners.forEach((l) => l())
}

function setState(updater: (s: AppState) => AppState) {
  state = updater(getState())
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** true once localStorage has been read on the client; false during SSR/first paint. */
let hydrated = false

export function StoreProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    loadFromStorage()
  }, [])
  return <>{children}</>
}

export function useHydrated() {
  return React.useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  )
}

/** Whole app state; derive with helpers above (snapshots must be stable). */
export function useApp(): AppState {
  return React.useSyncExternalStore(subscribe, getState, () => serverSnapshot)
}

// ---------------------------------------------------------------------------
// Actions

export const actions = {
  signIn(session: Session) {
    setState((s) => ({ ...s, session }))
  },
  signOut() {
    setState((s) => ({ ...s, session: null }))
  },
  switchRole() {
    setState((s) => {
      if (!s.session) return s
      const pro = getPro(DEMO_PRO_ID)!
      return {
        ...s,
        session:
          s.session.role === "pro"
            ? { role: "customer", name: DEMO_CUSTOMER.name, phone: DEMO_CUSTOMER.phone }
            : { role: "pro", name: pro.name, phone: "0968 000 111", proId: DEMO_PRO_ID },
      }
    })
  },
  toggleSaveWork(id: string) {
    setState((s) => ({
      ...s,
      savedWorks: s.savedWorks.includes(id) ? s.savedWorks.filter((x) => x !== id) : [id, ...s.savedWorks],
    }))
  },
  toggleFollow(proId: string) {
    setState((s) => ({
      ...s,
      followedPros: s.followedPros.includes(proId) ? s.followedPros.filter((x) => x !== proId) : [proId, ...s.followedPros],
    }))
  },
  setCity(city: string | null) {
    setState((s) => ({ ...s, city }))
  },
  setCustomerAddress(address: CustomerAddress) {
    setState((s) => ({ ...s, customerAddress: address }))
  },

  /** Returns the booking id, or an error message when the request breaks a rule. */
  createBooking(input: {
    proId: string
    templateId: string
    variantId: string
    date: string
    time: string
    atHome: boolean
    address: CustomerAddress
    note: string
    paymentMethod: PaymentMethod
  }): { id: string } | { error: string } {
    const s = getState()
    const pro = getPro(input.proId)
    const tpl = getTemplate(input.templateId)
    const variant = getVariant(input.templateId, input.variantId)
    const price = priceOf(s, input.proId, input.templateId, input.variantId)
    if (!pro || !tpl || !variant || price === null) return { error: "Dịch vụ không còn được cung cấp." }
    if (input.proId === DEMO_PRO_ID && !s.acceptingJobs) return { error: `${pro.name} đang tạm nghỉ nhận lịch.` }
    if (input.atHome) {
      const home = homeAvailability(s, input.proId, input.templateId, input.address)
      if (!home.ok) return { error: home.reason }
    } else if (!pro.studioAddress) {
      return { error: `${pro.name} không có studio, chỉ làm tại nhà.` }
    }
    if (takenSlots(s, input.proId, input.date).has(input.time)) return { error: "Khung giờ này vừa có người đặt." }
    const id = uid("bk")
    const booking: Booking = {
      id,
      proId: input.proId,
      templateId: input.templateId,
      variantId: input.variantId,
      serviceName: tpl.name,
      variantLabel: variant.label,
      category: tpl.category,
      durationMin: variant.durationMin,
      date: input.date,
      time: input.time,
      atHome: input.atHome,
      address: input.atHome ? formatAddress(input.address) : pro.studioAddress!,
      note: input.note,
      quote: quoteFor(s, { proId: input.proId, price, atHome: input.atHome, address: input.address, date: input.date, time: input.time }),
      paymentMethod: input.paymentMethod,
      status: "pending",
      customerName: s.session?.role === "customer" ? s.session.name : DEMO_CUSTOMER.name,
      customerPhone: s.session?.role === "customer" ? s.session.phone : DEMO_CUSTOMER.phone,
      mine: true,
      source: "direct",
      reviewed: false,
      createdAt: new Date().toISOString(),
    }
    setState((st) => ({
      ...st,
      bookings: [booking, ...st.bookings],
      customerAddress: input.atHome ? input.address : st.customerAddress,
    }))
    return { id }
  },
  setBookingStatus(id: string, status: Booking["status"]) {
    setState((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)) }))
  },

  createJob(input: Omit<JobPost, "id" | "customerName" | "status" | "offers" | "mine" | "createdAt">): string {
    const id = uid("job")
    setState((s) => ({
      ...s,
      jobs: [
        {
          ...input,
          id,
          mine: true,
          customerName: s.session?.role === "customer" ? s.session.name : DEMO_CUSTOMER.name,
          status: "open",
          offers: [],
          createdAt: new Date().toISOString(),
        },
        ...s.jobs,
      ],
    }))
    return id
  },
  closeJob(jobId: string) {
    setState((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, status: "closed" } : j)) }))
  },
  sendOffer(jobId: string, price: number, message: string): string | null {
    const s = getState()
    const job = s.jobs.find((j) => j.id === jobId)
    const variant = job && getVariant(job.templateId, job.variantId)
    if (!job || !variant) return "Yêu cầu không tồn tại."
    if (!isPriceAllowed(variant, price)) return "Giá phải nằm trong khung giá của dep360 và làm tròn tới 5.000đ."
    setState((st) => ({
      ...st,
      jobs: st.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              offers: [
                ...j.offers.filter((o) => o.proId !== DEMO_PRO_ID),
                { id: uid("of"), proId: DEMO_PRO_ID, price, message, status: "pending", createdAt: new Date().toISOString() },
              ],
            }
          : j,
      ),
    }))
    return null
  },
  withdrawOffer(jobId: string) {
    setState((s) => ({
      ...s,
      jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, offers: j.offers.filter((o) => o.proId !== DEMO_PRO_ID) } : j)),
    }))
  },
  /** Customer accepts a freelancer's offer: the request becomes a confirmed booking. */
  acceptOffer(jobId: string, offerId: string): string | null {
    const s = getState()
    const job = s.jobs.find((j) => j.id === jobId)
    const offer = job?.offers.find((o) => o.id === offerId)
    if (!job || !offer || job.status !== "open") return null
    const tpl = getTemplate(job.templateId)!
    const variant = getVariant(job.templateId, job.variantId)!
    const pro = getPro(offer.proId)!
    const address: CustomerAddress = { city: job.city, district: job.district, detail: job.addressDetail }
    const id = uid("bk")
    const booking: Booking = {
      id,
      proId: offer.proId,
      templateId: job.templateId,
      variantId: job.variantId,
      serviceName: tpl.name,
      variantLabel: variant.label,
      category: tpl.category,
      durationMin: variant.durationMin,
      date: job.date,
      time: job.time,
      atHome: job.atHome,
      address: job.atHome ? formatAddress(address) : (pro.studioAddress ?? `${pro.district}, ${pro.city}`),
      note: job.description,
      quote: quoteFor(s, { proId: offer.proId, price: offer.price, atHome: job.atHome, address, date: job.date, time: job.time }),
      paymentMethod: job.paymentMethod,
      status: "confirmed",
      customerName: job.customerName,
      customerPhone: DEMO_CUSTOMER.phone,
      mine: job.mine,
      source: "job",
      reviewed: false,
      createdAt: new Date().toISOString(),
    }
    setState((st) => ({
      ...st,
      bookings: [booking, ...st.bookings],
      jobs: st.jobs.map((j) =>
        j.id === jobId
          ? { ...j, status: "booked", offers: j.offers.map((o) => ({ ...o, status: o.id === offerId ? "accepted" : "rejected" })) }
          : j,
      ),
    }))
    return id
  },

  /** Create or update a listing. Prices outside the dep360 band are rejected. */
  saveProService(templateId: string, prices: Record<string, number>, active = true): string | null {
    const tpl = getTemplate(templateId)
    const pro = proView(getState(), DEMO_PRO_ID)!
    if (!tpl) return "Dịch vụ không có trong danh mục dep360."
    if (!pro.categories.includes(tpl.category)) return "Dịch vụ không thuộc chuyên môn đã đăng ký."
    const entries = Object.entries(prices)
    if (!entries.length) return "Chọn ít nhất một gói."
    for (const [variantId, price] of entries) {
      const variant = tpl.variants.find((x) => x.id === variantId)
      if (!variant) return "Gói không hợp lệ."
      if (!isPriceAllowed(variant, price)) return `Giá gói "${variant.label}" phải từ ${variant.minPrice.toLocaleString("vi-VN")}đ đến ${variant.maxPrice.toLocaleString("vi-VN")}đ.`
    }
    setState((s) => {
      const exists = s.myServices.some((x) => x.templateId === templateId)
      const next: ProService = { id: `${DEMO_PRO_ID}:${templateId}`, proId: DEMO_PRO_ID, templateId, prices, active }
      return {
        ...s,
        myServices: exists ? s.myServices.map((x) => (x.templateId === templateId ? next : x)) : [...s.myServices, next],
      }
    })
    return null
  },
  toggleProService(templateId: string) {
    setState((s) => ({
      ...s,
      myServices: s.myServices.map((x) => (x.templateId === templateId ? { ...x, active: !x.active } : x)),
    }))
  },
  removeProService(templateId: string) {
    setState((s) => ({ ...s, myServices: s.myServices.filter((x) => x.templateId !== templateId) }))
  },
  setAcceptingJobs(value: boolean) {
    setState((s) => ({ ...s, acceptingJobs: value }))
  },
  setMyIdentity(status: VerificationStatus) {
    setState((s) => ({ ...s, myIdentity: status }))
  },

  submitReview(bookingId: string, input: Pick<Review, "rating" | "tags" | "text">): string | null {
    const s = getState()
    const b = s.bookings.find((x) => x.id === bookingId)
    if (!b || !b.mine) return "Không tìm thấy lịch hẹn."
    if (b.status !== "completed") return "Chỉ đánh giá được lịch hẹn đã hoàn thành."
    if (b.reviewed) return "Bạn đã đánh giá lịch hẹn này."
    const review: Review = {
      ...input,
      id: uid("rv"),
      proId: b.proId,
      bookingId,
      author: b.customerName,
      date: todayISO(),
      serviceName: `${b.serviceName} · ${b.variantLabel}`,
    }
    setState((st) => ({
      ...st,
      reviews: [review, ...st.reviews],
      bookings: st.bookings.map((x) => (x.id === bookingId ? { ...x, reviewed: true } : x)),
    }))
    return null
  },
  replyReview(reviewId: string, text: string) {
    setState((s) => ({ ...s, replies: { ...s.replies, [reviewId]: text } }))
  },
  resetDemo() {
    setState(() => seedState())
  },
}
