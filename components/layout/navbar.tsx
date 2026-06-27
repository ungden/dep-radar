"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Menu, Search, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { topCatalogueNavigation } from "@/lib/catalogue"
import { isSupabaseSchemaReady, supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

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
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
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
      {/* Top Bar - Magazine Style */}
      <div className="hidden md:flex justify-between items-center px-6 py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div className="flex gap-4">
          <Link href="#" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Đăng ký nhận tin</Link>
          <Link href="#" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Liên hệ</Link>
        </div>
      </div>

      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50 uppercase">
              360°<span className="text-rose-600 dark:text-rose-500">đẹp</span>
            </span>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link
              href="/catalogue"
              className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Catalogue
            </Link>
            <Link
              href="/products"
              className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Sản phẩm
            </Link>
            <Link
              href="/koc-tracker"
              className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              KOL/KOC Tracker
            </Link>
            <Link
              href="/blog"
              className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/community"
              className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Cộng đồng
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400 transition-colors" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 pl-10 rounded-none border-slate-200 dark:border-slate-800 focus-visible:ring-0 focus-visible:border-rose-600 dark:focus-visible:border-rose-500 transition-colors h-10"
            />
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

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            onClick={() => { setIsMobileSearchOpen(!isMobileSearchOpen); setIsMobileMenuOpen(false) }}
          >
            <Search className="h-5 w-5 text-slate-900 dark:text-slate-50" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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

      <div className="hidden md:block border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90">
        <nav className="container mx-auto flex gap-5 overflow-x-auto px-4 py-3 md:px-6">
          {topCatalogueNavigation.map((item) => (
            <Link
              key={item.slug}
              href={`/catalogue/${item.slug}`}
              className="shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300"
            >
              {item.shortTitle}
            </Link>
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
              placeholder="Tìm kiếm sản phẩm, bài viết, KOL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 pl-10 rounded-none border-slate-200 dark:border-slate-800 focus-visible:ring-0 focus-visible:border-rose-600 dark:focus-visible:border-rose-500 transition-colors h-12"
              autoFocus
            />
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-xl absolute w-full left-0 top-[65px]">
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
              Blog
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
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
              {topCatalogueNavigation.map((item) => (
                <Link
                  key={item.slug}
                  href={`/catalogue/${item.slug}`}
                  className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.shortTitle}
                </Link>
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
