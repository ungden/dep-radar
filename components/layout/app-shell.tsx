"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, BriefcaseBusiness, CalendarDays, Compass, House, ListChecks, MessageCircle, Plus, Search, ShieldCheck, User } from "lucide-react"
import { Footer } from "@/components/layout/footer"
import { LiveRegionProvider } from "@/components/live-region"
import { Avatar, Logo } from "@/components/ui"
import { actions } from "@/lib/client-actions"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match?: RegExp
  /** The raised centre button: post something. */
  primary?: boolean
}

/** The same five places on the phone and in the app (apps/mobile). */
const CUSTOMER_NAV: NavItem[] = [
  { href: "/", label: "Khám phá", icon: Compass, match: /^\/($|works|dip|pros)/ },
  { href: "/search", label: "Tìm", icon: Search, match: /^\/search/ },
  { href: "/dang", label: "Yêu cầu", icon: Plus, primary: true, match: /^\/(dang|requests\/new)/ },
  { href: "/bookings", label: "Lịch hẹn", icon: CalendarDays, match: /^\/(bookings|requests)/ },
  { href: "/me", label: "Tôi", icon: User, match: /^\/(me|saved)/ },
]

const PRO_NAV: NavItem[] = [
  { href: "/studio", label: "Hôm nay", icon: House, match: /^\/studio$/ },
  { href: "/studio/jobs", label: "Việc mới", icon: BriefcaseBusiness },
  { href: "/dang", label: "Đăng", icon: Plus, primary: true, match: /^\/(dang|studio\/works|studio\/tuyen-mau)/ },
  { href: "/studio/schedule", label: "Lịch", icon: ListChecks },
  { href: "/me", label: "Tôi", icon: User, match: /^\/(me|studio\/(services|profile|wallet|verify|khach))/ },
]

/**
 * Desktop has room for words; it shows the places, not the post button.
 * "Tuyển mẫu" is not here: it is for people who want to model, not for
 * booking, and lives in the footer and in "Tôi".
 */
const CUSTOMER_TOP: NavItem[] = [
  { href: "/", label: "Khám phá", icon: Compass, match: /^\/($|works|dip)/ },
  { href: "/pros", label: "Người làm", icon: User, match: /^\/pros/ },
  { href: "/bookings", label: "Lịch hẹn", icon: CalendarDays, match: /^\/(bookings|requests)/ },
  { href: "/saved", label: "Đã lưu", icon: User, match: /^\/saved/ },
]

const PRO_TOP: NavItem[] = [
  { href: "/studio", label: "Hôm nay", icon: House, match: /^\/studio$/ },
  { href: "/studio/jobs", label: "Việc mới", icon: BriefcaseBusiness },
  { href: "/studio/schedule", label: "Lịch", icon: ListChecks },
  { href: "/studio/works", label: "Tác phẩm", icon: Plus },
  { href: "/studio/services", label: "Bảng giá", icon: Plus },
]

// The operations desk draws its own frame: sidebar, top bar, no shop footer.
const FULLSCREEN = [/^\/login/, /^\/admin(\/|$)/]
// A profile has its own bottom bar ("Từ X · Đặt lịch"), like a work and a booking.
const NO_TABBAR = [/^\/book\//, /^\/works\//, /^\/pros\/./, /^\/bookings\/./, /^\/requests\/./, /^\/studio\/verify/]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const state = useApp()
  const { session } = state
  const isPro = session?.role === "pro"
  const nav = isPro ? PRO_NAV : CUSTOMER_NAV
  const top = isPro ? PRO_TOP : CUSTOMER_TOP

  if (FULLSCREEN.some((r) => r.test(pathname))) return <LiveRegionProvider>{children}</LiveRegionProvider>

  const isActive = (item: NavItem) => (item.match ? item.match.test(pathname) : pathname.startsWith(item.href))
  const showTabbar = !NO_TABBAR.some((r) => r.test(pathname))

  return (
    <LiveRegionProvider>
      <div className="min-h-dvh">
      <header className="sticky top-0 z-40 hidden border-b border-line bg-[rgb(255_253_250/0.92)] backdrop-blur-md md:block">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-6 px-6">
          <Link href={isPro ? "/studio" : "/"} aria-label={isPro ? "360dep Đối tác" : "360dep"} className="flex shrink-0 items-center gap-2">
            <Logo />
            {isPro && <span className="rounded-full bg-accent-soft px-2.5 py-1 text-label font-semibold text-accent-dark">Đối tác</span>}
          </Link>
          <nav className="no-scrollbar flex h-full min-w-0 flex-1 items-stretch gap-1 overflow-x-auto">
            {top.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={cn(
                  // An ink underline marks where you are; nothing else is coloured.
                  "relative inline-flex shrink-0 items-center whitespace-nowrap px-3 text-[15px] font-semibold transition-colors",
                  isActive(item)
                    ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[2.5px] after:rounded-full after:bg-ink"
                    : "text-ink-soft hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {pathname !== "/" && !isPro && (
            <Link
              href="/search"
              className="hidden h-10 w-60 shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full border border-line bg-surface px-4 text-meta text-muted shadow-[0_1px_2px_rgb(28_24_18/0.04)] hover:border-ink xl:inline-flex"
            >
              <Search className="size-4 shrink-0 text-ink" /> <span className="truncate">Tìm nail, makeup, chụp ảnh…</span>
            </Link>
          )}
          {session ? (
            <div className="flex items-center gap-1.5">
              {/* Staff only. The middleware and is_admin() in the database still guard /admin itself.
                  A full page load: the desk loads a smaller snapshot than the shop (app/layout.tsx). */}
              {session.isAdmin && (
                // eslint-disable-next-line @next/next/no-html-link-for-pages
                <a
                  href="/admin"
                  aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                  className={cn(
                    "mr-1 inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-meta font-semibold",
                    pathname.startsWith("/admin") ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink hover:border-ink",
                  )}
                >
                  <ShieldCheck className="size-4" aria-hidden /> Admin
                </a>
              )}
              <Link href="/tin-nhan" aria-label="Tin nhắn" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-subtle">
                <MessageCircle className="size-5" />
              </Link>
              <Link href="/thong-bao" aria-label="Thông báo" className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-subtle">
                <Bell className="size-5" />
                {state.unreadNotifications > 0 && (
                  <span className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-accent px-1 text-center text-[11px] font-bold leading-[18px] text-white ring-2 ring-surface">
                    {state.unreadNotifications > 9 ? "9+" : state.unreadNotifications}
                  </span>
                )}
              </Link>
              {/* Only an account that is already a partner has two modes to switch between. */}
              {session.proId && (
                <button
                  type="button"
                  onClick={async () => {
                    await actions.switchRole(isPro ? "customer" : "pro")
                    router.push(isPro ? "/" : "/studio")
                  }}
                  className="ml-1 h-10 rounded-full border border-line bg-surface px-4 text-meta font-semibold text-ink hover:border-ink"
                >
                  {isPro ? "Chế độ đặt lịch" : "Chế độ đối tác"}
                </button>
              )}
              <Link href="/me" aria-label="Tài khoản" className="ml-1 rounded-full hover:opacity-85">
                <Avatar name={session.name} size={36} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[15px] font-semibold text-ink hover:border-ink">
                <User className="size-4" aria-hidden /> Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className={cn("mx-auto max-w-[1200px] px-4 md:px-6", showTabbar ? "pb-28 md:pb-10" : "pb-6")} id="main">
        {children}
      </main>

      {/* Only on the customer side: the studio is a workspace, not a website. */}
      {!isPro && <Footer />}

      {showTabbar && (
        <nav
          aria-label="Điều hướng chính"
          className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[rgb(255_253_250/0.94)] shadow-[0_-8px_24px_-18px_rgb(28_24_18/0.25)] backdrop-blur-md md:hidden"
        >
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {nav.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              if (item.primary)
                return (
                  <li key={item.href} className="flex items-center justify-center">
                    <Link
                      href={item.href}
                      aria-label={isPro ? "Đăng tác phẩm hoặc tuyển mẫu" : "Đăng yêu cầu"}
                      aria-current={active ? "page" : undefined}
                      className="flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-center text-[11.5px] font-bold text-ink"
                    >
                      <span className="flex size-10 items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_14px_-6px_rgb(187_52_96/0.7)]"><Icon className="size-5 stroke-[2.25]" /></span>
                      {item.label}
                    </Link>
                  </li>
                )
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      // A tab bar is the most-tapped thing in the app: 44px tall
                      // and a label you can read without squinting.
                      "flex min-h-14 flex-col items-center justify-center gap-1 py-1.5 text-center text-[11.5px]",
                      active ? "font-bold text-ink" : "font-medium text-muted",
                    )}
                  >
                    <Icon className={cn("size-6", active ? "stroke-[2.25]" : "stroke-[1.75]")} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
      </div>
    </LiveRegionProvider>
  )
}
