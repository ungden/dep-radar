"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Menu, Search, User, X } from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { catalogueGroups, getCatalogueSectionsByGroup } from "@/lib/catalogue"
import { isSupabaseSchemaReady, supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

const primaryNavItems = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/koc-tracker", label: "KOL/KOC" },
  { href: "/blog", label: "Kiến thức" },
]

export function Navbar() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false)
  const userMenuRef = React.useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const formQuery = formData.get("q")
    const query = (typeof formQuery === "string" ? formQuery : searchQuery).trim()

    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      setIsMobileSearchOpen(false)
      setIsMobileMenuOpen(false)
    }
  }

  React.useEffect(() => {
    if (!isSupabaseSchemaReady) return

    // Check if user is admin
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!error && data) {
        setIsAdmin(true)
      }
    })
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
      <div className="hidden border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400 md:block">
        <div className="container mx-auto flex items-center justify-between gap-6 px-4 py-2 md:px-6">
          <div className="min-w-0 truncate">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <Link href="/blog" className="transition-colors hover:text-rose-600 dark:hover:text-rose-400">
              Beauty Desk
            </Link>
            <Link href="/community" className="transition-colors hover:text-rose-600 dark:hover:text-rose-400">
              Gửi review
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 md:h-20 md:px-6 lg:gap-6">
        <div className="flex min-w-0 items-center">
          <BrandLogo markClassName="h-10 w-10 rounded-xl md:h-11 md:w-11 md:rounded-2xl" />
        </div>

        <div className="hidden min-w-0 justify-center lg:flex">
          <nav className="flex min-w-0 items-center justify-center gap-4 xl:gap-6">
            {primaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm font-bold uppercase tracking-wider text-slate-900 transition-colors hover:text-rose-600 dark:text-slate-50 dark:hover:text-rose-400"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="whitespace-nowrap text-sm font-bold uppercase tracking-wider text-rose-600 transition-colors hover:text-rose-700 dark:text-rose-500 dark:hover:text-rose-400"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden items-center justify-end gap-3 md:flex">
          <form onSubmit={handleSearch} className="group relative hidden w-44 md:block xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400 transition-colors" />
            <Input
              type="search"
              name="q"
              placeholder="Tìm sản phẩm, bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-none border-slate-200 bg-slate-50 pl-10 pr-10 transition-colors focus-visible:border-rose-600 focus-visible:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:focus-visible:border-rose-500"
            />
            <button
              type="submit"
              aria-label="Gửi tìm kiếm"
              className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
          <ModeToggle />
          {authLoading ? (
            <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-rose-600 text-white text-sm font-bold uppercase hover:bg-rose-700 transition-colors"
              >
                {user.user_metadata?.full_name
                  ? user.user_metadata.full_name.charAt(0)
                  : user.email?.charAt(0) ?? "U"}
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                      {user.user_metadata?.full_name ?? user.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Tài khoản
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut()
                      setIsUserMenuOpen(false)
                      router.push("/")
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login">
              <Button variant="ghost" className="rounded-none hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 dark:hover:text-rose-400 text-sm font-bold uppercase tracking-wider">
                Đăng nhập
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            aria-label="Tìm kiếm"
            aria-expanded={isMobileSearchOpen}
            onClick={() => { setIsMobileSearchOpen(!isMobileSearchOpen); setIsMobileMenuOpen(false) }}
          >
            <Search className="h-5 w-5 text-slate-900 dark:text-slate-50" />
            <span className="sr-only">Tìm kiếm</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            aria-label="Menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen)
              setIsMobileSearchOpen(false)
            }}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-900 dark:text-slate-50" />
            ) : (
              <Menu className="h-6 w-6 text-slate-900 dark:text-slate-50" />
            )}
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>

      <div className="hidden border-t border-slate-100 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90 md:block">
        <nav aria-label="Nhóm catalogue" className="container mx-auto flex items-center justify-center gap-2 px-4 py-2 md:px-6">
          {catalogueGroups.map((group) => (
            <details key={group.slug} className="group relative">
              <summary className="flex min-h-10 cursor-pointer list-none items-center rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-rose-300">
                {group.title}
              </summary>
              <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {getCatalogueSectionsByGroup(group.slug).map((section) => (
                  <Link key={section.slug} href={`/catalogue/${section.slug}`} className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-300">
                    {section.shortTitle}<span className="text-xs font-medium text-slate-400">→</span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </nav>
      </div>

      {/* Mobile Search */}
      {isMobileSearchOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-xl absolute w-full left-0 top-[65px] z-50">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              type="search"
              name="q"
              placeholder="Tìm kiếm sản phẩm, bài viết, KOL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-none border-slate-200 bg-slate-50 pl-10 pr-12 transition-colors focus-visible:border-rose-600 focus-visible:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:focus-visible:border-rose-500"
              autoFocus
            />
            <button
              type="submit"
              aria-label="Gửi tìm kiếm"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute left-0 top-[65px] max-h-[calc(100dvh-65px)] w-full overflow-y-auto border-t border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <nav className="flex flex-col gap-6">
            <Link
              href="/catalogue"
              className="text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Catalogue
            </Link>
            <Link
              href="/products"
              className="text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sản phẩm
            </Link>
            <Link
              href="/koc-tracker"
              className="text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              KOL/KOC Tracker
            </Link>
            <Link
              href="/blog"
              className="text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Kiến thức
            </Link>
            <Link
              href="/community"
              className="text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Cộng đồng
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-lg font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500 hover:text-rose-700 dark:hover:text-rose-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            <div className="space-y-5 border-t border-slate-100 pt-5 dark:border-slate-800">
              {catalogueGroups.map((group) => (
                <section key={group.slug} aria-labelledby={`mobile-${group.slug}`}>
                  <h2 id={`mobile-${group.slug}`} className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">{group.title}</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {getCatalogueSectionsByGroup(group.slug).map((item) => (
                      <Link
                        key={item.slug}
                        href={`/catalogue/${item.slug}`}
                        className="flex min-h-11 items-center rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.shortTitle}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-1 pb-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-rose-600 text-white text-sm font-bold uppercase">
                      {user.user_metadata?.full_name
                        ? user.user_metadata.full_name.charAt(0)
                        : user.email?.charAt(0) ?? "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                        {user.user_metadata?.full_name ?? user.email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center rounded-none border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50 h-12 font-bold uppercase tracking-wider">
                      Tài khoản
                    </Button>
                  </Link>
                  <Button
                    onClick={async () => {
                      await signOut()
                      setIsMobileMenuOpen(false)
                      router.push("/")
                    }}
                    className="w-full justify-center rounded-none bg-rose-600 hover:bg-rose-700 text-white h-12 font-bold uppercase tracking-wider"
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center rounded-none border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50 h-12 font-bold uppercase tracking-wider">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-center rounded-none bg-rose-600 hover:bg-rose-700 text-white h-12 font-bold uppercase tracking-wider">
                      Đăng ký
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
