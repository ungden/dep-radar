"use client"

import Link from "next/link"
import { ArrowRight, Check, RotateCcw } from "lucide-react"
import * as React from "react"

import { buildCatalogueHref, catalogueLenses, catalogueSections } from "@/lib/catalogue"
import { trackEvent } from "@/lib/analytics"

type FinderState = {
  hub?: string
  condition?: string
  skin?: string
  audience?: string
  budget?: string
}

export function CatalogueFinder({ compact = false }: { compact?: boolean }) {
  const [selection, setSelection] = React.useState<FinderState>({})
  const selectedHub = catalogueSections.find((section) => section.slug === selection.hub)
  const resultHref = selectedHub ? buildCatalogueHref(selectedHub.slug, selection) : "/catalogue"

  function choose(key: keyof FinderState, value: string) {
    const firstChoice = !selection.hub && key === "hub"
    setSelection((current) => key === "hub"
      ? { hub: value }
      : { ...current, [key]: current[key] === value ? undefined : value })
    if (firstChoice) trackEvent("finder_start", { hub: value })
    if (key === "hub") trackEvent("catalogue_selection", { hub: value, source: compact ? "homepage" : "catalogue" })
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">Tìm theo tình trạng / mong muốn</div>
          <h2 className="mt-2 font-display text-xl font-black text-slate-950 dark:text-white md:text-2xl">Bắt đầu từ điều bạn muốn giải quyết</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Không cần hoàn thành hết. Chọn đến đâu, mở catalogue phù hợp đến đó.</p>
        </div>
        {selection.hub && (
          <button
            type="button"
            onClick={() => setSelection({})}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Làm lại</span>
          </button>
        )}
      </div>

      <FinderStep number={1} title="Mục tiêu chính">
        {catalogueSections
          .filter((section) => !compact || (section.entryPriority ?? 99) <= 8)
          .map((section) => (
            <Choice key={section.slug} active={selection.hub === section.slug} onClick={() => choose("hub", section.slug)}>
              {section.shortTitle}
            </Choice>
          ))}
        {compact && <Link href="/catalogue" className="inline-flex min-h-11 items-center rounded-full border border-dashed border-slate-300 px-4 text-sm font-bold text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300">+ 6 catalogue khác</Link>}
      </FinderStep>

      {selectedHub && (
        <>
          <FinderStep number={2} title="Tình trạng cụ thể">
            {selectedHub.conditions?.map((condition) => (
              <Choice key={condition.slug} active={selection.condition === condition.slug} onClick={() => choose("condition", condition.slug)}>
                {condition.label}
              </Choice>
            ))}
          </FinderStep>

          <FinderStep number={3} title="Bối cảnh cá nhân">
            {[...catalogueLenses.skin, ...catalogueLenses.audience].map((option) => {
              const key = catalogueLenses.skin.some((item) => item.slug === option.slug) ? "skin" : "audience"
              return <Choice key={`${key}-${option.slug}`} active={selection[key] === option.slug} onClick={() => choose(key, option.slug)}>{option.label}</Choice>
            })}
          </FinderStep>

          <FinderStep number={4} title="Ngân sách">
            {catalogueLenses.budget.map((option) => (
              <Choice key={option.slug} active={selection.budget === option.slug} onClick={() => choose("budget", option.slug)}>{option.label}</Choice>
            ))}
          </FinderStep>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Kết quả sẽ mở trong <strong className="text-slate-900 dark:text-white">{selectedHub.title}</strong>, không chuyển sang tìm kiếm chung.</p>
            <Link
              href={resultHref}
              onClick={() => trackEvent("finder_complete", { hub: selectedHub.slug, condition: selection.condition, skin: selection.skin, audience: selection.audience, budget: selection.budget })}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-rose-600 dark:bg-white dark:text-slate-950 dark:hover:bg-rose-200"
            >
              Xem lộ trình phù hợp <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

function FinderStep({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">{number}</span>
        {title}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${active ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}
    >
      {active && <Check className="h-4 w-4" />}
      {children}
    </button>
  )
}
