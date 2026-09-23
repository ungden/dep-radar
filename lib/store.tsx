"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { getTemplate } from "./catalog"
import { buildQuote, isUrgent } from "./pricing"
import type { AppSnapshot } from "./api/snapshot"
import { travelDistanceKm } from "./geo"
import type { CustomerAddress, PriceQuote, Pro, ProService, Review } from "./types"

/**
 * The client-side view of server state.
 *
 * Everything here arrives from the database with the page (lib/api/snapshot.ts),
 * including which city the customer is browsing -- that lives in a cookie, so the
 * feed is already filtered when the page reaches the browser. Writes go to a
 * server action and then ask Next.js to re-render the route, so the screen shows
 * what the database decided rather than what the browser hoped.
 */
export type AppState = AppSnapshot

const StoreContext = React.createContext<AppState | null>(null)
const RefreshContext = React.createContext<() => void>(() => {})

export function StoreProvider({ snapshot, children }: { snapshot: AppSnapshot; children: React.ReactNode }) {
  const router = useRouter()
  const refresh = React.useCallback(() => router.refresh(), [router])

  return (
    <StoreContext.Provider value={snapshot}>
      <RefreshContext.Provider value={refresh}>{children}</RefreshContext.Provider>
    </StoreContext.Provider>
  )
}

export function useApp(): AppState {
  const value = React.useContext(StoreContext)
  if (!value) throw new Error("useApp must be used inside StoreProvider")
  return value
}

/** Re-read the page's server data, after a write. */
export function useRefresh() {
  return React.useContext(RefreshContext)
}

// ---------------------------------------------------------------------------
// Selectors. Pure, and all of them read the snapshot rather than a constant.

export const getPro = (s: AppState, idOrSlug: string): Pro | undefined =>
  s.pros.find((p) => p.id === idOrSlug || p.uuid === idOrSlug)

/** Kept for call sites that used to read a module constant. */
export const proView = getPro

export function servicesOf(s: AppState, proId: string, includeInactive = false): ProService[] {
  const pro = getPro(s, proId)
  if (!pro) return []
  const mine = s.session?.proId === pro.id
  const list = mine ? s.myServices : s.proServices.filter((x) => x.proId === pro.id)
  return list.filter((x) => includeInactive || x.active)
}

export function priceOf(s: AppState, proId: string, templateId: string, variantId: string): number | null {
  const svc = servicesOf(s, proId).find((x) => x.templateId === templateId)
  return svc?.prices[variantId] ?? null
}

export function fromPrice(s: AppState, proId: string, templateId?: string): number | null {
  const list = servicesOf(s, proId).filter((x) => !templateId || x.templateId === templateId)
  const prices = list.flatMap((x) => Object.values(x.prices))
  return prices.length ? Math.min(...prices) : null
}

export const reviewsOf = (s: AppState, proId: string): Review[] => s.reviews.filter((r) => r.proId === proId)

export const worksOf = (s: AppState, proId: string) => s.works.filter((w) => w.proId === proId)

export function distanceToCustomer(
  s: AppState,
  proId: string,
  address: CustomerAddress | null = s.customerAddress,
) {
  const pro = getPro(s, proId)
  if (!pro || !address) return null
  return travelDistanceKm(pro.city, pro.district, address.city, address.district)
}

export type HomeAvailability = { ok: true } | { ok: false; reason: string }

/**
 * A preview of what the database will say. `availability_problem()` is the real
 * answer, checked again on every write; this only keeps the form from asking for
 * something that cannot work.
 */
export function homeAvailability(
  s: AppState,
  proId: string,
  templateId: string,
  address: CustomerAddress,
): HomeAvailability {
  const pro = getPro(s, proId)
  if (!pro) return { ok: false, reason: "Không tìm thấy người làm." }
  const template = getTemplate(templateId)
  if (!pro.homeService) return { ok: false, reason: `${pro.name} chỉ nhận làm tại studio.` }
  if (template?.studioOnly) return { ok: false, reason: "Dịch vụ này cần thiết bị tại studio." }
  const km = travelDistanceKm(pro.city, pro.district, address.city, address.district)
  if (km === null) return { ok: false, reason: `${pro.name} chỉ nhận khách tại ${pro.city}.` }
  if (km > pro.maxTravelKm) {
    return {
      ok: false,
      reason: `Khoảng ${km.toLocaleString("vi-VN")} km, vượt phạm vi di chuyển tối đa ${pro.maxTravelKm} km của ${pro.name}.`,
    }
  }
  return { ok: true }
}

/** The same arithmetic the server does, for showing a total before submitting. */
export function quoteFor(
  s: AppState,
  input: { proId: string; price: number; atHome: boolean; address: CustomerAddress | null; date: string; time: string },
): PriceQuote {
  const pro = getPro(s, input.proId)
  const distanceKm =
    input.atHome && pro && input.address
      ? travelDistanceKm(pro.city, pro.district, input.address.city, input.address.district)
      : null
  return buildQuote({
    servicePrice: input.price,
    atHome: input.atHome,
    distanceKm,
    urgent: isUrgent(input.date, input.time),
  })
}

export const formatAddress = (a: CustomerAddress) => [a.detail, a.district, a.city].filter(Boolean).join(", ")
