/**
 * Service worker for dep360.
 *
 * Deliberately conservative. This app shows prices, availability and booking
 * statuses: serving a cached copy of any of those would be showing somebody a
 * slot that is gone or a price that has changed. So:
 *
 *  - the app shell and static assets are cached, because they do not carry data
 *  - every navigation and API call goes to the network first
 *  - when the network is unreachable, a navigation falls back to /offline
 *
 * Nothing here caches a response from Supabase.
 */

const VERSION = "dep360-v1"
const SHELL = `${VERSION}-shell`
const OFFLINE_URL = "/offline"

const PRECACHE = [OFFLINE_URL, "/brand/icon-192.png", "/brand/site.webmanifest"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const isStaticAsset = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/brand/"))

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)

  // A page: always try the network, fall back to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL)
        return (await cache.match(OFFLINE_URL)) ?? new Response("", { status: 504 })
      }),
    )
    return
  }

  // Build output and images are content-addressed or stable: cache them.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(SHELL).then(async (cache) => {
        const hit = await cache.match(request)
        if (hit) return hit
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      }),
    )
  }

  // Everything else, including every Supabase call, goes to the network only.
})
