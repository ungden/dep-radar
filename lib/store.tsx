"use client"

import * as React from "react"
import { DEMO_PRO_ID, SERVICES, getPro } from "./data"
import type { Booking, CategoryId, JobPost, Offer, Service, Session } from "./types"
import { addDays, todayISO, uid } from "./utils"

export interface AppState {
  version: 1
  session: Session | null
  onboarded: boolean
  savedWorks: string[]
  followedPros: string[]
  bookings: Booking[]
  jobs: JobPost[]
  /** Services of the demo freelancer; editable in freelancer mode. */
  myServices: Service[]
  acceptingJobs: boolean
  city: string | null
}

const STORAGE_KEY = "dep360:v1"
const CUSTOMER = { name: "Nguyễn Phương", phone: "0912 345 678", address: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội" }
export const DEMO_CUSTOMER = CUSTOMER

function seedState(): AppState {
  const t = todayISO()
  const now = new Date().toISOString()
  const svc = (id: string) => SERVICES.find((s) => s.id === id)!
  const booking = (
    id: string,
    serviceId: string,
    date: string,
    time: string,
    status: Booking["status"],
    extra: Partial<Booking> = {},
  ): Booking => {
    const s = svc(serviceId)
    return {
      id,
      proId: s.proId,
      serviceId,
      serviceName: s.name,
      category: s.category,
      durationMin: s.durationMin,
      date,
      time,
      atHome: true,
      address: CUSTOMER.address,
      note: "",
      total: s.price,
      deposit: Math.round((s.price * 0.3) / 1000) * 1000,
      status,
      customerName: CUSTOMER.name,
      customerPhone: CUSTOMER.phone,
      mine: true,
      source: "direct",
      createdAt: now,
      ...extra,
    }
  }
  const other = (name: string, phone: string, address: string) => ({
    mine: false,
    customerName: name,
    customerPhone: phone,
    address,
  })

  const job = (j: Omit<JobPost, "createdAt" | "status" | "offers"> & Partial<JobPost>): JobPost => ({
    status: "open",
    offers: [],
    createdAt: now,
    ...j,
  })
  const offer = (proId: string, price: number, message: string): Offer => ({
    id: uid("of"),
    proId,
    price,
    message,
    status: "pending",
    createdAt: now,
  })

  return {
    version: 1,
    session: null,
    onboarded: false,
    savedWorks: ["w-milky-stone", "w-party-glow"],
    followedPros: ["linh-pham"],
    myServices: SERVICES.filter((s) => s.proId === DEMO_PRO_ID).map((s) => ({ ...s, active: true })),
    acceptingJobs: true,
    city: null,
    bookings: [
      booking("bk-1001", "lp-design", addDays(t, 2), "16:00", "confirmed"),
      booking("bk-1002", "ta-party", addDays(t, 5), "10:00", "pending"),
      booking("bk-1003", "mt-facial", addDays(t, -12), "15:00", "completed", { address: "45 Võ Văn Tần, Quận 3, TP.HCM" }),
      booking("bk-1004", "qv-wash", addDays(t, -20), "09:00", "cancelled", { address: "12 Lê Lợi, Quận 1, TP.HCM" }),
      booking("bk-2001", "lp-basic", addDays(t, 1), "09:00", "pending", other("Trà My", "0987 111 222", "Ngõ 12 Láng Hạ, Đống Đa, Hà Nội")),
      booking("bk-2002", "lp-care", t, "14:00", "confirmed", { ...other("Hoàng Yến", "0936 222 333", "Ngõ 88 Nguyễn Trãi, Thanh Xuân"), atHome: false }),
      booking("bk-2003", "lp-design", addDays(t, 3), "10:30", "pending", { ...other("Kim Oanh", "0977 333 444", "56 Trần Duy Hưng, Cầu Giấy, Hà Nội"), note: "Muốn làm mẫu milky giống ảnh trên trang" }),
      booking("bk-2004", "lp-remove", addDays(t, -3), "18:00", "completed", other("Thanh Hương", "0904 444 555", "21 Chùa Bộc, Đống Đa, Hà Nội")),
      booking("bk-2005", "lp-design", addDays(t, -6), "16:30", "completed", other("Ngân Hà", "0915 555 666", "8 Tô Vĩnh Diện, Thanh Xuân, Hà Nội")),
    ],
    jobs: [
      job({
        id: "job-501",
        mine: true,
        category: "makeup",
        title: "Makeup + làm tóc đi đám cưới bạn thân",
        description: "Mình da dầu, muốn makeup nhẹ nhàng trong trẻo, tóc búi thấp. Làm tại nhà trước 10h.",
        date: addDays(t, 9),
        time: "08:00",
        city: "Hà Nội",
        district: "Cầu Giấy",
        atHome: true,
        budgetMin: 500000,
        budgetMax: 800000,
        customerName: CUSTOMER.name,
        offers: [offer("thu-anh", 750000, "Chị làm được cả makeup và búi tóc, có mi giả và kit cho da dầu. Đến trước 7h45 nhé.")],
      }),
      job({
        id: "job-502",
        mine: false,
        category: "nail",
        title: "Làm nail cho 3 phù dâu",
        description: "3 bạn phù dâu, sơn gel tone hồng sữa đồng bộ, có thể đính đá nhẹ 2 ngón.",
        date: addDays(t, 6),
        time: "14:00",
        city: "Hà Nội",
        district: "Đống Đa",
        atHome: true,
        budgetMin: 900000,
        budgetMax: 1200000,
        customerName: "Phương Thảo",
      }),
      job({
        id: "job-503",
        mine: false,
        category: "nail",
        title: "Sơn gel + dưỡng móng buổi tối",
        description: "Móng ngắn, muốn tone nude đi làm. Sau 19h mới rảnh.",
        date: addDays(t, 2),
        time: "19:00",
        city: "Hà Nội",
        district: "Thanh Xuân",
        atHome: true,
        budgetMin: 250000,
        budgetMax: 350000,
        customerName: "Bích Ngọc",
        offers: [offer("ngoc-bao", 300000, "Mình nhận nhé, có sẵn bảng màu nude.")],
      }),
      job({
        id: "job-504",
        mine: false,
        category: "nail",
        title: "Tháo gel và chăm sóc móng",
        description: "Móng đang yếu sau khi đắp bột, cần tháo và dưỡng.",
        date: addDays(t, 1),
        time: "18:00",
        city: "Hà Nội",
        district: "Cầu Giấy",
        atHome: false,
        budgetMin: 100000,
        budgetMax: 200000,
        customerName: "Thu Trang",
      }),
      job({
        id: "job-505",
        mine: false,
        category: "makeup",
        title: "Makeup chụp kỷ yếu nhóm 5 người",
        description: "Concept nữ sinh trong trẻo, chụp ngoài trời từ 7h sáng.",
        date: addDays(t, 11),
        time: "06:00",
        city: "Hà Nội",
        district: "Cầu Giấy",
        atHome: true,
        budgetMin: 2000000,
        budgetMax: 3000000,
        customerName: "Minh Anh",
      }),
      job({
        id: "job-506",
        mine: false,
        category: "skincare",
        title: "Facial tại nhà cho mẹ",
        description: "Mẹ 55 tuổi da khô, muốn chăm sóc thư giãn 2 lần/tháng.",
        date: addDays(t, 4),
        time: "09:30",
        city: "TP.HCM",
        district: "Quận 7",
        atHome: true,
        budgetMin: 300000,
        budgetMax: 500000,
        customerName: "Gia Hân",
      }),
    ],
  }
}

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
      if (parsed.version === 1) {
        state = parsed
        listeners.forEach((l) => l())
      }
    }
  } catch {
    // Storage unavailable (private mode): keep the in-memory seed.
  }
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

const HydratedContext = React.createContext(false)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => {
    loadFromStorage()
    setHydrated(true)
  }, [])
  return <HydratedContext.Provider value={hydrated}>{children}</HydratedContext.Provider>
}

export function useHydrated() {
  return React.useContext(HydratedContext)
}

/** Whole app state; derive with useMemo in components (snapshots must be stable). */
export function useApp(): AppState {
  return React.useSyncExternalStore(subscribe, getState, () => serverSnapshot)
}

// ---------------------------------------------------------------------------
// Derived helpers

export function servicesFor(s: AppState, proId: string): Service[] {
  if (proId === DEMO_PRO_ID) return s.myServices.filter((x) => x.active !== false)
  return SERVICES.filter((x) => x.proId === proId)
}

export function findService(s: AppState, serviceId: string): Service | undefined {
  return s.myServices.find((x) => x.id === serviceId) ?? SERVICES.find((x) => x.id === serviceId)
}

/** Slots already taken for a freelancer on a given day. */
export function takenSlots(s: AppState, proId: string, date: string): Set<string> {
  const taken = new Set<string>()
  for (const b of s.bookings) {
    if (b.proId === proId && b.date === date && (b.status === "pending" || b.status === "confirmed")) {
      taken.add(b.time)
    }
  }
  // Deterministic "busy elsewhere" slots so the calendar feels real.
  const seed = [...(proId + date)].reduce((a, c) => a + c.charCodeAt(0), 0)
  if (seed % 3 === 0) taken.add("10:30")
  if (seed % 4 === 1) taken.add("13:00")
  return taken
}

export const TIME_SLOTS = ["09:00", "10:30", "13:00", "14:30", "16:00", "16:30", "18:00", "19:30"]

// ---------------------------------------------------------------------------
// Actions

export const actions = {
  signIn(session: Session) {
    setState((s) => ({ ...s, session, onboarded: true }))
  },
  signOut() {
    setState((s) => ({ ...s, session: null }))
  },
  switchRole() {
    setState((s) => {
      if (!s.session) return s
      const role = s.session.role === "pro" ? "customer" : "pro"
      const pro = getPro(DEMO_PRO_ID)!
      return {
        ...s,
        session:
          role === "pro"
            ? { role, name: pro.name, phone: "0968 000 111", proId: DEMO_PRO_ID }
            : { role, name: CUSTOMER.name, phone: CUSTOMER.phone },
      }
    })
  },
  finishOnboarding() {
    setState((s) => ({ ...s, onboarded: true }))
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
      followedPros: s.followedPros.includes(proId)
        ? s.followedPros.filter((x) => x !== proId)
        : [proId, ...s.followedPros],
    }))
  },

  createBooking(input: {
    serviceId: string
    date: string
    time: string
    atHome: boolean
    address: string
    note: string
  }): string {
    const id = uid("bk")
    setState((s) => {
      const service = findService(s, input.serviceId)!
      const booking: Booking = {
        id,
        proId: service.proId,
        serviceId: service.id,
        serviceName: service.name,
        category: service.category,
        durationMin: service.durationMin,
        date: input.date,
        time: input.time,
        atHome: input.atHome,
        address: input.address,
        note: input.note,
        total: service.price,
        deposit: Math.round((service.price * 0.3) / 1000) * 1000,
        status: "pending",
        customerName: s.session?.role === "customer" ? s.session.name : CUSTOMER.name,
        customerPhone: s.session?.role === "customer" ? s.session.phone : CUSTOMER.phone,
        mine: true,
        source: "direct",
        createdAt: new Date().toISOString(),
      }
      return { ...s, bookings: [booking, ...s.bookings] }
    })
    return id
  },
  setBookingStatus(id: string, status: Booking["status"]) {
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    }))
  },

  createJob(input: {
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
  }): string {
    const id = uid("job")
    setState((s) => ({
      ...s,
      jobs: [
        {
          ...input,
          id,
          mine: true,
          customerName: s.session?.role === "customer" ? s.session.name : CUSTOMER.name,
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
    setState((s) => ({
      ...s,
      jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, status: "closed" } : j)),
    }))
  },
  sendOffer(jobId: string, price: number, message: string) {
    setState((s) => ({
      ...s,
      jobs: s.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              offers: [
                ...j.offers.filter((o) => o.proId !== DEMO_PRO_ID),
                {
                  id: uid("of"),
                  proId: DEMO_PRO_ID,
                  price,
                  message,
                  status: "pending",
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : j,
      ),
    }))
  },
  withdrawOffer(jobId: string) {
    setState((s) => ({
      ...s,
      jobs: s.jobs.map((j) =>
        j.id === jobId ? { ...j, offers: j.offers.filter((o) => o.proId !== DEMO_PRO_ID) } : j,
      ),
    }))
  },
  /** Customer accepts a freelancer's offer: the job becomes a confirmed booking. */
  acceptOffer(jobId: string, offerId: string): string | null {
    const bookingId = uid("bk")
    let created = false
    setState((s) => {
      const job = s.jobs.find((j) => j.id === jobId)
      const offer = job?.offers.find((o) => o.id === offerId)
      if (!job || !offer || job.status !== "open") return s
      created = true
      const booking: Booking = {
        id: bookingId,
        proId: offer.proId,
        serviceId: null,
        serviceName: job.title,
        category: job.category,
        durationMin: 90,
        date: job.date,
        time: job.time,
        atHome: job.atHome,
        address: job.atHome ? `${job.district}, ${job.city}` : "Tại studio của chuyên viên",
        note: job.description,
        total: offer.price,
        deposit: Math.round((offer.price * 0.3) / 1000) * 1000,
        status: "confirmed",
        customerName: job.customerName,
        customerPhone: CUSTOMER.phone,
        mine: job.mine,
        source: "job",
        createdAt: new Date().toISOString(),
      }
      return {
        ...s,
        bookings: [booking, ...s.bookings],
        jobs: s.jobs.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "booked",
                offers: j.offers.map((o) => ({ ...o, status: o.id === offerId ? "accepted" : "rejected" })),
              }
            : j,
        ),
      }
    })
    return created ? bookingId : null
  },

  saveService(service: Omit<Service, "proId" | "id"> & { id?: string }) {
    setState((s) => {
      if (service.id) {
        return { ...s, myServices: s.myServices.map((x) => (x.id === service.id ? { ...x, ...service, id: x.id } : x)) }
      }
      return {
        ...s,
        myServices: [...s.myServices, { ...service, id: uid("svc"), proId: DEMO_PRO_ID, active: true }],
      }
    })
  },
  toggleService(id: string) {
    setState((s) => ({
      ...s,
      myServices: s.myServices.map((x) => (x.id === id ? { ...x, active: x.active === false } : x)),
    }))
  },
  setCity(city: string | null) {
    setState((s) => ({ ...s, city }))
  },
  setAcceptingJobs(value: boolean) {
    setState((s) => ({ ...s, acceptingJobs: value }))
  },
  resetDemo() {
    setState(() => seedState())
  },
}
