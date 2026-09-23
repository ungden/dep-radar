"use client"

import * as React from "react"
import { Check, ChevronDown, Clock, MapPin, PackageCheck, X } from "lucide-react"
import { TradeDot } from "@/components/trade"
import { ButtonLink, Chip, EmptyState } from "@/components/ui"
import { categoryLabel, getTemplate, verticalOf } from "@/lib/catalog"
import { getPro, servicesOf, useApp } from "@/lib/store"
import { excludes, personWord, placeLabel } from "@/lib/trade"
import type { CategoryId, Pro, ProService } from "@/lib/types"
import { cn, formatDuration, formatPrice } from "@/lib/utils"

/** A freelancer's price list: catalogue services with their own price for each option. */
export function ServiceMenu({ proId, bookable = true }: { proId: string; bookable?: boolean }) {
  const state = useApp()
  const pro = getPro(state, proId)
  const services = servicesOf(state, proId).filter((s) => getTemplate(s.templateId))
  const [cat, setCat] = React.useState<CategoryId | "all">("all")
  const cats = Array.from(new Set(services.map((s) => getTemplate(s.templateId)!.category)))
  const shown = services.filter((s) => cat === "all" || getTemplate(s.templateId)!.category === cat)

  if (!services.length)
    return (
      <EmptyState
        title={`${capitalize(pro ? personWord(pro.categories) : "người làm")} đang cập nhật bảng giá`}
        text="Quay lại sau, hoặc đăng yêu cầu để người làm khác quanh bạn nhận việc."
      />
    )

  return (
    <div className="mt-5">
      {cats.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>
            Tất cả
          </Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              <TradeDot vertical={verticalOf(c)} />
              {categoryLabel(c)}
            </Chip>
          ))}
        </div>
      )}
      <ul className="space-y-3">
        {shown.map((s) => (
          <li key={s.id}>
            <ServiceCard pro={pro} proId={proId} service={s} bookable={bookable} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] leading-relaxed text-muted">
        Tên dịch vụ, nội dung và khung giá do 360dep chuẩn hoá, nên bạn so sánh được giữa các hồ sơ. Phí di chuyển và phí đặt
        gấp (nếu có) hiện rõ trước khi bạn xác nhận.
      </p>
    </div>
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function ServiceCard({ pro, proId, service, bookable }: { pro?: Pro; proId: string; service: ProService; bookable: boolean }) {
  const tpl = getTemplate(service.templateId)!
  const variants = tpl.variants.filter((v) => service.prices[v.id] !== undefined)
  const [variantId, setVariantId] = React.useState(variants[0]?.id)
  const [open, setOpen] = React.useState(false)
  const variant = variants.find((v) => v.id === variantId) ?? variants[0]
  if (!variant) return null
  const includesId = `${service.id}-includes`

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      <p className="text-[16px] font-bold leading-snug">{tpl.name}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{tpl.description}</p>

      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
        <li className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 text-muted" />
          {placeLabel(tpl, pro)}
        </li>
        {tpl.deliverable && (
          <li className="inline-flex items-center gap-1.5">
            <PackageCheck className="size-3.5 text-muted" />
            {tpl.deliverable}
            {tpl.deliveryDays ? ` · giao trong ${tpl.deliveryDays} ngày` : ""}
          </li>
        )}
      </ul>

      {variants.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-3.5 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label={`Gói ${tpl.name}`}>
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={v.id === variant.id}
              onClick={() => setVariantId(v.id)}
              className={cn(
                "relative h-9 shrink-0 rounded-full border px-4 text-[13px] font-semibold transition-colors after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
                v.id === variant.id ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:border-ink/30",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[20px] font-bold tracking-tight">{formatPrice(service.prices[variant.id])}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
            <Clock className="size-3.5" />
            {variants.length === 1 && !variant.label.startsWith(`${variant.durationMin} phút`) ? `${variant.label} · ` : ""}
            {formatDuration(variant.durationMin)}
            {variant.perPerson ? " · mỗi người" : ""}
          </p>
        </div>
        {bookable && (
          <ButtonLink href={`/book/${proId}?service=${tpl.id}&variant=${variant.id}`} className="px-6">
            Đặt
          </ButtonLink>
        )}
      </div>

      {tpl.includes.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={includesId}
            onClick={() => setOpen((x) => !x)}
            className="-mb-2 mt-1 inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink"
          >
            Bao gồm <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <ul id={includesId} className="mt-2 space-y-1.5">
              {tpl.includes.map((x) => (
                <li key={x} className="flex items-start gap-2 text-[14px] text-ink-soft">
                  {excludes(x) ? <X className="mt-0.5 size-4 shrink-0 text-muted" /> : <Check className="mt-0.5 size-4 shrink-0 text-success" />}
                  {x}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
