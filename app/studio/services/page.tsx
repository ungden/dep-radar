"use client"

import * as React from "react"
import Link from "next/link"
import { Pencil, Plus, Store, Trash2, X } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Button, ButtonLink, Card, PageHeader, Toggle } from "@/components/ui"
import { categoryLabel, getTemplate, templatesByCategory } from "@/lib/catalog"
import { POLICY, payoutFor } from "@/lib/pricing"
import { actions, useAct } from "@/lib/client-actions"
import { proView, servicesOf, useApp } from "@/lib/store"
import type { ServiceTemplate } from "@/lib/types"
import { cn, formatDuration, formatPrice } from "@/lib/utils"

export default function StudioServicesPage() {
  return (
    <div className="mx-auto max-w-3xl md:pt-4">
      <RequireSession role="pro">
        <ServicesManager />
      </RequireSession>
    </div>
  )
}

function ServicesManager() {
  const state = useApp()
  const act = useAct()
  const proId = state.session!.proId!
  const pro = proView(state, proId)!
  const listings = servicesOf(state, proId, true)
  const [editing, setEditing] = React.useState<string | null>(null)
  const [adding, setAdding] = React.useState(false)
  const rate = POLICY.commissionRate

  const available = pro.categories.flatMap((c) => templatesByCategory(c)).filter((t) => !listings.some((l) => l.templateId === t.id))

  return (
    <>
      <PageHeader
        title="Dịch vụ & bảng giá"
        action={
          <Button size="sm" variant="soft" onClick={() => setAdding(true)} disabled={!available.length}>
            <Plus className="size-4" /> Thêm
          </Button>
        }
      />
      <div className="mb-4 rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px] text-ink-soft">
        <p>
          Bạn chỉ chọn dịch vụ từ danh mục chuẩn của 360dep và đặt giá trong khung cho phép, để khách so sánh công bằng. Giá đã gồm vật tư, không thu thêm phụ phí ngoài
          phí di chuyển / đặt gấp do hệ thống tính.
        </p>
        <p className="mt-1">
          Hoa hồng 360dep: <b>{Math.round(rate * 100)}%</b> trên giá dịch vụ.{" "}
          <Link href={`/pros/${proId}?tab=services`} className="underline underline-offset-2">
            Xem như khách
          </Link>
        </p>
      </div>

      <ul className="space-y-3">
        {listings.map((l) => {
          const tpl = getTemplate(l.templateId)!
          return (
            <li key={l.id}>
              <Card className={cn("p-4", !l.active && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{tpl.name}</p>
                    <p className="text-xs text-muted">
                      {categoryLabel(tpl.category)}
                      {tpl.studioOnly && " · chỉ tại studio"}
                      {tpl.deliveryDays ? ` · giao file trong ${tpl.deliveryDays} ngày` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Sửa giá"
                    onClick={() => setEditing(l.templateId)}
                    className="inline-flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-subtle"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <Toggle
                    label={l.active ? "Tạm ẩn dịch vụ" : "Hiện dịch vụ"}
                    checked={l.active}
                    onChange={(value) => void act(() => actions.toggleProService(l.templateId, l.prices, value), value ? "Đã hiện dịch vụ" : "Đã tạm ẩn dịch vụ")}
                  />
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {tpl.variants
                    .filter((v) => l.prices[v.id] !== undefined)
                    .map((v) => (
                      <li key={v.id} className="rounded-xl bg-canvas px-3 py-2 text-[13px]">
                        <span className="text-ink-soft">{v.label}</span> · <b>{formatPrice(l.prices[v.id])}</b>
                        <span className="block text-xs text-muted">
                          {formatDuration(v.durationMin)} · bạn nhận {formatPrice(payoutFor(l.prices[v.id], rate))}
                        </span>
                      </li>
                    ))}
                </ul>
              </Card>
            </li>
          )
        })}
      </ul>

      {editing && <PriceEditor templateId={editing} onClose={() => setEditing(null)} />}
      {adding && (
        <Sheet title="Thêm dịch vụ từ danh mục" onClose={() => setAdding(false)}>
          <ul className="space-y-2">
            {available.map((t) => {
              // Model services open only after identity verification; the
              // database refuses the listing otherwise, so say why up front.
              const locked = Boolean(t.requiresVerification) && pro.identity !== "verified"
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setAdding(false)
                      setEditing(t.id)
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left hover:border-ink/30 disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{t.name}</span>
                      {locked && <span className="block text-[13px] font-medium text-warning">Cần xác minh danh tính trước</span>}
                      <span className="block text-xs text-muted">
                        {t.variants.length} gói · khung {formatPrice(Math.min(...t.variants.map((v) => v.minPrice)))} – {formatPrice(Math.max(...t.variants.map((v) => v.maxPrice)))}
                      </span>
                    </span>
                    {t.studioOnly ? <Store className="size-4 text-muted" /> : <Plus className="size-4 text-ink" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Mẹo: xác minh tay nghề tại{" "}
            <Link href="/studio/profile" className="text-accent underline underline-offset-2">
              Xác minh & đánh giá
            </Link>{" "}
            để được gắn huy hiệu và ưu tiên hiển thị.
          </p>
        </Sheet>
      )}
    </>
  )
}

function PriceEditor({ templateId, onClose }: { templateId: string; onClose: () => void }) {
  const state = useApp()
  const act = useAct()
  const proId = state.session!.proId!
  const tpl = getTemplate(templateId) as ServiceTemplate
  const existing = servicesOf(state, proId, true).find((x) => x.templateId === templateId)
  const rate = POLICY.commissionRate
  const [prices, setPrices] = React.useState<Record<string, number | undefined>>(() =>
    Object.fromEntries(tpl.variants.map((v) => [v.id, existing ? existing.prices[v.id] : v.suggestedPrice])),
  )
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const save = async () => {
    const chosen = Object.fromEntries(Object.entries(prices).filter(([, p]) => p !== undefined)) as Record<string, number>
    if (!Object.keys(chosen).length) return setError("Chọn ít nhất một gói.")
    setBusy(true)
    const problem = await act(() => actions.saveProService(templateId, chosen, existing?.active ?? true), "Đã lưu bảng giá")
    setBusy(false)
    if (problem) setError(problem)
    else onClose()
  }

  return (
    <Sheet title={tpl.name} onClose={onClose}>
      <p className="text-sm text-ink-soft">{tpl.description}</p>
      <p className="mt-1 text-xs text-muted">Bao gồm: {tpl.includes.join(" · ")}</p>

      <ul className="mt-4 space-y-3">
        {tpl.variants.map((v) => {
          const price = prices[v.id]
          const on = price !== undefined
          return (
            <li key={v.id} className={cn("rounded-2xl border p-3.5", on ? "border-accent/60 bg-surface" : "border-line bg-canvas")}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => setPrices((x) => ({ ...x, [v.id]: e.target.checked ? v.suggestedPrice : undefined }))}
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span className="flex-1 text-sm font-medium">
                  {v.label} <span className="font-normal text-muted">· {formatDuration(v.durationMin)}</span>
                </span>
                {on && <b className="text-sm">{formatPrice(price)}</b>}
              </label>
              {on && (
                <>
                  <input
                    type="range"
                    aria-label={`Giá ${v.label}`}
                    min={v.minPrice}
                    max={v.maxPrice}
                    step={5000}
                    value={price}
                    onChange={(e) => setPrices((x) => ({ ...x, [v.id]: Number(e.target.value) }))}
                    className="mt-3 w-full accent-[var(--color-accent)]"
                  />
                  <div className="flex justify-between text-xs text-muted">
                    <span>Tối thiểu {formatPrice(v.minPrice)}</span>
                    <button type="button" className="text-accent" onClick={() => setPrices((x) => ({ ...x, [v.id]: v.suggestedPrice }))}>
                      Gợi ý {formatPrice(v.suggestedPrice)}
                    </button>
                    <span>Tối đa {formatPrice(v.maxPrice)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    Bạn nhận {formatPrice(payoutFor(price, rate))} sau hoa hồng {Math.round(rate * 100)}%
                  </p>
                </>
              )}
            </li>
          )
        })}
      </ul>

      {error && <p className="mt-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

      <div className="mt-5 flex gap-2">
        {existing && (
          <Button
            variant="danger"
            aria-label="Bỏ dịch vụ này"
            onClick={async () => {
              const problem = await act(() => actions.removeProService(templateId), "Đã bỏ dịch vụ")
              if (problem) setError(problem)
              else onClose()
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button size="lg" className="flex-1" disabled={busy} onClick={() => void save()}>
          {busy ? "Đang lưu…" : "Lưu bảng giá"}
        </Button>
      </div>
      <ButtonLink href="/chinh-sach" variant="ghost" size="sm" className="mt-2 w-full">
        Vì sao có khung giá?
      </ButtonLink>
    </Sheet>
  )
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-accent/40 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-canvas p-5 md:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" aria-label="Đóng" onClick={onClose} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-subtle">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
