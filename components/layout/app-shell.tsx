"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, BriefcaseBusiness, CalendarDays, Compass, House, ListChecks, MessageCircle, Plus, Search, User } from "lucide-react"
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
  { href: "/dang", label: "Đăng", icon: Plus, primary: true, match: /^\/(dang|requests\/new)/ },
  { href: "/bookings", label: "Lịch hẹn", icon: CalendarDays, match: /^\/(bookings|requests)/ },
  { href: "/me", label: "Tôi", icon: User, match: /^\/(me|saved)/ },
]

const PRO_NAV: NavItem[] = [
  { href: "/studio", label: "Hôm nay", icon: House, match: /^\/studio$/ },
  { href: "/studio/jobs", label: "Việc mới", icon: BriefcaseBusiness },
  { href: "/dang", label: "Đăng", icon: Plus, primary: true, match: /^\/(dang|studio\/works|studio\/tuyen-mau)/ },
  { href: "/studio/schedule", label: "Lịch", icon: ListChecks },
  { href: "/me", label: "Tôi", icon: User, match: /^\/(me|studio\/(services|profile|wallet|verify))/ },
]

/** Desktop has room for words; it shows the places, not the post button. */
const CUSTOMER_TOP: NavItem[] = [
  { href: "/", label: "Khám phá", icon: Compass, match: /^\/($|works|dip)/ },
  { href: "/pros", label: "Người làm", icon: User, match: /^\/pros/ },
  { href: "/tuyen-mau", label: "Tuyển mẫu", icon: User, match: /^\/tuyen-mau/ },
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

const FULLSCREEN = [/^\/login/]
const NO_TABBAR = [/^\/book\//, /^\/works\//, /^\/bookings\/./, /^\/requests\/./, /^\/studio\/verify/]

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
      <header className="sticky top-0 z-40 hidden border-b border-line bg-canvas/90 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
          <Link href={isPro ? "/studio" : "/"} aria-label="360dep">
            <Logo />
          </Link>
          <nav className="flex flex-1 items-center gap-0.5">
            {top.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[14px] font-semibold transition-colors",
                  isActive(item) ? "bg-ink text-white" : "text-ink-soft hover:bg-subtle hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {pathname !== "/" && !isPro && (
            <Link
              href="/search"
              className="hidden h-10 w-56 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[14px] text-muted hover:border-ink/30 lg:inline-flex"
            >
              <Search className="size-4 text-ink" /> Tìm kiếm
            </Link>
          )}
          {session ? (
            <div className="flex items-center gap-1.5">
              <Link href="/tin-nhan" aria-label="Tin nhắn" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-subtle">
                <MessageCircle className="size-5" />
              </Link>
              <Link href="/thong-bao" aria-label="Thông báo" className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-subtle">
                <Bell className="size-5" />
                {state.unreadNotifications > 0 && (
                  <span className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-accent px-1 text-center text-[11px] font-bold leading-[18px] text-white">
                    {state.unreadNotifications > 9 ? "9+" : state.unreadNotifications}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={async () => {
                  if (!isPro && !session.proId) return router.push("/studio/onboarding")
                  await actions.switchRole(isPro ? "customer" : "pro")
                  router.push(isPro ? "/" : "/studio")
                }}
                className="ml-1 h-10 rounded-full border border-line px-4 text-[13px] font-semibold text-ink hover:border-ink/30"
              >
                {isPro ? "Chế độ đặt lịch" : session.proId ? "Chế độ làm việc" : "Nhận khách trên 360dep"}
              </button>
              <Link href="/me" aria-label="Tài khoản" className="ml-1 rounded-full hover:opacity-85">
                <Avatar name={session.name} size={36} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login?role=pro" className="hidden h-10 items-center rounded-full px-4 text-[14px] font-semibold text-ink hover:bg-subtle lg:inline-flex">
                Nhận khách trên 360dep
              </Link>
              <Link href="/login" className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-white hover:bg-ink/85">
                Đăng nhập
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
          className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden"
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
                      className="flex size-12 items-center justify-center rounded-2xl bg-ink text-white shadow-[var(--shadow-raised)] transition-transform active:scale-95"
                    >
                      <Icon className="size-6" />
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
                      "flex min-h-14 flex-col items-center justify-center gap-0.5 py-1.5 text-[12px]",
                      active ? "font-bold text-ink" : "font-medium text-muted",
                    )}
                  >
                    <Icon className={cn("size-6", active && "stroke-[2.4]")} />
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
