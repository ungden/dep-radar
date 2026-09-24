/**
 * Where a new freelancer's week starts: Monday to Saturday, 9:00 to 19:00.
 * Saved for them when the profile is created, so "Giờ làm" is a real row in
 * the database from day one and publishing does not fail on a schedule they
 * thought they already had. They edit it from /studio/profile/edit.
 */
export const DEFAULT_WORKING_WINDOWS: { weekday: number; startMin: number; endMin: number }[] = [1, 2, 3, 4, 5, 6].map(
  (weekday) => ({ weekday, startMin: 9 * 60, endMin: 19 * 60 }),
)

/** The public address a freelancer shares with their own clients. */
export const PUBLIC_ORIGIN = "https://www.360dep.vn"

export const proBookingUrl = (slug: string) => `${PUBLIC_ORIGIN}/pros/${slug}`

/**
 * The same page, marked as reached through the partner's own QR code or link:
 * a new customer who books from it is their own client, at the lower
 * commission (components/own-client-capture.tsx).
 */
export const proOwnUrl = (slug: string, channel: "qr" | "link") => `${proBookingUrl(slug)}?src=${channel}`
