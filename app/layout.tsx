import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { PageTransition } from '@/components/layout/page-transition';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://360dep.vn'),
  applicationName: '360 độ đẹp',
  title: {
    default: '360 độ đẹp | Catalogue, review mỹ phẩm và beauty radar',
    template: '%s | 360 độ đẹp',
  },
  description: 'Catalogue, review mỹ phẩm và kiến thức làm đẹp có kiểm chứng cho người dùng Việt Nam.',
  keywords: ['360 độ đẹp', '360dep', 'review mỹ phẩm', 'catalogue làm đẹp', 'beauty radar', 'skincare Việt Nam'],
  alternates: {
    canonical: '/',
  },
  manifest: '/brand/site.webmanifest',
  icons: {
    icon: [
      { url: '/brand/favicon.ico', sizes: 'any' },
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/brand/favicon.ico'],
  },
  appleWebApp: {
    title: '360 độ đẹp',
    capable: true,
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: '360 độ đẹp',
    url: '/',
    title: '360 độ đẹp | Catalogue, review mỹ phẩm và beauty radar',
    description: 'Catalogue, review mỹ phẩm và kiến thức làm đẹp có kiểm chứng cho người dùng Việt Nam.',
    images: [
      {
        url: '/brand/social-share.jpg',
        width: 1200,
        height: 630,
        alt: '360 độ đẹp - Beauty Radar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '360 độ đẹp | Catalogue, review mỹ phẩm và beauty radar',
    description: 'Catalogue, review mỹ phẩm và kiến thức làm đẹp có kiểm chứng cho người dùng Việt Nam.',
    images: ['/brand/social-share.jpg'],
  },
};

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}</Script>
        </>
      )}
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 antialiased flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
