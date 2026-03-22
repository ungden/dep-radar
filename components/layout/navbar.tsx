"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, Search, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { supabase } from "@/lib/supabase"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
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
          <div className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400 transition-colors" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              className="w-full bg-slate-50 dark:bg-slate-900 pl-10 rounded-none border-slate-200 dark:border-slate-800 focus-visible:ring-0 focus-visible:border-rose-600 dark:focus-visible:border-rose-500 transition-colors h-10"
            />
          </div>
          <ModeToggle />
          <Button variant="ghost" size="icon" className="rounded-none hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 dark:hover:text-rose-400">
            <User className="h-5 w-5" />
            <span className="sr-only">Tài khoản</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button variant="ghost" size="icon" className="rounded-none">
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-xl absolute w-full left-0 top-[65px]">
          <nav className="flex flex-col gap-6">
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
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
              <Button variant="outline" className="w-full justify-center rounded-none border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50 h-12 font-bold uppercase tracking-wider">
                Đăng nhập
              </Button>
              <Button className="w-full justify-center rounded-none bg-rose-600 hover:bg-rose-700 text-white h-12 font-bold uppercase tracking-wider">
                Đăng ký
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
