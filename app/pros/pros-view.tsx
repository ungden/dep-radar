"use client"

import * as React from "react"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, MapPin } from "lucide-react"
import { ProCard, VerticalSwitch } from "@/components/beauty"
import { CategoryTiles } from "@/components/category-icon"
import { sortPros } from "@/components/trust"
import { ButtonLink, Chip, EmptyState, PageSkeleton } from "@/components/ui"
import { CATEGORIES, isVertical, verticalOf } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import type { VerticalFilter } from "@/lib/feed"
import { CITIES } from "@/lib/geo"
import { useApp } from "@/lib/store"
import { categoriesInTrade } from "@/lib/trade"
import { isVerified } from "@/lib/trust"
import type { CategoryId } from "@/lib/types"

type Sort = "match" | "rating" | "jobs"

const TITLE: Record<VerticalFilter, string> = {
  all: "Người làm",
  beauty: "Thợ làm đẹp",
  photo: "Người chụp & quay",
  model: "Người mẫu",
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
  const { city, followedPros, session } = state

  const rawCategory = params.get("category")
  const category = CATEGORIES.some((c) => c.id === rawCategory) ? (rawCategory as CategoryId) : null
  const rawTrade = params.get("nganh") ?? params.get("vertical")
  // A category link carries its trade with it.
  const vertical: VerticalFilter = isVertical(rawTrade) ? rawTrade : category ? verticalOf(category) : "all"

  const [sort, setSort] = React.useState<Sort>("match")
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
  const setVertical = (v: VerticalFilter) =>
    setParams({ nganh: v === "all" ? null : v, category: category && (v === "all" || verticalOf(category) === v) ? category : null })

  const pros = sortPros(
    state,
    state.pros.filter(
      (p) =>
        p.published &&
        (!city || p.city === city) &&
        (vertical === "all" || p.categories.some((c) => verticalOf(c) === vertical)) &&
        (!category || p.categories.includes(category)) &&
        (!onlyFollowing || followedPros.includes(p.id)) &&
        (!verifiedOnly || isVerified(p)),
    ),
    sort,
  )

  const newTrade = vertical === "photo" || vertical === "model" || (category !== null && verticalOf(category) !== "beauty")

  return (
    <div className="pt-4 md:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-[36px]">{TITLE[vertical]}</h1>
          {pros.length > 0 && (
            <p className="mt-1 text-[15px] text-ink-soft">
              {pros.length.toLocaleString("vi-VN")} người {city ? `ở ${city}` : "trên toàn quốc"}
            </p>
          )}
        </div>
        <CityPicker value={city} />
      </div>

      <div className="sticky top-0 z-30 -mx-4 mt-4 bg-canvas/95 px-4 py-2.5 backdrop-blur md:top-16 md:mx-0 md:px-0">
        <VerticalSwitch value={vertical} onChange={setVertical} />
      </div>

      <CategoryTiles
        className="mt-3"
        items={[{ id: "all", label: "Tất cả" }, ...categoriesInTrade(vertical).map((c) => ({ id: c.id, label: c.short ?? c.label }))]}
        value={category ?? "all"}
        onChange={(id) => setParams({ category: id === "all" ? null : id })}
      />

      <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <label className="relative inline-flex h-10 shrink-0 items-center gap-1 rounded-full border border-line bg-surface pl-4 pr-3 text-[13px] font-medium">
          <span className="sr-only">Sắp xếp</span>
          {sort === "match" ? "Phù hợp nhất" : sort === "rating" ? "Đánh giá cao" : "Nhiều lịch nhất"}
          <ChevronDown className="size-4 text-muted" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="match">Phù hợp nhất</option>
            <option value="rating">Đánh giá cao</option>
            <option value="jobs">Nhiều lịch nhất</option>
          </select>
        </label>
        <Chip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
          Đã xác minh
        </Chip>
        {session && (
          <Chip active={onlyFollowing} onClick={() => setOnlyFollowing((v) => !v)}>
            Đang theo dõi
          </Chip>
        )}
      </div>

      {sort === "match" && (
        <p className="mt-3 text-[13px] text-muted">
          Người đã xác minh danh tính được ưu tiên, sau đó theo đánh giá thật và số lịch đã làm. Không ai trả tiền để lên đầu.
        </p>
      )}

      {pros.length ? (
        <ul className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {pros.map((p) => (
            <li key={p.id}>
              <ProCard pro={p} className="h-full" />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={onlyFollowing ? "Bạn chưa theo dõi ai ở đây" : "Chưa có ai phù hợp"}
          text={
            onlyFollowing || verifiedOnly
              ? "Bỏ bớt bộ lọc để xem thêm người."
              : newTrade
                ? "Ngành này vừa mở trên 360dep. Đăng yêu cầu để người làm quanh bạn thấy và nhận việc."
                : city
                  ? `Chưa có ai ở ${city} nhận việc này. Thử khu vực khác, hoặc đăng yêu cầu để người làm quanh bạn nhận việc.`
                  : "Thử đổi ngành hoặc danh mục."
          }
          action={
            onlyFollowing || verifiedOnly ? undefined : <ButtonLink href="/requests/new">Đăng yêu cầu</ButtonLink>
          }
        />
      )}
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
