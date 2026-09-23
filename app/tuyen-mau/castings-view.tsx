"use client"

import * as React from "react"
import { CastingCard, SafetyNote } from "@/components/casting"
import { ButtonLink, Chip, PageHeader } from "@/components/ui"
import { CATEGORIES } from "@/lib/catalog"
import { useApp } from "@/lib/store"
import type { CategoryId } from "@/lib/types"

/**
 * "Tuyển mẫu": freelancers looking for models. Mostly beauty artists who need
 * hands or faces to practise on and photograph, paid in a free or discounted
 * service; sometimes photographers and shops, paid in money.
 */
export function CastingsView() {
  const state = useApp()
  const [category, setCategory] = React.useState<CategoryId | "all">("all")
  const open = state.castings.filter((c) => c.status === "open" && (!state.city || c.city === state.city))
  const categories = CATEGORIES.filter((c) => open.some((x) => x.category === c.id))
  const list = open
    .filter((c) => category === "all" || c.category === category)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const mine = state.castings.filter((c) => c.myApplication && c.myApplication.status !== "withdrawn")

  return (
    <div className="md:pt-6">
      <PageHeader title="Tuyển mẫu" />
      <p className="max-w-2xl text-[15px] text-ink-soft">
        Thợ làm đẹp và người chụp ảnh cần mẫu để luyện tay, chụp portfolio. Bạn được làm đẹp miễn phí, giảm giá hoặc có
        thù lao; họ có tác phẩm thật.
      </p>

      <SafetyNote className="mt-4" />

      {mine.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[20px] font-bold tracking-tight">Bạn đã ứng tuyển</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((c) => (
              <CastingCard key={c.id} casting={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-[20px] font-bold tracking-tight">Đang mở{state.city ? ` ở ${state.city}` : ""}</h2>
        {categories.length > 1 && (
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            <Chip active={category === "all"} onClick={() => setCategory("all")}>
              Tất cả
            </Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
        )}
        {list.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => (
              <CastingCard key={c.id} casting={c} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-line px-6 py-10 text-center">
            <p className="text-[17px] font-bold">Chưa có tin tuyển mẫu nào đang mở</p>
            {/* Posting a casting is partner work: only a partner is asked to. */}
            {state.session?.proId ? (
              <>
                <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-ink-soft">
                  Cần mẫu luyện tay hay chụp portfolio? Đăng tin, khách quanh bạn sẽ ứng tuyển.
                </p>
                <ButtonLink href="/studio/tuyen-mau" className="mt-5">
                  Đăng tin tuyển mẫu
                </ButtonLink>
              </>
            ) : (
              <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-ink-soft">Tin mới sẽ hiện ở đây. Quay lại sau nhé.</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
