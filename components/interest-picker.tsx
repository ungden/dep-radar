"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui"
import { CATEGORIES, VERTICALS } from "@/lib/catalog"
import { actions, useAct } from "@/lib/client-actions"
import type { CategoryId } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * The first real signal "Dành cho bạn" gets: asked once, after sign-in, before
 * the person has booked or saved anything. Until then the feed says plainly
 * that it is sorted by distance and rating, not personalised.
 */
export function InterestPicker({ className }: { className?: string }) {
  const act = useAct()
  const [picked, setPicked] = React.useState<CategoryId[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const toggle = (id: CategoryId) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 6 ? p : [...p, id]))

  return (
    <section className={cn("rounded-[var(--radius-xl)] border border-line bg-surface p-5 md:p-6", className)}>
      <h2 className="text-[20px] font-extrabold tracking-tight">Bạn quan tâm gì?</h2>
      <p className="mt-1 text-[15px] text-ink-soft">Chọn vài thứ, trang chủ sẽ ưu tiên những gì bạn chọn. Đổi lại lúc nào cũng được.</p>
      <div className="mt-4 space-y-4">
        {VERTICALS.map((v) => (
          <div key={v.id}>
            <p className="mb-2 text-[13px] font-semibold text-muted">{v.label}</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c.vertical === v.id).map((c) => {
                const on = picked.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(c.id)}
                    className={cn(
                      "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium transition-colors",
                      on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink/30",
                    )}
                  >
                    {on && <Check className="size-4" />}
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-[14px] text-danger">{error}</p>}
      <Button
        className="mt-5"
        disabled={!picked.length || busy}
        onClick={async () => {
          setBusy(true)
          setError(await act(() => actions.setInterests(picked), "Đã lưu sở thích"))
          setBusy(false)
        }}
      >
        Lưu {picked.length ? `${picked.length} mục` : ""}
      </Button>
    </section>
  )
}
