"use client"

import * as React from "react"
import { Info } from "lucide-react"
import { ProCard } from "@/components/beauty"
import { sortPros } from "@/components/trust"
import { Chip, EmptyState, PageHeader } from "@/components/ui"
import { CATEGORIES } from "@/lib/catalog"
import { CITIES } from "@/lib/geo"
import { actions } from "@/lib/client-actions"
import { useApp } from "@/lib/store"
import { isVerified } from "@/lib/trust"
import type { CategoryId } from "@/lib/types"

type Sort = "match" | "rating" | "jobs"

export default function ProsPage() {
  const state = useApp()
  const { city, followedPros } = state
  const [cat, setCat] = React.useState<CategoryId | "all">("all")
  const [sort, setSort] = React.useState<Sort>("match")
  const [onlyFollowing, setOnlyFollowing] = React.useState(false)
  const [verifiedOnly, setVerifiedOnly] = React.useState(false)

  const pros = sortPros(
    state,
    state.pros.filter(
      (p) =>
        (!city || p.city === city) &&
        (cat === "all" || p.categories.includes(cat)) &&
        (!onlyFollowing || followedPros.includes(p.id)),
    ),
    sort,
  ).filter((p) => !verifiedOnly || isVerified(p))

  return (
    <div className="md:pt-4">
      <PageHeader
        title="Chuyên viên"
        action={
          <select
            aria-label="Khu vực"
            value={city ?? ""}
            onChange={(e) => void actions.setCity(e.target.value || null)}
            className="h-9 rounded-full border border-line bg-surface px-3 text-[13px] focus:border-rose focus:outline-none"
          >
            <option value="">Toàn quốc</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        }
      />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>
          Tất cả
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <select
          aria-label="Sắp xếp"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="h-9 shrink-0 rounded-full border border-line bg-surface px-3 text-[13px] focus:border-rose focus:outline-none"
        >
          <option value="match">Phù hợp nhất</option>
          <option value="rating">Đánh giá cao</option>
          <option value="jobs">Nhiều job nhất</option>
        </select>
        <Chip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
          Đã xác minh
        </Chip>
        <Chip active={onlyFollowing} onClick={() => setOnlyFollowing((v) => !v)}>
          Đang theo dõi
        </Chip>
      </div>

      {sort === "match" && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Chuyên viên đã xác minh danh tính được ưu tiên hiển thị, sau đó theo đánh giá và kinh nghiệm. Không nhận trả phí để lên top.
        </p>
      )}

      {pros.length ? (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {pros.map((p) => (
            <li key={p.id}>
              <ProCard pro={p} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Chưa có chuyên viên phù hợp" text="Thử đổi khu vực, danh mục hoặc bỏ bớt bộ lọc." />
      )}
    </div>
  )
}
