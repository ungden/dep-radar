import { supabase, type Row } from "./supabase"

/** A stretch of days the partner does not work (days_off; open to read, own rows to write). */
export interface DayOff {
  id: string
  startsOn: string
  endsOn: string
  reason: string
}

/** One working window of a weekday, in minutes after midnight (working_hours; 0 = Sunday). */
export interface WorkWindow {
  weekday: number
  startMin: number
  endMin: number
}

export async function loadSchedule(uid: string): Promise<{ daysOff: DayOff[]; hours: WorkWindow[] }> {
  const [off, hours] = await Promise.all([
    supabase.from("days_off").select("id, starts_on, ends_on, reason").eq("pro_id", uid).order("starts_on"),
    supabase.from("working_hours").select("weekday, start_min, end_min").eq("pro_id", uid).order("weekday").order("start_min"),
  ])
  if (off.error || hours.error) throw new Error("Không tải được lịch làm việc. Kiểm tra kết nối rồi thử lại.")
  return {
    daysOff: ((off.data ?? []) as Row[]).map((d) => ({ id: d.id, startsOn: d.starts_on, endsOn: d.ends_on, reason: d.reason ?? "" })),
    hours: ((hours.data ?? []) as Row[]).map((h) => ({ weekday: h.weekday, startMin: h.start_min, endMin: h.end_min })),
  }
}

/**
 * Same rule as the web (lib/api/me.ts addDayOff): a day off does not cancel
 * bookings already made, so it is refused while any are left in the range.
 */
export async function addDayOff(uid: string, startsOn: string, endsOn: string, reason = ""): Promise<{ ok: true } | { ok: false; error: string }> {
  if (endsOn < startsOn) return { ok: false, error: "Ngày kết thúc phải sau ngày bắt đầu." }
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("pro_id", uid)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", `${startsOn}T00:00:00+07:00`)
    .lte("starts_at", `${endsOn}T23:59:59+07:00`)
  if ((count ?? 0) > 0) return { ok: false, error: `Bạn còn ${count} lịch hẹn ngày này. Đổi giờ hoặc huỷ các lịch đó trước khi nghỉ.` }
  const { error } = await supabase.from("days_off").insert({ pro_id: uid, starts_on: startsOn, ends_on: endsOn, reason: reason.trim() })
  return error ? { ok: false, error: "Chưa lưu được ngày nghỉ. Thử lại nhé." } : { ok: true }
}

export async function removeDayOff(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("days_off").delete().eq("id", id)
  return error ? { ok: false, error: "Chưa bỏ được ngày nghỉ. Thử lại nhé." } : { ok: true }
}

const hhmm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`

/** "8:00–19:00", "8:00–12:00, 14:00–20:00", or "Nghỉ". */
export function windowsLabel(hours: WorkWindow[], weekday: number) {
  const day = hours.filter((h) => h.weekday === weekday)
  return day.length ? day.map((h) => `${hhmm(h.startMin)}–${hhmm(h.endMin)}`).join(", ") : "Nghỉ"
}

const WEEKDAY_NAMES = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]

/** Weekdays grouped by identical hours, Monday first: [["Thứ 2 – Thứ 7", "8:00–19:00"], ["Chủ nhật", "Nghỉ"]]. */
export function weekSummary(hours: WorkWindow[]): [string, string][] {
  const order = [1, 2, 3, 4, 5, 6, 0]
  const groups: { days: number[]; label: string }[] = []
  for (const d of order) {
    const label = windowsLabel(hours, d)
    const last = groups.at(-1)
    if (last && last.label === label) last.days.push(d)
    else groups.push({ days: [d], label })
  }
  return groups.map((g) => [g.days.length > 1 ? `${WEEKDAY_NAMES[g.days[0]]} – ${WEEKDAY_NAMES[g.days.at(-1)!]}` : WEEKDAY_NAMES[g.days[0]], g.label])
}
