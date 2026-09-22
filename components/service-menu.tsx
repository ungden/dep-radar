"use client"

import * as React from "react"
import { Check, ChevronDown, Clock, Store } from "lucide-react"
import { ButtonLink, Card, Chip, EmptyState } from "@/components/ui"
import { categoryLabel, getTemplate } from "@/lib/catalog"
import { servicesOf, useApp } from "@/lib/store"
import type { CategoryId, ProService } from "@/lib/types"
import { cn, formatDuration, formatPrice } from "@/lib/utils"

/** Freelancer's price list: catalogue services with per-option prices, like a salon menu. */
export function ServiceMenu({ proId, bookable = true }: { proId: string; bookable?: boolean }) {
  const state = useApp()
  const services = servicesOf(state, proId)
  const [cat, setCat] = React.useState<CategoryId | "all">("all")
  const cats = Array.from(new Set(services.map((s) => getTemplate(s.templateId)!.category)))
  const shown = services.filter((s) => cat === "all" || getTemplate(s.templateId)!.category === cat)

  if (!services.length) return <EmptyState title="Chuyên viên đang cập nhật bảng giá" />

  return (
    <div className="mt-4">
      {cats.length > 1 && (
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>
            Tất cả
          </Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {categoryLabel(c)}
            </Chip>
          ))}
        </div>
      )}
      <ul className="space-y-3">
        {shown.map((s) => (
          <li key={s.id}>
            <ServiceCard proId={proId} service={s} bookable={bookable} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">
        Tên dịch vụ, nội dung và khung giá do 360dep chuẩn hoá. Giá đã gồm vật tư. Phí di chuyển và phí đặt gấp (nếu có) được tính rõ trước khi xác nhận.
      </p>
    </div>
  )
}

function ServiceCard({ proId, service, bookable }: { proId: string; service: ProService; bookable: boolean }) {
  const tpl = getTemplate(service.templateId)!
  const variants = tpl.variants.filter((v) => service.prices[v.id] !== undefined)
  const [variantId, setVariantId] = React.useState(variants[0]?.id)
  const [open, setOpen] = React.useState(false)
  const variant = variants.find((v) => v.id === variantId) ?? variants[0]
  if (!variant) return null

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{tpl.name}</p>
          <p className="mt-0.5 text-xs text-muted">{tpl.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {tpl.studioOnly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-ink-soft">
              <Store className="size-3" /> Tại studio
            </span>
          )}
        </div>
      </div>

      {variants.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="radiogroup" aria-label={`Gói ${tpl.name}`}>
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={v.id === variant.id}
              onClick={() => setVariantId(v.id)}
              className={cn(
                "h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-colors",
                v.id === variant.id ? "border-accent bg-subtle text-accent-dark" : "border-line bg-canvas text-ink-soft hover:border-subtle-strong",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xl font-semibold tracking-tight">{formatPrice(service.prices[variant.id])}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <Clock className="size-3.5" />
            {variants.length === 1 && variant.label !== `${variant.durationMin} phút` ? `${variant.label} · ` : ""}
            {formatDuration(variant.durationMin)}
          </p>
        </div>
        {bookable && (
          <ButtonLink href={`/book/${proId}?service=${tpl.id}&variant=${variant.id}`} className="px-6">
            Đặt
          </ButtonLink>
        )}
      </div>

      <button type="button" onClick={() => setOpen((x) => !x)} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ink-soft">
        Bao gồm <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-2 space-y-1">
          {tpl.includes.map((x) => (
            <li key={x} className="flex items-start gap-1.5 text-xs text-ink-soft">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
              {x}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
