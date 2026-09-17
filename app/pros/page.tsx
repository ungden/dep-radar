"use client"

import * as React from "react"
import { ProCard } from "@/components/beauty"
import { Chip, EmptyState, PageHeader } from "@/components/ui"
import { CATEGORIES, CITIES, PROS } from "@/lib/data"
import { actions, useApp } from "@/lib/store"
import type { CategoryId } from "@/lib/types"

export default function ProsPage() {
  const { city, followedPros } = useApp()
  const [cat, setCat] = React.useState<CategoryId | "all">("all")
  const [onlyFollowing, setOnlyFollowing] = React.useState(false)

  const pros = PROS.filter(
    (p) =>
      (!city || p.city === city) &&
      (cat === "all" || p.categories.includes(cat)) &&
      (!onlyFollowing || followedPros.includes(p.id)),
  ).sort((a, b) => b.rating - a.rating)

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
        <Chip active={onlyFollowing} onClick={() => setOnlyFollowing((v) => !v)}>
          Đang theo dõi
        </Chip>
        <Chip active={cat === "all"} onClick={() => setCat("all")}>
          Tất cả
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>
      {pros.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {pros.map((p) => (
            <ProCard key={p.id} pro={p} />
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có chuyên viên phù hợp" text="Thử đổi khu vực hoặc danh mục." />
      )}
    </div>
  )
}
