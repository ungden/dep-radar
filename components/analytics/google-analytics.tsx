"use client"

import { Suspense, useEffect } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"

import { GA_ID, trackPageView } from "@/lib/analytics"

function GoogleAnalyticsRouteTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_ID || !pathname || pathname.startsWith("/admin")) return
    const query = searchParams.toString()
    trackPageView(query ? `${pathname}?${query}` : pathname)
  }, [pathname, searchParams])

  return null
}

export function GoogleAnalytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { send_page_view: false });
      `}</Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsRouteTracker />
      </Suspense>
    </>
  )
}
