"use client"

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ""

export type PublicAnalyticsEvent =
  | "search"
  | "view_product"
  | "affiliate_click"
  | "submit_review"
  | "view_kol_profile"
  | "select_catalogue"
  | "read_article"
  | "evidence_source_click"
  | "concern_started"
  | "shortlist_viewed"
  | "evidence_opened"
  | "verified_offer_clicked"
  | "review_submitted"

type AnalyticsValue = string | number | boolean | null | undefined
export type AnalyticsParams = Record<string, AnalyticsValue>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function isAnalyticsEnabled() {
  return Boolean(GA_ID) && typeof window !== "undefined"
}

export function trackPageView(path: string) {
  const gtag = getGtag()
  if (!gtag) return
  gtag("config", GA_ID, {
    page_path: path,
  })
}

export function trackEvent(name: PublicAnalyticsEvent, params: AnalyticsParams = {}) {
  const gtag = getGtag()
  if (!gtag) return
  gtag("event", name, sanitizeAnalyticsParams(params))
}

function sanitizeAnalyticsParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 120) : value])
  )
}

function getGtag() {
  if (!isAnalyticsEnabled()) return null
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== "function") {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args)
    }
  }
  return window.gtag
}
