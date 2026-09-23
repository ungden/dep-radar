import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { showsAverage } from "./connection"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A freelancer's rating as the product may show it. The average only from
 * MIN_REVIEWS_FOR_AVERAGE reviews on (lib/connection.ts): a 5.0 from one review
 * says nothing. Before that, "Mới" and how many there are.
 */
export function ratingText(rating: { average: number; count: number }) {
  if (showsAverage(rating.count)) return `★ ${rating.average.toFixed(1)} (${rating.count})`
  return rating.count > 0 ? `Mới · ${rating.count} đánh giá` : "Mới"
}

export function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`
}

export function formatCompact(value: number) {
  if (value >= 1000) return `${(value / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}k`
  return String(value)
}

/** "~40 phút", "~2 giờ": a response time a person can read at a glance. */
export function formatResponseTime(minutes: number) {
  if (minutes <= 0) return null
  if (minutes < 90) return `~${minutes} phút`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `~${hours} giờ`
  return `~${Math.round(hours / 24)} ngày`
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} giờ ${m} phút` : `${h} giờ`
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
const WEEKDAY_LONG = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]

/**
 * dep360 runs in one country. Every date the product talks about is a wall-clock
 * date in Vietnam, while the server runs in UTC, so nothing here may depend on the
 * machine's timezone: that is a seven-hour error either side of midnight.
 *
 * A "yyyy-mm-dd" string is a civil date. It is parsed at UTC midnight and only
 * ever read back with getUTC*, so the arithmetic is the same everywhere.
 */
export const VN_TZ = "Asia/Ho_Chi_Minh"
/** Vietnam has no daylight saving, so the offset is a constant. */
const VN_OFFSET = "+07:00"

export function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function parseISODate(iso: string) {
  return new Date(`${iso}T00:00:00Z`)
}

export function addDays(iso: string, days: number) {
  const d = parseISODate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toISODate(d)
}

/** Today in Vietnam, whatever the server's clock is set to. */
export function todayISO() {
  return localDate(new Date().toISOString())
}

/** The civil date in Vietnam of an instant. */
export function localDate(timestamptz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamptz))
}

/** The wall-clock time in Vietnam of an instant, as "HH:mm". */
export function localTime(timestamptz: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: VN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamptz))
}

/** A Vietnamese wall-clock date and time as the instant the database stores. */
export function toTimestamptz(isoDate: string, time: string) {
  return new Date(`${isoDate}T${time}:00${VN_OFFSET}`).toISOString()
}

export function weekdayShort(iso: string) {
  return WEEKDAYS[parseISODate(iso).getUTCDay()]
}

/** "Thứ 4, 26 Tháng 6" */
export function formatDateLong(iso: string, withYear = false) {
  const d = parseISODate(iso)
  const base = `${WEEKDAY_LONG[d.getUTCDay()]}, ${d.getUTCDate()} Tháng ${d.getUTCMonth() + 1}`
  return withYear ? `${base}, ${d.getUTCFullYear()}` : base
}

export function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase()
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function timeAgo(isoDateTime: string) {
  const diff = Date.now() - new Date(isoDateTime).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return "vừa xong"
  if (min < 60) return `${min} phút trước`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} giờ trước`
  return `${Math.round(h / 24)} ngày trước`
}
