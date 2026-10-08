"use client"

import * as React from "react"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, LocateFixed, MapPin } from "lucide-react"
import { ProCard, VerticalSwitch } from "@/components/beauty"
import { CategoryTiles } from "@/components/category-icon"
import { sortPros } from "@/components/trust"
import { Button, ButtonLink, Chip, EmptyState, PageSkeleton } from "@/components/ui"
import { IDENTITY_VERIFICATION_OPEN } from "@/lib/launch"
import { CATEGORIES, PRICE_LEVEL_NOTE, categoryLabel, isVertical, verticalOf } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import { DEFAULT_CATEGORY, PRIORITY_CATEGORIES, RADII_KM, isRadius, priorityFirst, withinRadius, type RadiusKm } from "@/lib/discovery"
import type { VerticalFilter } from "@/lib/feed"
import { CITIES } from "@/lib/geo"
import { useHere, type HereStatus } from "@/lib/here"
import { LEVELS, isLevel, levelName, type Level } from "@/lib/levels"
import { categoryLevel, distanceFrom, useApp } from "@/lib/store"
import { categoriesInTrade } from "@/lib/trade"
import { isVerified } from "@/lib/trust"
import type { CategoryId, CustomerAddress } from "@/lib/types"
import { cn } from "@/lib/utils"

type Sort = "match" | "rating" | "jobs" | "near"
type Focus = "nail" | "makeup" | "other"

const TITLE: Record<VerticalFilter, string> = {
  all: "Người làm",
  beauty: "Thợ làm đẹp",
  photo: "Người chụp & quay",
  model: "Người mẫu",
}

const SORT_LABEL: Record<Sort, string> = {
  match: "Phù hợp nhất",
  rating: "Đánh giá cao",
  jobs: "Nhiều lịch nhất",
  near: "Gần bạn nhất",
}

export function ProsPageView() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProsView />
    </Suspense>
  )
}

function ProsView() {
  const state = useApp()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const here = useHere()
  const { city, followedPros, session } = state

  // No category in the link opens on Nail, what most customers come for;
  // "?category=all" is an explicit choice of every category.
  const rawCategory = params.get("category")
  const rawTrade = params.get("nganh") ?? params.get("vertical")
  const trade = isVertical(rawTrade) ? rawTrade : null
  const category: CategoryId | null = CATEGORIES.some((c) => c.id === rawCategory)
    ? (rawCategory as CategoryId)
    : rawCategory !== "all" && (!trade || trade === "beauty")
      ? DEFAULT_CATEGORY
      : null
  // A category link carries its trade with it.
  const vertical: VerticalFilter = trade ?? (category ? verticalOf(category) : "all")
  const focus: Focus = category === "nail" || category === "makeup" ? category : "other"

  // Level and radius live in the URL, so coming back from a profile keeps them.
  const rawLevel = params.get("cap")
  const levelParam = rawLevel === null ? null : Number(rawLevel)
  // A level is a price picked in one category, so it filters only with one chosen.
  const level: Level | null = category && isLevel(levelParam) ? levelParam : null
  const rawRadius = Number(params.get("km"))
  const radius: RadiusKm | null = isRadius(rawRadius) ? rawRadius : null

  // Distance is the customer's: a partner browsing sees districts, as on the cards.
  const isPro = session?.role === "pro"
  const knowsWhere = !isPro && Boolean(here.point || state.customerAddress)
  const radiusOn = radius !== null && knowsWhere

  const [rawSort, setSort] = React.useState<Sort>("match")
  const sort: Sort = rawSort === "near" && !knowsWhere ? "match" : rawSort
  const [onlyFollowing, setOnlyFollowing] = React.useState(false)
  const [verifiedOnly, setVerifiedOnly] = React.useState(false)

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    next.delete("vertical")
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
  }
  const setFocus = (f: Focus) => setParams({ category: f === "other" ? "all" : f, nganh: null })
  // Within "Danh mục khác" a trade without the chosen category shows all of its categories.
  const setVertical = (v: VerticalFilter) =>
    setParams({ nganh: v === "all" ? null : v, category: category && (v === "all" || verticalOf(category) === v) ? category : "all" })

  const kmOf = (proId: string) => (isPro ? null : distanceFrom(state, proId, here.point))

  const filtered = state.pros.filter(
    (p) =>
      p.published &&
      (!city || p.city === city) &&
      (vertical === "all" || p.categories.some((c) => verticalOf(c) === vertical)) &&
      (!category || p.categories.includes(category)) &&
      (level === null || (category !== null && categoryLevel(state, p.id, category) === level)) &&
      (!radiusOn || withinRadius(kmOf(p.id), radius)) &&
      (!onlyFollowing || followedPros.includes(p.id)) &&
      (!verifiedOnly || isVerified(p)),
  )
  const pros =
    sort === "near"
      ? sortPros(state, filtered, "match").sort((a, b) => (kmOf(a.id) ?? Infinity) - (kmOf(b.id) ?? Infinity))
      : sortPros(state, filtered, sort)

  const newTrade = vertical === "photo" || vertical === "model" || (category !== null && verticalOf(category) !== "beauty")
  const narrowed = onlyFollowing || verifiedOnly || level !== null || radiusOn

  return (
    <div className="pt-4 md:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-[36px]">{TITLE[vertical]}</h1>
          {pros.length > 0 && (
            <p className="mt-1 text-[15px] text-ink-soft">
              {pros.length.toLocaleString("vi-VN")} người
              {category ? ` làm ${categoryLabel(category)}` : ""} {city ? `ở ${city}` : "trên toàn quốc"}
            </p>
          )}
        </div>
        <CityPicker value={city} />
      </div>

      {/* Nail and Makeup first, one tap apart; every other category one tap further. */}
      <div className="sticky top-0 z-30 -mx-4 mt-4 bg-canvas/95 px-4 py-2.5 backdrop-blur md:top-16 md:mx-0 md:px-0">
        <FocusSwitch value={focus} onChange={setFocus} />
      </div>

      {focus === "other" && (
        <>
          <VerticalSwitch className="mt-2" value={vertical} onChange={setVertical} />
          <CategoryTiles
            className="mt-4"
            items={[
              { id: "all", label: "Tất cả" },
              ...priorityFirst(categoriesInTrade(vertical))
                .filter((c) => !PRIORITY_CATEGORIES.includes(c.id))
                .map((c) => ({ id: c.id, label: c.short ?? c.label })),
            ]}
            value={category ?? "all"}
            onChange={(id) => setParams({ category: id })}
          />
        </>
      )}

      <div className="mt-4 space-y-3">
        {category && (
          <div>
            <FilterRow label="Cấp độ">
              <Choice active={level === null} onClick={() => setParams({ cap: null })}>
                Tất cả
              </Choice>
              {LEVELS.map((l) => (
                <Choice key={l} active={level === l} onClick={() => setParams({ cap: String(l) })}>
                  {levelName(l)}
                </Choice>
              ))}
            </FilterRow>
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{PRICE_LEVEL_NOTE}</p>
          </div>
        )}
        {!isPro && (
          <div>
            <FilterRow label="Khoảng cách">
              <Choice active={radius === null} onClick={() => setParams({ km: null })}>
                Tất cả
              </Choice>
              {RADII_KM.map((r) => (
                <Choice key={r} active={radius === r} onClick={() => setParams({ km: String(r) })}>
                  {r} km
                </Choice>
              ))}
            </FilterRow>
            <WhereFrom
              point={here.point !== null}
              address={state.customerAddress}
              status={here.status}
              radius={radius}
              onLocate={here.request}
              onClear={here.clear}
            />
          </div>
        )}
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <label className="relative inline-flex h-10 shrink-0 items-center gap-1 rounded-full border border-line bg-surface pl-4 pr-3 text-[13px] font-medium">
          <span className="sr-only">Sắp xếp</span>
          {SORT_LABEL[sort]}
          <ChevronDown className="size-4 text-muted" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="match">{SORT_LABEL.match}</option>
            <option value="rating">{SORT_LABEL.rating}</option>
            <option value="jobs">{SORT_LABEL.jobs}</option>
            {knowsWhere && <option value="near">{SORT_LABEL.near}</option>}
          </select>
        </label>
        {IDENTITY_VERIFICATION_OPEN && (
          <Chip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
            Đã xác minh
          </Chip>
        )}
        {session && (
          <Chip active={onlyFollowing} onClick={() => setOnlyFollowing((v) => !v)}>
            Đang theo dõi
          </Chip>
        )}
      </div>

      {sort === "match" && (
        <p className="mt-3 text-[13px] text-muted">
          Xếp theo đánh giá thật, số lịch đã làm và trạng thái xác minh danh tính. Không ai trả tiền để lên đầu.
        </p>
      )}

      {pros.length ? (
        <ul className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {pros.map((p) => (
            <li key={p.id}>
              <ProCard pro={p} category={category} className="h-full" />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={onlyFollowing ? "Bạn chưa theo dõi ai ở đây" : "Chưa có ai phù hợp"}
          text={
            narrowed
              ? "Bỏ bớt bộ lọc để xem thêm người."
              : newTrade
                ? "Ngành này vừa mở trên 360dep. Đăng yêu cầu để người làm quanh bạn thấy và nhận việc."
                : city
                  ? `Chưa có ai ở ${city} nhận việc này. Thử khu vực khác, hoặc đăng yêu cầu để người làm quanh bạn nhận việc.`
                  : "Thử đổi ngành hoặc danh mục."
          }
          action={narrowed ? undefined : <ButtonLink href="/requests/new">Đăng yêu cầu</ButtonLink>}
        />
      )}
    </div>
  )
}

function FocusSwitch({ value, onChange }: { value: Focus; onChange: (f: Focus) => void }) {
  const items: { id: Focus; label: string }[] = [
    { id: "nail", label: categoryLabel("nail") },
    { id: "makeup", label: categoryLabel("makeup") },
    { id: "other", label: "Danh mục khác" },
  ]
  return (
    <div role="radiogroup" aria-label="Danh mục" className="grid grid-cols-3 gap-1 rounded-full bg-subtle p-1 sm:inline-grid sm:min-w-[420px]">
      {items.map((it) => {
        const active = value === it.id
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(it.id)}
            className={cn(
              "inline-flex h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-full px-1 text-[clamp(12px,3.5vw,14px)] font-semibold tracking-[-0.01em] transition-colors sm:px-3 sm:tracking-normal",
              active ? "bg-accent text-white shadow-[var(--shadow-soft)]" : "text-ink hover:bg-subtle-strong",
            )}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  const id = React.useId()
  return (
    // The label sits above the choices on a phone, so all four fit in one row.
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span id={id} className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-ink sm:w-[88px]">
        {label}
      </span>
      {/* Scrolls on its own on a very narrow phone, so the page never does. */}
      <div
        role="radiogroup"
        aria-labelledby={id}
        className="no-scrollbar -mx-4 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {children}
      </div>
    </div>
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
        "relative inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        active ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:border-ink/30",
      )}
    >
      {children}
    </button>
  )
}

/**
 * Where distances are measured from, and how to change it. Without a location
 * or an address there is nothing to measure from, so a chosen radius asks for
 * one instead of quietly showing nobody.
 */
function WhereFrom({
  point,
  address,
  status,
  radius,
  onLocate,
  onClear,
}: {
  point: boolean
  address: CustomerAddress | null
  status: HereStatus
  radius: RadiusKm | null
  onLocate: () => void
  onClear: () => void
}) {
  const problem =
    status === "denied"
      ? "Trình duyệt chưa cho phép lấy vị trí. Bạn có thể bật lại trong cài đặt trình duyệt, hoặc chọn địa chỉ."
      : status === "unavailable"
        ? "Chưa lấy được vị trí lúc này. Thử lại, hoặc chọn địa chỉ."
        : null
  const locate = (
    <button
      type="button"
      onClick={onLocate}
      disabled={status === "asking"}
      className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ink underline-offset-4 hover:underline disabled:opacity-50"
    >
      <LocateFixed className="size-4" aria-hidden />
      {status === "asking" ? "Đang lấy vị trí…" : "Dùng vị trí hiện tại"}
    </button>
  )

  if (point)
    return (
      <div className="mt-1 text-[12.5px] leading-snug text-muted">
        <p>
          Tính từ vị trí hiện tại của bạn, tới quận của người làm. Vị trí chỉ lưu trên trình duyệt này, không gửi đi đâu.
        </p>
        <button type="button" onClick={onClear} className="min-h-11 font-semibold text-ink underline-offset-4 hover:underline">
          {address ? "Dùng địa chỉ đã lưu" : "Bỏ vị trí"}
        </button>
      </div>
    )

  if (address)
    return (
      <div className="mt-1 text-[12.5px] leading-snug text-muted">
        <p>
          Tính từ địa chỉ đã lưu ({address.district}, {address.city}), theo quận.
        </p>
        <div className="flex flex-wrap items-center gap-x-4">{locate}</div>
        {problem && <p className="text-warning">{problem}</p>}
      </div>
    )

  if (radius === null)
    return (
      <div className="mt-1 text-[12.5px] text-muted">
        {locate}
        {problem && <p className="text-warning">{problem}</p>}
      </div>
    )

  return (
    <div className="mt-2 rounded-[var(--radius-lg)] border border-line bg-surface p-3.5">
      <p className="flex items-start gap-2 text-[14px] font-semibold">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
        Bạn ở đâu? Chưa lọc theo khoảng cách vì chưa biết vị trí của bạn.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onLocate} disabled={status === "asking"}>
          <LocateFixed className="size-4" aria-hidden />
          {status === "asking" ? "Đang lấy vị trí…" : "Dùng vị trí hiện tại"}
        </Button>
        <ButtonLink href="/me/dia-chi" variant="outline" size="sm">
          Chọn địa chỉ
        </ButtonLink>
      </div>
      {problem && <p className="mt-2 text-[13px] text-warning">{problem}</p>}
      <p className="mt-2 text-[12.5px] text-muted">Vị trí chỉ dùng trên trình duyệt này để tính khoảng cách, không gửi đi đâu.</p>
    </div>
  )
}

function CityPicker({ value }: { value: string | null }) {
  return (
    <label className="relative inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface pl-4 pr-3 text-[14px] font-semibold">
      <MapPin className="size-4" />
      {value ?? "Toàn quốc"}
      <ChevronDown className="size-4 text-muted" />
      <select
        aria-label="Chọn khu vực"
        value={value ?? ""}
        onChange={(e) => void actions.setCity(e.target.value || null)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">Toàn quốc</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  )
}
