"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, BriefcaseBusiness, CalendarDays, Compass, House, ListChecks, MessageCircle, MessageSquare, Paintbrush, Plus, Search, ShieldCheck, User } from "lucide-react"
import { Footer } from "@/components/layout/footer"
import { LiveRegionProvider } from "@/components/live-region"
import { CitySelect } from "@/components/shop"
import { Avatar, Logo, Wordmark } from "@/components/ui"
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

/** The same four places on the phone and in the app (apps/mobile). Search is in the bar on top. */
const CUSTOMER_NAV: NavItem[] = [
  { href: "/", label: "Khám phá", icon: Compass, match: /^\/($|search|works|dip|dich-vu)/ },
  { href: "/pros", label: "Artist", icon: Paintbrush, match: /^\/pros/ },
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
 * Desktop has room for words; it shows the places, not the post button. The
 * wordmark goes home. "Đã lưu" is under the account (/me), and "Tuyển mẫu" is
 * for people who want to model, not for booking: footer and "Tôi".
 */
const CUSTOMER_TOP: NavItem[] = [
  { href: "/search", label: "Dịch vụ", icon: Compass, match: /^\/(search|dich-vu|dat-lich|requests\/new)/ },
  { href: "/pros", label: "Artist", icon: Paintbrush, match: /^\/pros/ },
  { href: "/bookings", label: "Lịch hẹn", icon: CalendarDays, match: /^\/(bookings|requests(?!\/new))/ },
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
const NO_TABBAR = [/^\/book\//, /^\/dat-lich/, /^\/works\//, /^\/pros\/./, /^\/bookings\/./, /^\/requests\/./, /^\/studio\/verify/]
// The pages a customer starts from carry the rose bar on a phone too; the rest have their own back bar.
const PHONE_BAR = [/^\/$/, /^\/pros$/]

/** Type and go: the results, with every filter, are on /search. */
function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  return (
    <form
      role="search"
      className={cn("flex h-[46px] min-w-0 items-center gap-2.5 rounded-xl bg-surface px-4 focus-within:ring-2 focus-within:ring-accent/40", className)}
      onSubmit={(e) => {
        e.preventDefault()
        router.push(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)
      }}
    >
      <Search className="size-[18px] shrink-0 text-muted" aria-hidden />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        placeholder="Nail, makeup, tên Artist…"
        aria-label="Tìm dịch vụ hoặc Artist"
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-muted focus:outline-none"
      />
    </form>
  )
}

function InboxLinks({ unread }: { unread: number }) {
  const box = "relative inline-flex size-11 items-center justify-center rounded-full hover:bg-white/70"
  return (
    <>
      <Link href="/tin-nhan" aria-label="Tin nhắn" className={box}>
        <MessageSquare className="size-[22px]" aria-hidden />
      </Link>
      <Link href="/thong-bao" aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"} className={box}>
        <Bell className="size-[22px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-accent px-1 text-center text-[11px] font-bold leading-[18px] text-white ring-2 ring-accent-soft">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </>
  )
}

const barPill = "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-white/70"

/** A flat rose bar, as in the app: the places, search, messages, the account. Nothing floats over the page. */
function CustomerHeader({ top, isActive }: { top: NavItem[]; isActive: (item: NavItem) => boolean }) {
  const router = useRouter()
  const state = useApp()
  const { session } = state
  return (
    <header className="sticky top-0 z-40 hidden bg-accent-soft md:block">
      <div className="mx-auto flex h-[76px] max-w-[1216px] items-center gap-5 px-6 lg:gap-10">
        <Link href="/" aria-label="360đẹp" className="shrink-0">
          <Wordmark size={30} />
        </Link>
        <nav aria-label="Điều hướng chính" className="flex shrink-0 items-center gap-5 lg:gap-[30px]">
          {top.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn("inline-flex h-11 items-center whitespace-nowrap text-[16px] hover:text-accent-dark", isActive(item) ? "font-bold text-accent-dark" : "font-medium text-ink")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <HeaderSearch className="ml-auto max-w-[420px] flex-1" />
        <div className="flex shrink-0 items-center gap-1">
          {/* Staff only. The middleware and is_admin() in the database still guard /admin itself.
              A full page load: the desk loads a smaller snapshot than the shop (app/layout.tsx). */}
          {session?.isAdmin && (
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/admin" className={cn(barPill, "mr-1 hidden xl:inline-flex")}>
              <ShieldCheck className="size-4" aria-hidden /> Admin
            </a>
          )}
          {/* Only an account that is already a partner has two modes; also on /me on narrower screens. */}
          {session?.proId && (
            <button
              type="button"
              onClick={async () => {
                await actions.switchRole("pro")
                router.push("/studio")
              }}
              className={cn(barPill, "mr-1 hidden xl:inline-flex")}
            >
              Chế độ đối tác
            </button>
          )}
          <InboxLinks unread={state.unreadNotifications} />
          <Link href={session ? "/me" : "/login"} aria-label={session ? "Tài khoản" : "Đăng nhập"} className="ml-1 inline-flex size-10 items-center justify-center rounded-full bg-surface text-accent hover:bg-white/70">
            <User className="size-5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  )
}

/** The same bar on a phone: wordmark, area, messages, then search. The places are in the tab bar. */
function PhoneBar() {
  const state = useApp()
  return (
    <div className="bg-accent-soft pt-[env(safe-area-inset-top)] md:hidden">
      <div className="flex min-h-[52px] items-center gap-1 pl-4 pr-2">
        <Link href="/" aria-label="360đẹp" className="mr-auto shrink-0">
          <Wordmark size={26} />
        </Link>
        <CitySelect value={state.city} variant="bar" className="max-w-[140px]" />
        <InboxLinks unread={state.unreadNotifications} />
      </div>
      <div className="px-4 pb-3">
        <HeaderSearch />
      </div>
    </div>
  )
}

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
      <div className={cn("min-h-dvh", !isPro && "shop-theme")}>
      {!isPro && <CustomerHeader top={top} isActive={isActive} />}
      {!isPro && PHONE_BAR.some((r) => r.test(pathname)) && <PhoneBar />}
      {isPro && (
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
      )}

      <main className={cn("mx-auto px-4 md:px-6", isPro ? "max-w-[1200px]" : "max-w-[1216px]", showTabbar ? "pb-28 md:pb-10" : "pb-6")} id="main">
        {children}
      </main>

      {/* Only on the customer side: the studio is a workspace, not a website. */}
      {!isPro && <Footer />}

      {showTabbar && (
        <nav
          aria-label="Điều hướng chính"
          className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[rgb(255_253_250/0.94)] shadow-[0_-8px_24px_-18px_rgb(28_24_18/0.25)] backdrop-blur-md md:hidden"
        >
          <ul className={cn("mx-auto grid max-w-md", nav.length === 4 ? "grid-cols-4" : "grid-cols-5")}>
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
