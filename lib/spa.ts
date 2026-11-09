/** Not ./utils: the app imports this file, and utils pulls in tailwind helpers. */
const VN_TZ = "Asia/Ho_Chi_Minh"
import type { Pro } from "./types"

/**
 * Spas (owner, 08/11/2026): a partner that is a place, with several beds.
 * Makeup and the travelling Artist stay the main business, so spas get the
 * last ring of the home row and one quiet row below the services, never the
 * top of the page. Web and app read the words and rules here.
 */

export const SPA = {
  ring: "Spa",
  row: "Đến spa gần bạn",
  rowText: "Gội đầu dưỡng sinh, chăm sóc da",
  listTitle: "Spa gần bạn",
  payAtSpa: "Trả tại spa sau khi làm xong",
  arrive: "Đến trước 10 phút để thay đồ. Lịch hẹn giữ chỗ cho bạn đúng giờ đã đặt.",
  sent: "Đã gửi lịch cho spa",
  sentText: "Spa xác nhận trong ít phút. Bạn sẽ nhận thông báo ngay khi spa nhận lịch.",
  partnerKind: "Spa / cơ sở",
  partnerKindText: "Khách đến cơ sở của bạn. Nhiều giường làm cùng lúc.",
  artistKind: "Artist",
  artistKindText: "Bạn đến nhà khách hoặc nơi khách chọn.",
} as const

/** The categories a spa may list. */
export const SPA_CATEGORIES = ["skincare", "hair", "massage", "nail", "lash-brow"] as const

/** Fixed amenities a spa ticks: no free text, so cards stay comparable. */
export const SPA_AMENITIES = [
  { id: "private-room", label: "Phòng riêng" },
  { id: "motorbike", label: "Chỗ để xe máy" },
  { id: "car", label: "Đỗ ô tô" },
  { id: "female-staff", label: "Nhân viên nữ" },
  { id: "aircon", label: "Máy lạnh" },
  { id: "tea", label: "Trà & nước" },
  { id: "shower", label: "Phòng tắm" },
  { id: "wifi", label: "Wifi" },
] as const

export type SpaAmenityId = (typeof SPA_AMENITIES)[number]["id"]

export const amenityLabel = (id: string) => SPA_AMENITIES.find((a) => a.id === id)?.label

/** Known amenities of a spa, in the fixed order. */
export const spaAmenities = (pro: Pick<Pro, "amenities">) =>
  SPA_AMENITIES.filter((a) => pro.amenities?.includes(a.id))

export const MAX_SPA_BEDS = 30

/** The spa ring and badges: a calm sage, apart from the category tints. */
export const SPA_TINT = { bg: "#E4F0E8", fg: "#3F7A5A" } as const

/** Where the Spa ring sits in the home row: after the first four categories, still on the first screen. */
export const SPA_RING_INDEX = 4

/** Illustrations of a spa room, labelled "Ảnh minh hoạ" wherever they show. */
export const SPA_PHOTOS = ["/images/catalog/spa-1.webp", "/images/catalog/spa-2.webp"] as const
export const spaPhoto = (index = 0) => SPA_PHOTOS[index % SPA_PHOTOS.length]

/** Google Maps directions to the spa's written address (its pin is only the ward centre). */
export const spaDirectionsLink = (pro: Pick<Pro, "studioAddress" | "district" | "city">) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([pro.studioAddress, pro.district, pro.city].filter(Boolean).join(", "))}`

export interface HoursWindow {
  weekday: number
  startMin: number
  endMin: number
}

const clock = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`

/** Minutes since midnight and weekday (0 = Sunday) in Vietnam. */
function vnNow(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: VN_TZ, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0"
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"))
  return { weekday, minutes: Number(get("hour")) * 60 + Number(get("minute")) }
}

/** "Đang mở · đến 21:00", "Mở lúc 9:00", "Hôm nay nghỉ". */
export function openState(hours: readonly HoursWindow[], now = new Date()): { open: boolean; label: string } {
  const { weekday, minutes } = vnNow(now)
  const today = hours.filter((h) => h.weekday === weekday).sort((a, b) => a.startMin - b.startMin)
  const current = today.find((h) => h.startMin <= minutes && minutes < h.endMin)
  if (current) return { open: true, label: `Đang mở · đến ${clock(current.endMin)}` }
  const next = today.find((h) => h.startMin > minutes)
  if (next) return { open: false, label: `Mở lúc ${clock(next.startMin)}` }
  return { open: false, label: today.length ? "Đã đóng cửa hôm nay" : "Hôm nay nghỉ" }
}

/** "9:00 – 21:00 hằng ngày", or the week's span when days differ. */
export function hoursSummary(hours: readonly HoursWindow[]): string {
  if (!hours.length) return "Chưa có giờ mở cửa"
  const days = new Set(hours.map((h) => h.weekday))
  const start = Math.min(...hours.map((h) => h.startMin))
  const end = Math.max(...hours.map((h) => h.endMin))
  const span = `${clock(start)} – ${clock(end)}`
  if (days.size === 7) return `${span} hằng ngày`
  const names = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const closed = names.filter((_, i) => !days.has(i))
  return `${span} · nghỉ ${closed.join(", ")}`
}

/** "Còn 2 giường", "Còn 1 giường" — only for spas with more than one bed. */
export const bedsLeftLabel = (free: number) => `Còn ${free} giường`
