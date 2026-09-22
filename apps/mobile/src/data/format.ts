/**
 * Formatting and Vietnam wall-clock dates. The web's lib/utils.ts does the same
 * but pulls in Tailwind helpers, so the app keeps its own copy of the rules:
 * every date the product talks about is a civil date in Vietnam (UTC+7, no
 * daylight saving), whatever timezone the phone is set to.
 */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000
const pad = (n: number) => String(n).padStart(2, "0")

export function formatPrice(value: number) {
  const s = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${s}đ`
}

/** "250k", "1,2tr": for tight spots like a pro card. */
export function formatShortPrice(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",")}tr`
  if (value >= 1000) return `${Math.round(value / 1000)}k`
  return formatPrice(value)
}

export function formatKm(km: number) {
  return `${km.toFixed(1).replace(".", ",")} km`
}

export function formatRating(avg: number) {
  return avg.toFixed(1).replace(".", ",")
}

/** The Vietnam wall clock of an instant, read with getUTC*. */
function vn(instant: string | Date) {
  const t = typeof instant === "string" ? Date.parse(instant) : instant.getTime()
  return new Date(t + VN_OFFSET_MS)
}

export function localDate(instant: string | Date) {
  const d = vn(instant)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function localTime(instant: string | Date) {
  const d = vn(instant)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export function todayISO() {
  return localDate(new Date())
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** A Vietnamese date and time as the instant the database stores. */
export function toTimestamptz(isoDate: string, time: string) {
  return new Date(`${isoDate}T${time}:00+07:00`).toISOString()
}

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
const WEEKDAY_LONG = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]

export function weekdayShort(iso: string) {
  return WEEKDAY[new Date(`${iso}T00:00:00Z`).getUTCDay()]
}

/** "Thứ 4, 26/6" */
export function formatDateLong(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${WEEKDAY_LONG[d.getUTCDay()]}, ${d.getUTCDate()}/${d.getUTCMonth() + 1}`
}

/** "Hôm nay", "Ngày mai" or the long date. */
export function formatDay(iso: string) {
  const today = todayISO()
  if (iso === today) return "Hôm nay"
  if (iso === addDays(today, 1)) return "Ngày mai"
  if (iso === addDays(today, -1)) return "Hôm qua"
  return formatDateLong(iso)
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} giờ ${m} phút` : `${h} giờ`
}

export function formatResponseTime(minutes: number) {
  if (minutes <= 0) return null
  if (minutes < 90) return `~${minutes} phút`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `~${hours} giờ`
  return `~${Math.round(hours / 24)} ngày`
}

export function timeAgo(instant: string) {
  const min = Math.round((Date.now() - Date.parse(instant)) / 60000)
  if (min < 1) return "vừa xong"
  if (min < 60) return `${min} phút trước`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} ngày trước`
  return formatDateLong(localDate(instant))
}

/** "1:24:05", "12:03": time left before a deadline. */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase()
}

/** Vietnamese mobile number in E.164, or null. Same rule as lib/auth/phone.ts and normalize_vn_phone(). */
export function toE164(input: string): string | null {
  let digits = input.replace(/\D/g, "")
  if (digits.startsWith("0084")) digits = digits.slice(4)
  else if (digits.startsWith("84") && digits.length >= 11) digits = digits.slice(2)
  else if (digits.startsWith("0")) digits = digits.slice(1)
  if (!/^[35789]\d{8}$/.test(digits)) return null
  return `+84${digits}`
}

/** 0968 112 233 */
export function formatPhone(phone: string) {
  const e164 = phone.startsWith("+") ? phone : toE164(phone)
  if (!e164) return phone
  const local = `0${e164.slice(3)}`
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
}

/** Strip Vietnamese marks for search: "Chăm sóc da" matches "cham soc". */
export function fold(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
}
