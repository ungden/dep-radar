import type { Metadata, Viewport } from "next"
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google"
import "./globals.css"

import { AppShell } from "@/components/layout/app-shell"
import { StoreProvider } from "@/lib/store"

const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
})

const serif = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "800"],
  variable: "--font-serif",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${body.variable} ${serif.variable}`}>
      <body className="min-h-dvh">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  )
}
