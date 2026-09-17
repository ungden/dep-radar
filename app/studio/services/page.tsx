"use client"

import * as React from "react"
import { Clock, Pencil, Plus, X } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Button, ButtonLink, Card, Field, PageHeader, Toggle, inputClass } from "@/components/ui"
import { CATEGORIES } from "@/lib/data"
import { actions, useApp } from "@/lib/store"
import type { CategoryId, Service } from "@/lib/types"
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

type Draft = { id?: string; name: string; description: string; category: CategoryId; durationMin: number; price: number }

function ServicesManager() {
  const { myServices, session } = useApp()
  const [draft, setDraft] = React.useState<Draft | null>(null)

  return (
    <>
      <PageHeader
        title="Dịch vụ & bảng giá"
        action={
          <Button size="sm" variant="soft" onClick={() => setDraft({ name: "", description: "", category: "nail", durationMin: 60, price: 200000 })}>
            <Plus className="size-4" /> Thêm
          </Button>
        }
      />
      <p className="mb-4 text-sm text-muted">
        Dịch vụ đang bật sẽ hiển thị trên hồ sơ để khách đặt lịch.{" "}
        <ButtonLink href={`/pros/${session!.proId}?tab=services`} variant="ghost" size="sm" className="h-auto px-0 text-rose underline underline-offset-2 hover:bg-transparent">
          Xem như khách
        </ButtonLink>
      </p>

      {draft && <ServiceForm draft={draft} onClose={() => setDraft(null)} />}

      <ul className="space-y-3">
        {myServices.map((s) => (
          <li key={s.id}>
            <ServiceRow service={s} onEdit={() => setDraft({ ...s })} />
          </li>
        ))}
      </ul>
    </>
  )
}

function ServiceRow({ service, onEdit }: { service: Service; onEdit: () => void }) {
  const active = service.active !== false
  return (
    <Card className={cn("flex items-center gap-3 p-4", !active && "opacity-60")}>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{service.name}</p>
        <p className="truncate text-xs text-muted">{service.description}</p>
        <p className="mt-1 flex items-center gap-3 text-[13px]">
          <b>{formatPrice(service.price)}</b>
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Clock className="size-3.5" />
            {formatDuration(service.durationMin)}
          </span>
        </p>
      </div>
      <button type="button" aria-label="Sửa" onClick={onEdit} className="inline-flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-blush">
        <Pencil className="size-4" />
      </button>
      <Toggle label={active ? "Ẩn dịch vụ" : "Hiện dịch vụ"} checked={active} onChange={() => actions.toggleService(service.id)} />
    </Card>
  )
}

function ServiceForm({ draft, onClose }: { draft: Draft; onClose: () => void }) {
  const [form, setForm] = React.useState(draft)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.name.trim().length >= 3 && form.price > 0 && form.durationMin >= 15

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          actions.saveService({ ...form, name: form.name.trim(), description: form.description.trim() })
          onClose()
        }}
        className="pb-safe max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-canvas p-5 md:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{form.id ? "Sửa dịch vụ" : "Thêm dịch vụ"}</h2>
          <button type="button" aria-label="Đóng" onClick={onClose} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-blush">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Tên dịch vụ">
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: Nail design" autoFocus />
          </Field>
          <Field label="Mô tả ngắn">
            <input className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Bao gồm những gì" />
          </Field>
          <Field label="Danh mục">
            <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value as CategoryId)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá (đ)">
              <input
                inputMode="numeric"
                className={inputClass}
                value={form.price ? form.price.toLocaleString("vi-VN") : ""}
                onChange={(e) => set("price", Number(e.target.value.replace(/\D/g, "")))}
              />
            </Field>
            <Field label="Thời lượng (phút)">
              <input
                type="number"
                min={15}
                step={15}
                className={inputClass}
                value={form.durationMin}
                onChange={(e) => set("durationMin", Number(e.target.value))}
              />
            </Field>
          </div>
        </div>
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={!valid}>
          Lưu dịch vụ
        </Button>
      </form>
    </div>
  )
}
