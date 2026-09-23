import { router, type Href } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { webLink } from "./links"

/**
 * Notifications (in the list and as pushes) carry web paths like
 * "/bookings/<id>". Open the native screen when there is one, the web page
 * inside the app otherwise.
 */
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

export function routeForLink(link: string): Href | null {
  const path = link.replace(/^https?:\/\/(www\.)?360dep\.vn/, "").split(/[?#]/)[0].replace(/\/$/, "") || "/"
  let m: RegExpMatchArray | null
  if ((m = path.match(new RegExp(`^/bookings/(${UUID})/review$`, "i")))) return { pathname: "/danh-gia/[bookingId]", params: { bookingId: m[1] } }
  if ((m = path.match(new RegExp(`^/bookings/(${UUID})$`, "i")))) return { pathname: "/bookings/[id]", params: { id: m[1] } }
  if (path === "/bookings") return "/lich-hen"
  if ((m = path.match(new RegExp(`^/tin-nhan/(${UUID})$`, "i")))) return { pathname: "/tin-nhan/[id]", params: { id: m[1] } }
  if (path === "/tin-nhan") return "/tin-nhan"
  if ((m = path.match(new RegExp(`^/requests/(${UUID})$`, "i")))) return { pathname: "/yeu-cau/[id]", params: { id: m[1] } }
  if (path === "/requests") return "/yeu-cau"
  if (path === "/requests/new") return "/yeu-cau/moi"
  if ((m = path.match(new RegExp(`^/tuyen-mau/(${UUID})$`, "i")))) return { pathname: "/tuyen-mau/[id]", params: { id: m[1] } }
  if (path === "/tuyen-mau") return "/tuyen-mau"
  if ((m = path.match(/^\/pros\/([^/]+)$/))) return { pathname: "/pros/[id]", params: { id: decodeURIComponent(m[1]) } }
  if ((m = path.match(/^\/works\/([^/]+)$/))) return { pathname: "/works/[id]", params: { id: decodeURIComponent(m[1]) } }
  if ((m = path.match(/^\/dich-vu\/([^/]+)$/))) return { pathname: "/dich-vu/[id]", params: { id: decodeURIComponent(m[1]) } }
  if (path === "/thong-bao") return "/thong-bao"
  if (path === "/gioi-thieu") return "/gioi-thieu"
  if (path === "/me/dia-chi") return "/dia-chi"
  if (path === "/studio" || path === "/studio/jobs") return "/studio"
  if (path === "/studio/requests" || path === "/studio/viec-moi") return "/studio/viec-moi"
  if (path === "/") return "/"
  return null
}

export function openLink(link: string | null | undefined) {
  if (!link) return
  const route = routeForLink(link)
  if (route) return router.push(route)
  if (link.startsWith("/")) void WebBrowser.openBrowserAsync(webLink(link))
  else if (/^https:\/\//.test(link)) void WebBrowser.openBrowserAsync(link)
}
