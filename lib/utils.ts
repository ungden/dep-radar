import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`
}

export function formatCompact(value: number) {
  if (value >= 1000) return `${(value / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}k`
  return String(value)
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} giờ ${m} phút` : `${h} giờ`
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
const WEEKDAY_LONG = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]

export function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number) {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function todayISO() {
  return toISODate(new Date())
}

export function weekdayShort(iso: string) {
  return WEEKDAYS[parseISODate(iso).getDay()]
}

/** "Thứ 4, 26 Tháng 6" */
export function formatDateLong(iso: string, withYear = false) {
  const d = parseISODate(iso)
  const base = `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} Tháng ${d.getMonth() + 1}`
  return withYear ? `${base}, ${d.getFullYear()}` : base
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

export function hoursUntil(dateISO: string, time: string) {
  const [h, m] = time.split(":").map(Number)
  const start = parseISODate(dateISO)
  start.setHours(h, m)
  return (start.getTime() - Date.now()) / 3600000
}
