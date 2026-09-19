"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Heart,
  LayoutGrid,
  ListChecks,
  Scissors,
  Search,
  User,
  Users,
} from "lucide-react"
import { Footer } from "@/components/layout/footer"
import { LiveRegionProvider } from "@/components/live-region"
import { Avatar, Logo } from "@/components/ui"
import { actions } from "@/lib/client-actions"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; match?: RegExp }

const CUSTOMER_NAV: NavItem[] = [
  { href: "/", label: "Khám phá", icon: Search, match: /^\/($|search|works)/ },
  { href: "/pros", label: "Chuyên viên", icon: Users, match: /^\/pros/ },
  { href: "/saved", label: "Đã lưu", icon: Heart },
  { href: "/bookings", label: "Lịch hẹn", icon: CalendarDays, match: /^\/(bookings|requests)/ },
  { href: "/me", label: "Cá nhân", icon: User },
]

const PRO_NAV: NavItem[] = [
  { href: "/studio", label: "Tổng quan", icon: LayoutGrid, match: /^\/studio$/ },
  { href: "/studio/jobs", label: "Việc mới", icon: BriefcaseBusiness },
  { href: "/studio/schedule", label: "Lịch làm", icon: ListChecks },
  { href: "/studio/services", label: "Dịch vụ", icon: Scissors },
  { href: "/me", label: "Cá nhân", icon: User },
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

  if (FULLSCREEN.some((r) => r.test(pathname))) return <LiveRegionProvider>{children}</LiveRegionProvider>

  const isActive = (item: NavItem) => (item.match ? item.match.test(pathname) : pathname.startsWith(item.href))
  const showTabbar = !NO_TABBAR.some((r) => r.test(pathname))

  return (
    <LiveRegionProvider>
      <div className="min-h-dvh">
      <header className="sticky top-0 z-40 hidden border-b border-line bg-canvas/90 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Link href={isPro ? "/studio" : "/"} aria-label="dep360">
            <Logo />
          </Link>
          <nav className="flex flex-1 items-center gap-1">
            {nav.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors",
                  isActive(item) ? "bg-blush font-semibold text-rose-dark" : "text-ink-soft hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/thong-bao"
                aria-label="Thông báo"
                className="relative inline-flex size-9 items-center justify-center rounded-full hover:bg-blush/60"
              >
                <Bell className="size-[18px]" />
                {state.unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 min-w-4 rounded-full bg-rose px-1 text-[10px] font-semibold leading-4 text-white">
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
                className="rounded-full border border-line px-4 py-2 text-[13px] text-ink-soft hover:border-rose hover:text-rose"
              >
                {isPro ? "Chuyển sang đặt lịch" : "Chế độ chuyên viên"}
              </button>
              <Link href="/me" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-blush/60">
                <Avatar name={session.name} size={32} />
                <span className="text-sm font-medium">{session.name}</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-full bg-rose px-5 py-2 text-sm font-medium text-white hover:bg-rose-dark">
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className={cn("mx-auto max-w-6xl px-4 md:px-6", showTabbar ? "pb-24" : "pb-6")} id="main">
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
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[10.5px]",
                      active ? "font-semibold text-rose" : "text-muted",
                    )}
                  >
                    <Icon className="size-[22px]" />
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
