"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Search, SlidersHorizontal, X } from "lucide-react"
import { ProCard, WorkCard } from "@/components/beauty"
import { Chip, EmptyState, Tabs, PageSkeleton } from "@/components/ui"
import { sortPros } from "@/components/trust"
import { CATEGORIES, getTemplate } from "@/lib/catalog"
import { CITIES } from "@/lib/geo"
import { distanceToCustomer, fromPrice, proView, useApp } from "@/lib/store"
import type { CategoryId } from "@/lib/types"
import { cn } from "@/lib/utils"

const PRICE_OPTIONS = [
  { value: "", label: "Mọi mức giá" },
  { value: "300000", label: "Dưới 300k" },
  { value: "500000", label: "Dưới 500k" },
  { value: "1000000", label: "Dưới 1 triệu" },
]

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
}

export default function SearchPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchView />
    </Suspense>
  )
}

function SearchView() {
  const router = useRouter()
  const params = useSearchParams()
  const state = useApp()
  const [q, setQ] = React.useState(params.get("q") ?? "")
  const [showFilters, setShowFilters] = React.useState(false)
  const [mode, setMode] = React.useState<"works" | "pros">("works")

  const category = (params.get("category") as CategoryId | null) ?? null
  const city = params.get("city") ?? state.city ?? ""
  const maxPrice = Number(params.get("price") ?? 0)
  const topRated = params.get("rating") === "1"
  const atHome = params.get("home") === "1"
  const openOnly = params.get("open") === "1"
  const sort = (params.get("sort") as "match" | "price" | "near" | null) ?? "match"
  const query = params.get("q") ?? ""

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`/search?${next.toString()}`, { scroll: false })
  }

  const works = React.useMemo(() => {
    const nq = normalize(query)
    return state.works.filter((w) => {
      const pro = proView(state, w.proId)
      if (!pro) return false
      const price = fromPrice(state, w.proId, w.templateId)
      if (category && w.category !== category) return false
      if (city && pro.city !== city) return false
      if (maxPrice && price !== null && price > maxPrice) return false
      if (topRated && pro.rating.average < 4.8) return false
      if (atHome && !pro.homeService) return false
      if (openOnly && !pro.acceptingJobs) return false
      if (nq && !normalize(`${w.title} ${w.description} ${getTemplate(w.templateId)?.name} ${pro.name} ${pro.title}`).includes(nq)) return false
      return true
    })
  }, [state, query, category, city, maxPrice, topRated, atHome, openOnly])

  // Sorting works by the price of the service the work is for, or by how far the
  // freelancer is from the customer's saved address.
  const sortedWorks = React.useMemo(() => {
    if (sort === "match") return works
    return [...works].sort((a, b) => {
      if (sort === "price") {
        return (fromPrice(state, a.proId, a.templateId) ?? Infinity) - (fromPrice(state, b.proId, b.templateId) ?? Infinity)
      }
      const da = distanceToCustomer(state, a.proId)
      const db = distanceToCustomer(state, b.proId)
      return (da ?? Infinity) - (db ?? Infinity)
    })
  }, [works, sort, state])

  const pros = React.useMemo(() => {
    const nq = normalize(query)
    const list = state.pros.filter((p) => {
      if (category && !p.categories.includes(category)) return false
      if (city && p.city !== city) return false
      if (topRated && p.rating.average < 4.8) return false
      if (atHome && !p.homeService) return false
      if (openOnly && !p.acceptingJobs) return false
      if (nq && !normalize(`${p.name} ${p.title} ${p.bio} ${p.district}`).includes(nq)) return false
      return true
    })
    if (sort === "near") {
      return [...list].sort(
        (a, b) => (distanceToCustomer(state, a.id) ?? Infinity) - (distanceToCustomer(state, b.id) ?? Infinity),
      )
    }
    if (sort === "price") {
      return [...list].sort((a, b) => (fromPrice(state, a.id) ?? Infinity) - (fromPrice(state, b.id) ?? Infinity))
    }
    return sortPros(state, list, "match")
  }, [state, query, category, city, topRated, atHome, openOnly, sort])

  const activeFilters = [city, maxPrice, topRated, atHome, openOnly].filter(Boolean).length

  return (
    <div className="md:pt-6">
      <div className="sticky top-0 z-30 -mx-4 bg-canvas/95 px-4 pb-3 pt-2 backdrop-blur md:static md:mx-0 md:px-0">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Quay lại" onClick={() => router.back()} className="-ml-2 inline-flex size-10 items-center justify-center md:hidden">
            <ChevronLeft className="size-5" />
          </button>
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault()
              setParam("q", q.trim() || null)
            }}
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              aria-label="Tìm kiếm"
              placeholder="Nail trơn, makeup tiệc, nối mi..."
              className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-10 text-sm focus:border-accent focus:outline-none"
            />
            {q && (
              <button
                type="button"
                aria-label="Xóa"
                onClick={() => {
                  setQ("")
                  setParam("q", null)
                }}
                className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted"
              >
                <X className="size-4" />
              </button>
            )}
          </form>
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          <Chip active={showFilters || activeFilters > 0} onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="size-3.5" /> Lọc{activeFilters ? ` (${activeFilters})` : ""}
          </Chip>
          <Chip active={!category} onClick={() => setParam("category", null)}>
            Tất cả
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setParam("category", category === c.id ? null : c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-soft)] sm:grid-cols-2 md:grid-cols-4">
            <SelectFilter label="Khu vực" value={city} onChange={(v) => setParam("city", v || null)}>
              <option value="">Toàn quốc</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectFilter>
            <SelectFilter label="Giá" value={maxPrice ? String(maxPrice) : ""} onChange={(v) => setParam("price", v || null)}>
              {PRICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </SelectFilter>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={topRated} onChange={(e) => setParam("rating", e.target.checked ? "1" : null)} className="size-4 accent-[var(--color-ink)]" />
              Đánh giá từ 4.8
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={atHome} onChange={(e) => setParam("home", e.target.checked ? "1" : null)} className="size-4 accent-[var(--color-ink)]" />
              Nhận làm tại nhà
            </label>
            {/* "Đang nhận job", not "rảnh hôm nay": this is a fact on the
                profile, where free time depends on the service and the day. */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setParam("open", e.target.checked ? "1" : null)}
                className="size-4 accent-[var(--color-ink)]"
              />
              Đang nhận job
            </label>
            <SelectFilter label="Sắp xếp" value={sort} onChange={(v) => setParam("sort", v === "match" ? null : v)}>
              <option value="match">Phù hợp nhất</option>
              <option value="price">Giá thấp trước</option>
              <option value="near">Gần tôi nhất</option>
            </SelectFilter>
          </div>
        )}
      </div>

      <Tabs
        value={mode}
        onChange={setMode}
        items={[
          { value: "works", label: `Tác phẩm (${sortedWorks.length})` },
          { value: "pros", label: `Chuyên viên (${pros.length})` },
        ]}
      />

      {mode === "works" ? (
        sortedWorks.length ? (
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 xl:grid-cols-5">
            {sortedWorks.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        ) : (
          <NoResults />
        )
      ) : pros.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {pros.map((p) => (
            <ProCard key={p.id} pro={p} />
          ))}
        </div>
      ) : (
        <NoResults />
      )}
    </div>
  )
}

function SelectFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("mt-1 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none")}
      >
        {children}
      </select>
    </label>
  )
}

function NoResults() {
  return (
    <EmptyState
      icon={<Search className="size-6" />}
      title="Không tìm thấy kết quả"
      text="Thử bỏ bớt bộ lọc, hoặc đăng yêu cầu để freelancer chủ động báo giá cho bạn."
      action={
        <Link href="/requests/new" className="text-sm font-medium text-accent underline underline-offset-2">
          Đăng yêu cầu
        </Link>
      }
    />
  )
}
