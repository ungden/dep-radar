/** Parse a Vietnamese appointment without normalizing an impossible date. */
export function appointmentAt(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
  const stamp = Date.parse(`${date}T${time}:00+07:00`)
  if (!Number.isFinite(stamp)) return null
  const local = new Date(stamp + 7 * 60 * 60_000).toISOString()
  if (local.slice(0, 10) !== date || local.slice(11, 16) !== time) return null
  return new Date(stamp).toISOString()
}
