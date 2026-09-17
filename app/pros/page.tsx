"use client"

import * as React from "react"
import { Info } from "lucide-react"
import { ProCard } from "@/components/beauty"
import { sortPros } from "@/components/trust"
import { Chip, EmptyState, PageHeader } from "@/components/ui"
import { CATEGORIES, CITIES, PROS } from "@/lib/data"
import { actions, useApp } from "@/lib/store"
import { isVerified, tierOf } from "@/lib/trust"
import type { CategoryId } from "@/lib/types"
import { cn } from "@/lib/utils"

type Sort = "match" | "rating" | "jobs"

export default function ProsPage() {
  const state = useApp()
  const { city, followedPros } = state
  const [cat, setCat] = React.useState<CategoryId | "all">("all")
  const [sort, setSort] = React.useState<Sort>("match")
  const [onlyFollowing, setOnlyFollowing] = React.useState(false)
  const [verifiedOnly, setVerifiedOnly] = React.useState(false)
  const [proOnly, setProOnly] = React.useState(false)

  const pros = sortPros(
    state,
    PROS.filter(
      (p) =>
        (!city || p.city === city) &&
        (cat === "all" || p.categories.includes(cat)) &&
        (!onlyFollowing || followedPros.includes(p.id)),
    ),
    sort,
  ).filter((p) => (!verifiedOnly || (isVerified(p, "identity") && isVerified(p, "skill"))) && (!proOnly || ["pro", "top"].includes(tierOf(p))))

  return (
    <div className="md:pt-4">
      <PageHeader
        title="Chuyên viên"
        action={
          <select
            aria-label="Khu vực"
            value={city ?? ""}
            onChange={(e) => actions.setCity(e.target.value || null)}
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
          Đã xác minh tay nghề
        </Chip>
        <Chip active={proOnly} onClick={() => setProOnly((v) => !v)}>
          Hạng Pro & Top
        </Chip>
        <Chip active={onlyFollowing} onClick={() => setOnlyFollowing((v) => !v)}>
          Đang theo dõi
        </Chip>
      </div>

      {sort === "match" && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Xếp hạng theo điểm đánh giá có trọng số, tỉ lệ huỷ, đúng giờ, phản hồi, khách quay lại và mức xác minh. Không nhận trả phí để lên top.
        </p>
      )}

      {pros.length ? (
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {pros.map((p, i) => (
            <li key={p.id} className="relative">
              {sort === "match" && cat !== "all" && i < 3 && (
                <span
                  className={cn(
                    "absolute -left-1.5 -top-1.5 z-10 flex size-6 items-center justify-center rounded-full text-xs font-bold text-white shadow",
                    i === 0 ? "bg-[#d4a13a]" : i === 1 ? "bg-[#9aa3ad]" : "bg-[#b77b4f]",
                  )}
                >
                  {i + 1}
                </span>
              )}
              <ProCard pro={p} />
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="Chưa có chuyên viên phù hợp" text="Thử đổi khu vực, danh mục hoặc bỏ bớt bộ lọc." />
      )}
    </div>
  )
}
