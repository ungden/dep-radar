"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Info } from "lucide-react"
import { CATEGORY_ICON } from "@/components/beauty"
import { RequireSession } from "@/components/require-session"
import { BottomBar, Button, Field, PageHeader, inputClass } from "@/components/ui"
import { AddressPicker, defaultAddressId } from "@/components/address-picker"
import { CATEGORIES, templatesByCategory } from "@/lib/catalog"
import { POLICY } from "@/lib/pricing"
import { actions } from "@/lib/client-actions"
import { useApp } from "@/lib/store"
import { PAYMENT_LABEL } from "@/components/price-breakdown"
import type { CategoryId, PaymentMethod } from "@/lib/types"
import { addDays, cn, formatDuration, formatPrice, todayISO } from "@/lib/utils"

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Đăng yêu cầu" back />
      <RequireSession role="customer">
        <NewRequestForm />
      </RequireSession>
    </div>
  )
}

/** Half-hour starts, the same step the freelancers' own calendars use. */
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})

function NewRequestForm() {
  const router = useRouter()
  const state = useApp()
  const [category, setCategory] = React.useState<CategoryId>("nail")
  const [templateId, setTemplateId] = React.useState(templatesByCategory("nail")[0].id)
  const [variantId, setVariantId] = React.useState(templatesByCategory("nail")[0].variants[0].id)
  const [description, setDescription] = React.useState("")
  const [date, setDate] = React.useState(addDays(todayISO(), 2))
  const [time, setTime] = React.useState("16:00")
  const [pickedAddress, setAddressId] = React.useState<string | null>(null)
  const [atHomePref, setAtHome] = React.useState(true)
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cash")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const addressId = pickedAddress ?? defaultAddressId(state.addresses)
  const templates = templatesByCategory(category)
  const tpl = templates.find((t) => t.id === templateId) ?? templates[0]
  const variant = tpl.variants.find((v) => v.id === variantId) ?? tpl.variants[0]
  const atHome = atHomePref && !tpl.studioOnly

  const pickCategory = (c: CategoryId) => {
    setCategory(c)
    const first = templatesByCategory(c)[0]
    setTemplateId(first.id)
    setVariantId(first.variants[0].id)
  }

  const valid = date >= todayISO() && atHome && Boolean(addressId)

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!valid || busy) return
        setBusy(true)
        setError(null)
        const result = await actions.createJob({
          templateId: tpl.id,
          variantId: variant.id,
          description: description.trim(),
          date,
          time,
          addressId,
          atHome,
          paymentMethod,
        })
        setBusy(false)
        if ("error" in result) return setError(result.error)
        router.replace(`/requests/${result.id}`)
      }}
    >
      <p className="rounded-2xl bg-blush px-4 py-3 text-[13px] text-rose-dark">
        Chọn dịch vụ theo danh mục chuẩn của dep360. Freelancer phù hợp quanh bạn sẽ báo giá trong khung giá quy định, bạn so sánh hồ sơ, đánh giá và chọn người ưng ý.
      </p>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">Bạn cần làm gì?</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c.id]
            const active = c.id === category
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => pickCategory(c.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-[11.5px] transition-colors",
                  active ? "border-rose bg-blush font-semibold text-rose-dark" : "border-line bg-surface text-ink-soft",
                )}
              >
                <Icon className="size-5" />
                {c.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <Field label="Dịch vụ">
        <select
          className={inputClass}
          value={tpl.id}
          onChange={(e) => {
            const next = templates.find((t) => t.id === e.target.value)!
            setTemplateId(next.id)
            setVariantId(next.variants[0].id)
          }}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">Gói</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {tpl.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.id === variant.id}
              onClick={() => setVariantId(v.id)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm",
                v.id === variant.id ? "border-rose bg-blush text-rose-dark" : "border-line bg-surface text-ink-soft",
              )}
            >
              <span className="block font-medium">
                {v.label} · {formatDuration(v.durationMin)}
              </span>
              <span className="block text-xs">
                Khung giá {formatPrice(v.minPrice)} – {formatPrice(v.maxPrice)}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Bao gồm: {tpl.includes.join(" · ")}</p>
      </fieldset>

      <Field label="Mô tả thêm (tuỳ chọn)" hint="Tình trạng da/móng/tóc, phong cách mong muốn, số người…">
        <textarea
          className={cn(inputClass, "resize-none")}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="VD: da hơi dầu, muốn makeup trong trẻo, bền đến tối…"
          maxLength={300}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ngày">
          <input type="date" className={inputClass} value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Giờ bắt đầu">
          <select className={inputClass} value={time} onChange={(e) => setTime(e.target.value)}>
            {TIME_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">Địa điểm</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, l: "Làm tại nhà tôi" },
            { v: false, l: "Tôi đến studio" },
          ].map((o) => (
            <button
              key={o.l}
              type="button"
              disabled={o.v && tpl.studioOnly}
              aria-pressed={atHome === o.v}
              onClick={() => setAtHome(o.v)}
              className={cn(
                "h-11 rounded-xl border text-sm disabled:opacity-40",
                atHome === o.v ? "border-rose bg-blush font-medium text-rose-dark" : "border-line bg-surface text-ink-soft",
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
        {tpl.studioOnly && <p className="mt-2 text-xs text-warning">Dịch vụ này cần thiết bị tại studio.</p>}
        {!atHome && (
          <p className="mt-2 text-xs text-warning">
            Đăng yêu cầu hiện chỉ dành cho dịch vụ làm tại nhà. Với dịch vụ tại studio, hãy đặt lịch trực tiếp với
            chuyên viên.
          </p>
        )}
        {atHome && (
          <div className="mt-3">
            <AddressPicker
              value={addressId}
              onChange={setAddressId}
              city={state.addresses[0]?.city ?? "Hà Nội"}
              district={state.addresses[0]?.district ?? "Đống Đa"}
            />
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">Thanh toán</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["cash", "online"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={m === "online"}
              aria-pressed={paymentMethod === m}
              onClick={() => m === "cash" && setPaymentMethod(m)}
              className={cn(
                "h-11 rounded-xl border text-sm disabled:opacity-50",
                paymentMethod === m ? "border-rose bg-blush font-medium text-rose-dark" : "border-line bg-surface text-ink-soft",
              )}
            >
              {m === "online" ? "Thanh toán online (sắp có)" : PAYMENT_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Trả tiền mặt hoặc chuyển khoản cho chuyên viên sau khi làm. Không cần đặt cọc.
        </p>
      </fieldset>

      <p className="flex gap-2 text-xs text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Khách không mất phí đăng yêu cầu. Nếu làm tại nhà xa hơn {POLICY.freeTravelKm} km hoặc bắt đầu trong vòng {POLICY.urgentWithinHours} giờ, báo giá sẽ kèm phí di chuyển / đặt gấp theo quy định.
      </p>

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <BottomBar>
        <Button type="submit" size="lg" className="w-full" disabled={!valid || busy}>
          {busy ? "Đang đăng…" : "Đăng yêu cầu"}
        </Button>
      </BottomBar>
    </form>
  )
}
