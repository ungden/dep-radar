import type { Metadata, Viewport } from "next"
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google"
import "./globals.css"

import { AppShell } from "@/components/layout/app-shell"
import { SITE_URL } from "@/lib/env"
import { RegisterServiceWorker } from "@/components/register-sw"
import { StoreProvider } from "@/lib/store"
import { emptySnapshot, loadSnapshot } from "@/lib/api/snapshot"
import { backendEnabled } from "@/lib/supabase/env"

const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
})

// Only the extrabold wordmark weight is used, so nothing else is downloaded.
const serif = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["800"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  applicationName: "dep360",
  title: {
    default: "dep360 | Đặt lịch làm đẹp với chuyên viên freelancer",
    template: "%s | dep360",
  },
  description:
    "Tìm chuyên viên nail, makeup, chăm sóc da, tóc, mi & mày làm tại nhà. Xem tác phẩm thật, đặt lịch nhanh, hoặc đăng yêu cầu để freelancer báo giá.",
  manifest: "/brand/site.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { title: "dep360", capable: true, statusBarStyle: "default" },
  twitter: { card: "summary_large_image" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "dep360",
    title: "dep360 | Đẹp hơn mỗi ngày, theo cách của bạn",
    description: "Đặt lịch làm đẹp với chuyên viên freelancer gần bạn.",
  },
}

export const viewport: Viewport = {
  themeColor: "#faf6f4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // One server read per navigation feeds every screen; see lib/api/snapshot.ts.
  const snapshot = backendEnabled ? await loadSnapshot() : emptySnapshot
  return (
    <html lang="vi" className={`${body.variable} ${serif.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow"
        >
          Bỏ qua, tới nội dung chính
        </a>
        <RegisterServiceWorker />
        <StoreProvider snapshot={snapshot}>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  )
}
