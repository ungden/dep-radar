"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Search, SlidersHorizontal, X } from "lucide-react"
import { PostCard, ProCard, VerticalSwitch } from "@/components/beauty"
import { CategoryTiles } from "@/components/category-icon"
import { ServiceCard } from "@/components/service-card"
import { Sheet } from "@/components/sheet"
import { sortPros } from "@/components/trust"
import { Button, ButtonLink, Chip, PageSkeleton, Tabs, Toggle } from "@/components/ui"
import { CATEGORIES, categoryLabel, getTemplate, getVertical, isVertical, verticalOf } from "@/lib/catalog"
import { interestsFrom, rankFeed, type VerticalFilter } from "@/lib/feed"
import { CITIES } from "@/lib/geo"
import { serviceOffers } from "@/lib/offers"
import { categoryTerms, matchesQuery } from "@/lib/search"
import { distanceToCustomer, fromPrice, proView, servicesOf, useApp, type AppState } from "@/lib/store"
import { categoriesInTrade } from "@/lib/trade"
import { isVerified } from "@/lib/trust"
import type { CategoryId, Pro, Work } from "@/lib/types"
import { cn } from "@/lib/utils"

const PRICE_OPTIONS = [
  { value: "", label: "Mọi mức giá" },
  { value: "300000", label: "Dưới 300.000đ" },
  { value: "500000", label: "Dưới 500.000đ" },
  { value: "1000000", label: "Dưới 1 triệu" },
]

type Sort = "match" | "price" | "near"
type Mode = "services" | "works" | "pros"

export function SearchPageView() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchView />
    </Suspense>
  )
}

/** Everything a pro is found by: who they are, where, and every service they list. */
function proText(state: AppState, pro: Pro) {
  const services = servicesOf(state, pro.id)
    .map((s) => getTemplate(s.templateId)?.name ?? "")
    .join(" ")
  return [pro.name, pro.title, pro.bio, pro.district, pro.city, pro.equipment ?? "", ...pro.categories.map(categoryTerms), services].join(" ")
}

function SearchView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const state = useApp()
  const query = params.get("q") ?? ""
  const [q, setQ] = React.useState(query)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  // Rendered on the server and in the browser: fixing "now" once keeps both in step.
  const [now] = React.useState(() => new Date())

  const rawCategory = params.get("category")
  const category = CATEGORIES.some((c) => c.id === rawCategory) ? (rawCategory as CategoryId) : null
  // "?vertical=" is what older links and the home suggestions use; "?nganh=" is the home page's.
  const rawTrade = params.get("nganh") ?? params.get("vertical")
  const vertical: VerticalFilter = isVertical(rawTrade) ? rawTrade : category ? verticalOf(category) : "all"
  // "all" is an explicit choice of the whole country, over the city being browsed.
  const cityParam = params.get("city")
  const city = cityParam === "all" ? "" : (cityParam ?? state.city ?? "")
  const maxPrice = Number(params.get("price") ?? 0)
  const verifiedOnly = params.get("verified") === "1"
  const openOnly = params.get("open") === "1"
  const comesToYou = params.get("home") === "1"
  const hasAddress = Boolean(state.customerAddress)
  const rawSort = (params.get("sort") as Sort | null) ?? "match"
  // Distance only means something once we know where the customer is.
  const sort: Sort = rawSort === "near" && !hasAddress ? "match" : rawSort
  const rawTab = params.get("tab")
  const mode: Mode = rawTab === "pros" || rawTab === "works" ? rawTab : "services"

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    next.delete("vertical")
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
  }
  const setVertical = (v: VerticalFilter) =>
    setParams({ nganh: v === "all" ? null : v, category: category && (v === "all" || verticalOf(category) === v) ? category : null })

  const proOk = React.useCallback(
    (pro: Pro) =>
      pro.published &&
      (!city || pro.city === city) &&
      (!verifiedOnly || isVerified(pro)) &&
      (!openOnly || pro.acceptingJobs) &&
      (!comesToYou || pro.homeService),
    [city, verifiedOnly, openOnly, comesToYou],
  )

  // What is for sale, as on the home page: a service somebody in scope lists,
  // matched on the service itself -- its name, description and category.
  const services = React.useMemo(() => {
    const pros = state.pros.filter(proOk)
    const list = serviceOffers({ pros, proServices: state.proServices, works: state.works, city: city || null, vertical }).filter(
      (o) =>
        (!category || o.template.category === category) &&
        (!comesToYou || !o.template.studioOnly) &&
        (!maxPrice || o.fromPrice <= maxPrice) &&
        matchesQuery(`${o.template.name} ${o.template.description} ${categoryLabel(o.template.category)}`, query),
    )
    return sort === "price" ? [...list].sort((a, b) => a.fromPrice - b.fromPrice) : list
  }, [state.pros, state.proServices, state.works, proOk, city, vertical, category, comesToYou, maxPrice, query, sort])

  const works = React.useMemo(() => {
    const list = state.works.filter((w) => {
      const pro = proView(state, w.proId)
      if (!pro || !proOk(pro)) return false
      if (vertical !== "all" && verticalOf(w.category) !== vertical) return false
      if (category && w.category !== category) return false
      const tpl = getTemplate(w.templateId)
      if (comesToYou && tpl?.studioOnly) return false
      const price = fromPrice(state, w.proId, w.templateId)
      if (maxPrice && (price === null || price > maxPrice)) return false
      // The work itself, not the person: "nail" should not return a makeup
      // photo because its author also does nails.
      return matchesQuery(`${w.title} ${w.description} ${tpl?.name ?? ""} ${categoryLabel(w.category)}`, query)
    })
    if (sort === "price")
      return [...list].sort(
        (a, b) => (fromPrice(state, a.proId, a.templateId) ?? Infinity) - (fromPrice(state, b.proId, b.templateId) ?? Infinity),
      )
    if (sort === "near")
      return [...list].sort((a, b) => (distanceToCustomer(state, a.proId) ?? Infinity) - (distanceToCustomer(state, b.proId) ?? Infinity))
    // "Phù hợp nhất" is the same ranking as the home feed.
    return rankFeed(
      list,
      state.pros,
      {
        vertical,
        interests: interestsFrom({ chosen: state.interests, booked: [], saved: [] }),
        followed: new Set(state.followedPros),
        distanceKm: (proId) => (state.session?.role === "pro" ? null : distanceToCustomer(state, proId)),
        stats: state.workStats,
        now,
      },
      "for-you",
    )
  }, [state, proOk, vertical, category, comesToYou, maxPrice, query, sort, now])

  const pros = React.useMemo(() => {
    const list = state.pros.filter((p) => {
      if (!proOk(p)) return false
      if (vertical !== "all" && !p.categories.some((c) => verticalOf(c) === vertical)) return false
      if (category && !p.categories.includes(category)) return false
      const price = fromPrice(state, p.id)
      if (maxPrice && (price === null || price > maxPrice)) return false
      return matchesQuery(proText(state, p), query)
    })
    if (sort === "near")
      return [...list].sort((a, b) => (distanceToCustomer(state, a.id) ?? Infinity) - (distanceToCustomer(state, b.id) ?? Infinity))
    if (sort === "price") return [...list].sort((a, b) => (fromPrice(state, a.id) ?? Infinity) - (fromPrice(state, b.id) ?? Infinity))
    return sortPros(state, list, "match")
  }, [state, proOk, vertical, category, maxPrice, query, sort])

  const active = [cityParam !== null && city !== (state.city ?? ""), maxPrice, verifiedOnly, openOnly, comesToYou, sort !== "match"].filter(
    Boolean,
  ).length
  const resultCount = mode === "services" ? services.length : mode === "works" ? works.length : pros.length
  const clearFilters = () => setParams({ city: null, price: null, verified: null, open: null, home: null, sort: null })

  const filters = (
    <Filters
      city={city}
      maxPrice={maxPrice}
      verifiedOnly={verifiedOnly}
      openOnly={openOnly}
      comesToYou={comesToYou}
      sort={sort}
      hasAddress={hasAddress}
      vertical={vertical}
      onChange={setParams}
      onClear={active ? clearFilters : undefined}
    />
  )

  return (
    <div className="pt-2 md:pt-8">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Quay lại"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          className="-ml-3 inline-flex size-11 shrink-0 items-center justify-center md:hidden"
        >
          <ChevronLeft className="size-6" />
        </button>
        <form
          role="search"
          className="relative flex-1 md:max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault()
            setParams({ q: q.trim() || null })
          }}
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            enterKeyHint="search"
            aria-label="Tìm kiếm"
            placeholder="Nail, makeup, chụp ảnh, thuê mẫu…"
            className="h-13 w-full rounded-full border border-line-strong bg-surface pl-12 pr-12 text-[16px] shadow-[var(--shadow-soft)] placeholder:text-muted focus:border-accent focus:outline-none md:h-14 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              aria-label="Xoá từ khoá"
              onClick={() => {
                setQ("")
                setParams({ q: null })
              }}
              className="absolute right-1.5 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink"
            >
              <X className="size-5" />
            </button>
          )}
        </form>
      </div>

      <div className="sticky top-0 z-30 -mx-4 mt-3 bg-canvas/95 px-4 py-2.5 backdrop-blur md:top-16 md:mx-0 md:mt-5 md:px-0">
        <VerticalSwitch value={vertical} onChange={setVertical} />
      </div>
      {/* With a query the results matter more than the categories: one row. */}
      <CategoryTiles
        className="mt-3"
        row={Boolean(query)}
        items={[{ id: "all", label: "Tất cả" }, ...categoriesInTrade(vertical).map((c) => ({ id: c.id, label: c.label }))]}
        value={category ?? "all"}
        onChange={(id) => setParams({ category: id === "all" ? null : id })}
      />
      <div className="mt-4 lg:hidden">
        <Chip active={active > 0} onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="size-3.5" /> Bộ lọc{active ? ` · ${active}` : ""}
        </Chip>
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block" aria-label="Bộ lọc">
          <div className="sticky top-36">{filters}</div>
        </aside>

        <div>
          <Tabs
            value={mode}
            onChange={(m) => setParams({ tab: m === "services" ? null : m })}
            items={[
              { value: "services", label: `Dịch vụ (${services.length})` },
              { value: "works", label: `Tác phẩm (${works.length})` },
              { value: "pros", label: `Người làm (${pros.length})` },
            ]}
          />
          {query && (
            <p className="mt-3 text-[14px] text-ink-soft">
              {resultCount ? `${resultCount} kết quả cho “${query}”` : `Không có kết quả cho “${query}”`}
            </p>
          )}

          {mode === "services" ? (
            services.length ? (
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-5">
                {services.map((o, i) => (
                  <ServiceCard key={o.template.id} offer={o} priority={i < 4} />
                ))}
              </div>
            ) : (
              <NoResults vertical={vertical} filtered={active > 0} onClear={clearFilters} />
            )
          ) : mode === "works" ? (
            works.length ? (
              <WorkResults works={works} />
            ) : (
              <NoResults vertical={vertical} filtered={active > 0} onClear={clearFilters} />
            )
          ) : pros.length ? (
            <ul className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4">
              {pros.map((p) => (
                <li key={p.id}>
                  <ProCard pro={p} className="h-full" />
                </li>
              ))}
            </ul>
          ) : (
            <NoResults vertical={vertical} filtered={active > 0} onClear={clearFilters} />
          )}
        </div>
      </div>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Bộ lọc"
        className="lg:hidden"
        footer={
          <Button size="lg" className="w-full" onClick={() => setFiltersOpen(false)}>
            {resultCount ? `Xem ${resultCount} kết quả` : "Không có kết quả"}
          </Button>
        }
      >
        {filters}
      </Sheet>
    </div>
  )
}

const PAGE = 24

function WorkResults({ works }: { works: Work[] }) {
  const [limit, setLimit] = React.useState(PAGE)
  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5">
        {works.slice(0, limit).map((w, i) => (
          <PostCard key={w.id} work={w} priority={i < 4} />
        ))}
      </div>
      {works.length > limit && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => setLimit((n) => n + PAGE)}>
            Xem thêm
          </Button>
        </div>
      )}
    </>
  )
}

function Filters({
  city,
  maxPrice,
  verifiedOnly,
  openOnly,
  comesToYou,
  sort,
  hasAddress,
  vertical,
  onChange,
  onClear,
}: {
  city: string
  maxPrice: number
  verifiedOnly: boolean
  openOnly: boolean
  comesToYou: boolean
  sort: Sort
  hasAddress: boolean
  vertical: VerticalFilter
  onChange: (patch: Record<string, string | null>) => void
  onClear?: () => void
}) {
  // "Tại nhà" is the beauty word; for photo and models it is wherever the customer picks.
  const comesLabel =
    vertical === "beauty" ? "Làm tại nhà bạn" : vertical === "all" ? "Đến tận nơi" : "Đến địa điểm bạn chọn"
  return (
    <div className="space-y-7">
      <FilterGroup title="Khu vực">
        <select
          aria-label="Khu vực"
          value={city}
          onChange={(e) => onChange({ city: e.target.value || "all" })}
          className="h-11 w-full rounded-full border border-line-strong bg-surface px-4 text-[15px] focus:border-accent focus:outline-none"
        >
          <option value="">Toàn quốc</option>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup title="Giá từ">
        <div role="radiogroup" aria-label="Giá" className="flex flex-wrap gap-2">
          {PRICE_OPTIONS.map((p) => (
            <Choice key={p.value} active={String(maxPrice || "") === p.value} onClick={() => onChange({ price: p.value || null })}>
              {p.label}
            </Choice>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Chỉ hiện">
        <div className="divide-y divide-line">
          <ToggleRow label="Đã xác minh danh tính" checked={verifiedOnly} onChange={(v) => onChange({ verified: v ? "1" : null })} />
          {/* "Đang nhận lịch", not "rảnh hôm nay": it is a fact on the profile;
              free time depends on the service and the day. */}
          <ToggleRow label="Đang nhận lịch" checked={openOnly} onChange={(v) => onChange({ open: v ? "1" : null })} />
          <ToggleRow
            label={comesLabel}
            hint={vertical === "all" ? "Tại nhà bạn hoặc địa điểm bạn chọn" : undefined}
            checked={comesToYou}
            onChange={(v) => onChange({ home: v ? "1" : null })}
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Sắp xếp">
        <div role="radiogroup" aria-label="Sắp xếp" className="flex flex-wrap gap-2">
          <Choice active={sort === "match"} onClick={() => onChange({ sort: null })}>
            Phù hợp nhất
          </Choice>
          <Choice active={sort === "price"} onClick={() => onChange({ sort: "price" })}>
            Giá thấp trước
          </Choice>
          {hasAddress && (
            <Choice active={sort === "near"} onClick={() => onChange({ sort: "near" })}>
              Gần bạn nhất
            </Choice>
          )}
        </div>
        {!hasAddress && (
          <p className="mt-2 text-[13px] text-muted">
            <Link href="/me/dia-chi" className="font-semibold text-ink underline underline-offset-2">
              Thêm địa chỉ
            </Link>{" "}
            để xếp theo khoảng cách.
          </p>
        )}
      </FilterGroup>

      {onClear && (
        <button type="button" onClick={onClear} className="min-h-11 text-[14px] font-semibold underline underline-offset-4">
          Xoá bộ lọc
        </button>
      )}
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-[15px] font-bold">{title}</legend>
      {children}
    </fieldset>
  )
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        active ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:border-ink/30",
      )}
    >
      {children}
    </button>
  )
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-h-13 items-center justify-between gap-3 py-2">
      <span>
        <span className="block text-[15px]">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

function NoResults({ vertical, filtered, onClear }: { vertical: VerticalFilter; filtered: boolean; onClear: () => void }) {
  const trade = vertical === "all" ? null : getVertical(vertical)
  return (
    <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-line px-6 py-12 text-center">
      <p className="text-[17px] font-bold">Chưa thấy kết quả phù hợp</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-ink-soft">
        {filtered
          ? "Thử bỏ bớt bộ lọc hoặc đổi từ khoá."
          : trade && trade.id !== "beauty"
            ? `${trade.label} vừa mở trên 360dep, người làm còn ít. Đăng yêu cầu để ai phù hợp liên hệ bạn.`
            : "Đăng yêu cầu, người làm gần bạn sẽ gửi báo giá."}
      </p>
      <div className="mt-5 flex justify-center">
        {filtered ? (
          <Button onClick={onClear}>Xoá bộ lọc</Button>
        ) : (
          <ButtonLink href="/requests/new">Đăng yêu cầu</ButtonLink>
        )}
      </div>
    </div>
  )
}
