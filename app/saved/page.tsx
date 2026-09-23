"use client"

import * as React from "react"
import Image from "next/image"
import { PostCard, ProCard } from "@/components/beauty"
import { ButtonLink, Tabs } from "@/components/ui"
import { useApp } from "@/lib/store"

export default function SavedPage() {
  const state = useApp()
  const { savedWorks, followedPros, session } = state
  const [tab, setTab] = React.useState<"works" | "pros">("works")
  const works = savedWorks.map((id) => state.works.find((w) => w.id === id)).filter((w) => w !== undefined)
  const pros = state.pros.filter((p) => followedPros.includes(p.id))
  // Real work from the feed, so the empty page shows what saving is for.
  const samples = state.works
    .filter((w) => w.images[0] && (!state.city || state.pros.find((p) => p.id === w.proId)?.city === state.city))
    .slice(0, 3)
    .map((w) => w.images[0])

  return (
    <div className="pt-4 md:pt-10">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-[36px]">Đã lưu</h1>
      <Tabs
        className="mt-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: "works", label: `Mẫu đã lưu${works.length ? ` (${works.length})` : ""}` },
          { value: "pros", label: `Đang theo dõi${pros.length ? ` (${pros.length})` : ""}` },
        ]}
      />

      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "works" ? (
          works.length ? (
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
              {works.map((w, i) => (
                <PostCard key={w.id} work={w} priority={i < 4} />
              ))}
            </div>
          ) : (
            <Empty
              photos={samples}
              title={session ? "Chưa lưu mẫu nào" : "Lưu mẫu bạn thích"}
              text="Nhấn trái tim trên một tác phẩm để lưu lại, so sánh giá và đặt lịch sau."
              action={
                session ? (
                  <ButtonLink href="/">Khám phá tác phẩm</ButtonLink>
                ) : (
                  <ButtonLink href="/login?next=%2Fsaved">Đăng nhập để lưu</ButtonLink>
                )
              }
            />
          )
        ) : pros.length ? (
          <ul className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {pros.map((p) => (
              <li key={p.id}>
                <ProCard pro={p} className="h-full" />
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            title="Bạn chưa theo dõi ai"
            text="Theo dõi để thấy tác phẩm mới của họ ở trang chủ, đúng thứ tự đăng."
            action={
              session ? (
                <ButtonLink href="/pros">Tìm người làm</ButtonLink>
              ) : (
                <ButtonLink href="/login?next=%2Fsaved">Đăng nhập để theo dõi</ButtonLink>
              )
            }
          />
        )}
      </div>
    </div>
  )
}

function Empty({ photos = [], title, text, action }: { photos?: string[]; title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center md:py-16">
      {photos.length > 0 && (
        <div className="mb-6 flex items-end" aria-hidden>
          {photos.map((src, i) => (
            <span
              key={src + i}
              className="relative -mx-2 aspect-[4/5] w-24 overflow-hidden rounded-[var(--radius-md)] bg-subtle ring-4 ring-canvas first:-rotate-6 last:rotate-6 md:w-28"
              style={{ zIndex: i === 1 ? 2 : 1 }}
            >
              <Image src={src} alt="" fill sizes="112px" className="object-cover" />
            </span>
          ))}
        </div>
      )}
      <p className="text-[20px] font-bold tracking-tight">{title}</p>
      <p className="mt-1.5 max-w-sm text-[15px] text-ink-soft">{text}</p>
      <div className="mt-6">{action}</div>
    </div>
  )
}
