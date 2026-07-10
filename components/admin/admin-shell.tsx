"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FileText,
  Gauge,
  Radar,
  LayoutDashboard,
  MessageSquare,
  Package,
  SearchCheck,
  Settings,
  Store,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Command Center", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/posts", label: "Bài viết", icon: FileText },
      { href: "/admin/reviews", label: "Đánh giá", icon: MessageSquare },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/products", label: "Sản phẩm", icon: Package },
      { href: "/admin/offers", label: "Affiliate offers", icon: Store },
    ],
  },
  {
    label: "Creator Data",
    items: [
      { href: "/admin/monitoring", label: "Evidence Radar", icon: Radar },
      { href: "/admin/evidence", label: "Evidence inbox", icon: ClipboardList },
      { href: "/admin/timeline", label: "Timeline", icon: CalendarClock },
      { href: "/admin/kols", label: "KOL/KOC", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/seo", label: "SEO audit", icon: SearchCheck },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Ops Center</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">360dep.vn admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Về trang chính
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">Ops Center</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">360dep.vn admin</div>
            </div>
            <Link href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
              Home
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {NAV_GROUPS.flatMap((group) => group.items).map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-bold",
                    isActive
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
