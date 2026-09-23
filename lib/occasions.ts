import { getTemplate } from "./catalog"
import type { ServiceTemplate } from "./types"

/**
 * "Theo dịp": what people actually book around an occasion, across trades.
 * Getting ready for a Tết photo in áo dài is a makeup artist and someone with
 * a camera, booked for the same morning; this is where 360dep is more useful
 * than a salon app or a photographer's fan page.
 *
 * Shared by web and native. An occasion only lists catalogue services, so it
 * can never advertise something nobody can book.
 */
export interface Occasion {
  id: string
  title: string
  subtitle: string
  /** Catalogue template ids, in the order they happen on the day. */
  templates: string[]
  /** Months (1-12) it is in season; empty means all year. */
  months: number[]
}

export const OCCASIONS: Occasion[] = [
  {
    id: "ao-dai-tet",
    title: "Áo dài Tết",
    subtitle: "Makeup rồi chụp áo dài cùng một buổi",
    templates: ["makeup-photo", "photo-portrait", "photo-phone"],
    months: [12, 1, 2],
  },
  {
    id: "ky-yeu",
    title: "Kỷ yếu & tốt nghiệp",
    subtitle: "Makeup cho cả nhóm, người chụp đi cùng",
    templates: ["makeup-photo", "photo-phone-group", "photo-portrait"],
    months: [3, 4, 5, 6, 7, 8],
  },
  {
    id: "phu-nu",
    title: "20/10 & 8/3",
    subtitle: "Làm nail, makeup đi tiệc, chụp vài tấm",
    templates: ["nail-design", "makeup-party", "photo-phone"],
    months: [3, 10],
  },
  {
    id: "hen-ho",
    title: "Hẹn hò, đi cafe",
    subtitle: "Makeup nhẹ, sơn móng, chụp điện thoại",
    templates: ["makeup-daily", "nail-gel", "photo-phone"],
    months: [],
  },
  {
    id: "shop-online",
    title: "Chụp cho shop online",
    subtitle: "Mẫu, makeup, người chụp và clip sản phẩm",
    templates: ["model-lookbook", "makeup-photo", "product-lifestyle", "video-short"],
    months: [],
  },
  {
    id: "sinh-nhat",
    title: "Sinh nhật",
    subtitle: "Makeup tiệc, chụp nhóm bạn, quay lại khoảnh khắc",
    templates: ["makeup-party", "photo-phone-group", "video-event"],
    months: [],
  },
  {
    id: "du-lich",
    title: "Đi du lịch",
    subtitle: "Photo tour trọn buổi ở điểm bạn đến",
    templates: ["photo-tour", "makeup-daily"],
    months: [],
  },
  {
    id: "ho-so",
    title: "Ảnh hồ sơ, CV",
    subtitle: "Makeup nhẹ và ảnh chân dung gọn gàng",
    templates: ["makeup-daily", "photo-profile"],
    months: [],
  },
]

export const getOccasion = (id: string) => OCCASIONS.find((o) => o.id === id)

export function occasionTemplates(o: Occasion): ServiceTemplate[] {
  return o.templates.map((id) => getTemplate(id)).filter((t): t is ServiceTemplate => Boolean(t))
}

/** Vietnam wall-clock month and weekday, whatever the server's timezone. */
function vnParts(date: Date) {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  return { month: vn.getUTCMonth() + 1, day: vn.getUTCDate(), weekday: vn.getUTCDay(), hour: vn.getUTCHours() }
}

export function inSeason(o: Occasion, date: Date) {
  return o.months.length === 0 || o.months.includes(vnParts(date).month)
}

/** In-season occasions first, then the all-year ones; out-of-season ones last. */
export function occasionsFor(date: Date): Occasion[] {
  const rank = (o: Occasion) => (o.months.length > 0 && inSeason(o, date) ? 0 : o.months.length === 0 ? 1 : 2)
  return [...OCCASIONS].sort((a, b) => rank(a) - rank(b))
}

export interface Suggestion {
  label: string
  href: string
}

/**
 * Search shortcuts under the search box, chosen by the calendar: what people
 * book this week, not a fixed list.
 */
export function suggestionsFor(date: Date): Suggestion[] {
  const { month, day, weekday, hour } = vnParts(date)
  const out: Suggestion[] = []
  if (month === 12 || month === 1 || (month === 2 && day <= 10)) out.push({ label: "Chụp áo dài Tết", href: "/dip/ao-dai-tet" })
  if ((month === 10 && day <= 20) || (month === 3 && day <= 8)) out.push({ label: "Makeup đi tiệc", href: "/search?category=makeup" })
  if (weekday === 5 || weekday === 6 || weekday === 0) out.push({ label: "Nail cuối tuần", href: "/search?category=nail" })
  out.push({ label: "Chụp ảnh đi cafe", href: "/search?category=photophone" })
  if (hour >= 17) out.push({ label: "Massage tối nay", href: "/search?category=massage" })
  out.push({ label: "Quay clip TikTok", href: "/search?category=short-video" })
  out.push({ label: "Thuê mẫu cho shop", href: "/search?vertical=model" })
  return out.slice(0, 5)
}
