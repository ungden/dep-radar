/**
 * A location sent in a chat (send_location, 20261015100000_chat_location.sql).
 * Web and app draw the same card and open the same links.
 */

/** As the database stores it: 5 decimals, about a metre. */
export const roundPoint = (n: number) => Math.round(n * 1e5) / 1e5

/** Where the point is, in Google Maps (the app if installed, else the browser). */
export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${roundPoint(lat)},${roundPoint(lng)}`

/** Directions from wherever the reader is to the point. */
export const directionsLink = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${roundPoint(lat)},${roundPoint(lng)}`

/**
 * The words send_location stores as the body, for builds that cannot draw the
 * card and for the inbox preview.
 */
export const LOCATION_BODY_PREFIX = "Vị trí: https://www.google.com/maps/search/?api=1&query="
export const isLocationBody = (body: string) => body.startsWith(LOCATION_BODY_PREFIX)

/** What the chat list says for a location message. */
export const LOCATION_PREVIEW = "Đã gửi vị trí"

/** Asked before sending: the other side sees exactly where the sender is. */
export const locationConfirm = (name: string) => `${name} sẽ thấy vị trí chính xác của bạn lúc này và mở được trên Google Maps.`

/** When the phone or browser gives no position. */
export const LOCATION_DENIED = "Chưa có quyền vị trí. Bật quyền vị trí cho 360dep trong Cài đặt rồi thử lại."
export const LOCATION_FAILED = "Không lấy được vị trí. Ra chỗ thoáng hoặc bật định vị rồi thử lại."
