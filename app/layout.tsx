import type { Metadata, Viewport } from "next"
import { Be_Vietnam_Pro } from "next/font/google"
import "./globals.css"

import { AppShell } from "@/components/layout/app-shell"
import { SITE_URL } from "@/lib/env"
import { UnregisterServiceWorker } from "@/components/register-sw"
import { ReferralCapture } from "@/components/referral-capture"
import { StoreProvider } from "@/lib/store"
import { emptySnapshot, loadSnapshot } from "@/lib/api/snapshot"
import { backendEnabled } from "@/lib/supabase/env"

const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  // One family for everything, the wordmark included (800). Be Vietnam Pro
  // was drawn for Vietnamese: stacked marks (ặ, ễ, ở) stay clear and even.
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
})


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "360dep",
  title: {
    default: "360dep | Đặt người làm đẹp, chụp ảnh, người mẫu gần bạn",
    template: "%s | 360dep",
  },
  description:
    "Đặt thợ nail, makeup, chăm sóc da, người chụp ảnh bằng điện thoại, quay clip ngắn và người mẫu gần bạn. Xem tác phẩm thật, giá rõ ràng, đặt lịch nhanh.",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    // iPhone "Add to Home Screen" uses this; without it iOS shows a screenshot.
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  twitter: { card: "summary_large_image" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "360dep",
    title: "360dep | Lên hình đẹp, theo cách của bạn",
    description: "Làm đẹp, chụp ảnh và người mẫu: đặt người giỏi gần bạn.",
  },
}

export const viewport: Viewport = {
  themeColor: "#FAF6F4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // One server read per navigation feeds every screen; see lib/api/snapshot.ts.
  const snapshot = backendEnabled ? await loadSnapshot() : emptySnapshot
  return (
    <html lang="vi" className={body.variable}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow"
        >
          Bỏ qua, tới nội dung chính
        </a>
        <UnregisterServiceWorker />
        <StoreProvider snapshot={snapshot}>
          <AppShell>{children}</AppShell>
          <ReferralCapture />
        </StoreProvider>
      </body>
    </html>
  )
}
