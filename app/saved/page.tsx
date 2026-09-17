"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import { ProCard, WorkCard } from "@/components/beauty"
import { ButtonLink, EmptyState, PageHeader, Skeleton, Tabs } from "@/components/ui"
import { PROS, WORKS } from "@/lib/data"
import { useApp, useHydrated } from "@/lib/store"

export default function SavedPage() {
  const hydrated = useHydrated()
  const { savedWorks, followedPros } = useApp()
  const [tab, setTab] = React.useState<"works" | "pros">("works")
  const works = savedWorks.map((id) => WORKS.find((w) => w.id === id)).filter((w) => w !== undefined)
  const pros = PROS.filter((p) => followedPros.includes(p.id))

  return (
    <div className="md:pt-4">
      <PageHeader title="Đã lưu" />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "works", label: `Mẫu đã lưu (${hydrated ? works.length : "…"})` },
          { value: "pros", label: `Chuyên viên (${hydrated ? pros.length : "…"})` },
        ]}
      />
      {!hydrated ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : tab === "works" ? (
        works.length ? (
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
            {works.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart className="size-6" />}
            title="Chưa lưu mẫu nào"
            text="Nhấn biểu tượng trái tim trên tác phẩm để lưu lại mẫu bạn thích."
            action={<ButtonLink href="/">Khám phá mẫu</ButtonLink>}
          />
        )
      ) : pros.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {pros.map((p) => (
            <ProCard key={p.id} pro={p} />
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa theo dõi chuyên viên nào" action={<ButtonLink href="/pros">Tìm chuyên viên</ButtonLink>} />
      )}
    </div>
  )
}
