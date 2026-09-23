"use client"

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Info } from "lucide-react"
import { CATEGORY_ICON } from "@/components/beauty"
import { RequireSession } from "@/components/require-session"
import { BottomBar, Button, Field, PageHeader, PageSkeleton, inputClass } from "@/components/ui"
import { AddressPicker, defaultAddressId } from "@/components/address-picker"
import { CATEGORIES, getTemplate, templatesByCategory } from "@/lib/catalog"
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
        <Suspense fallback={<PageSkeleton />}>
          <NewRequestForm />
        </Suspense>
      </RequireSession>
    </div>
  )
}

/** "Trả thêm" goes up in these steps, per person, as far as the catalogue's top price. */
const EXTRA_STEP = 20000

/** Half-hour starts, the same step the freelancers' own calendars use. */
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})

function NewRequestForm() {
  const router = useRouter()
  const params = useSearchParams()
  const state = useApp()
  // Arriving from a service or a trade with nobody nearby: start on that one.
  const asked = getTemplate(params.get("service") ?? "")
  const askedCategory = CATEGORIES.find((c) => c.id === params.get("category"))?.id
  const start = asked ?? templatesByCategory(askedCategory ?? "nail")[0]
  const [category, setCategory] = React.useState<CategoryId>(start.category)
  const [templateId, setTemplateId] = React.useState(start.id)
  const [variantId, setVariantId] = React.useState(start.variants[0].id)
  const [quantity, setQuantity] = React.useState(1)
  // Per person, on top of the catalogue price: 0 posts at the catalogue price.
  const [extra, setExtra] = React.useState(0)
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
  const heads = variant.perPerson ? Math.min(Math.max(quantity, 1), variant.maxQuantity ?? 1) : 1
  // post_job fixes the price per person: the catalogue's suggested price, or
  // more if the customer offers it, never above the catalogue's top price.
  const extras = Array.from(
    { length: Math.floor((variant.maxPrice - variant.suggestedPrice) / EXTRA_STEP) + 1 },
    (_, i) => i * EXTRA_STEP,
  )
  const unit = variant.suggestedPrice + (extras.includes(extra) ? extra : 0)

  const pickVariant = (id: string) => {
    setVariantId(id)
    setQuantity(1)
    setExtra(0)
  }

  const pickCategory = (c: CategoryId) => {
    setCategory(c)
    const first = templatesByCategory(c)[0]
    setTemplateId(first.id)
    pickVariant(first.variants[0].id)
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
          quantity: heads,
          // Left out at the catalogue price.
          price: unit > variant.suggestedPrice ? unit : null,
        })
        setBusy(false)
        if ("error" in result) return setError(result.error)
        router.replace(`/requests/${result.id}`)
      }}
    >
      <p className="rounded-2xl bg-subtle px-4 py-3 text-[13px] text-accent-dark">
        Chọn dịch vụ, giờ và địa chỉ. 360dep báo cho mọi người làm phù hợp quanh bạn, ai nhận trước sẽ làm với giá bên dưới.
        Người làm nhận rồi thì hai bên nhắn tin được với nhau trong lịch hẹn.
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
                  "flex flex-col items-center gap-1.5 rounded-2xl py-3 text-[12.5px] transition-colors",
                  active ? "bg-accent font-semibold text-white" : "bg-accent-soft text-ink hover:bg-subtle-strong",
                )}
              >
                <Icon className={cn("size-7", active ? "text-white" : "text-accent")} />
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
            pickVariant(next.variants[0].id)
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
              onClick={() => pickVariant(v.id)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm",
                v.id === variant.id ? "border-accent bg-subtle text-accent-dark" : "border-line bg-surface text-ink-soft",
              )}
            >
              <span className="block font-medium">
                {v.label} · {formatDuration(v.durationMin)}
              </span>
              <span className="block text-xs">
                Giá {formatPrice(v.suggestedPrice)}
                {v.perPerson ? " / người" : ""}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Bao gồm: {tpl.includes.join(" · ")}</p>
        {variant.perPerson && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-canvas px-3 py-2">
            <span className="flex-1 text-[13px]">Số người</span>
            <button
              type="button"
              aria-label="Giảm số người"
              disabled={heads <= 1}
              onClick={() => setQuantity(heads - 1)}
              className="inline-flex size-8 items-center justify-center rounded-full border border-line-strong disabled:opacity-40"
            >
              −
            </button>
            <span className="w-6 text-center font-semibold">{heads}</span>
            <button
              type="button"
              aria-label="Tăng số người"
              disabled={heads >= (variant.maxQuantity ?? 1)}
              onClick={() => setQuantity(heads + 1)}
              className="inline-flex size-8 items-center justify-center rounded-full border border-line-strong disabled:opacity-40"
            >
              +
            </button>
          </div>
        )}
      </fieldset>

      <section aria-labelledby="request-price" className="rounded-2xl border border-line bg-surface p-4">
        <p id="request-price" className="text-[15px]">
          Giá: <b className="text-[17px]">{formatPrice(unit * heads)}</b>
          {heads > 1 && <span className="text-[13px] text-muted"> ({formatPrice(unit)} × {heads} người)</span>}
        </p>
        <p className="mt-0.5 text-[13px] text-ink-soft">Người làm nhận trước sẽ làm với giá này.</p>
        {extras.length > 1 && (
          <div className="mt-3">
            <Field label={`Trả thêm để có người nhận nhanh hơn (tuỳ chọn${heads > 1 ? ", mỗi người" : ""})`}>
              <select className={inputClass} value={unit - variant.suggestedPrice} onChange={(e) => setExtra(Number(e.target.value))}>
                {extras.map((x) => (
                  <option key={x} value={x}>
                    {x === 0 ? "Không trả thêm" : `+${formatPrice(x)} · giá ${formatPrice(variant.suggestedPrice + x)}${heads > 1 ? "/người" : ""}`}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      </section>

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
                atHome === o.v ? "border-accent bg-subtle font-medium text-accent-dark" : "border-line bg-surface text-ink-soft",
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
            người làm.
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
                paymentMethod === m ? "border-accent bg-subtle font-medium text-accent-dark" : "border-line bg-surface text-ink-soft",
              )}
            >
              {m === "online" ? "Thanh toán online (sắp có)" : PAYMENT_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Trả tiền mặt hoặc chuyển khoản cho người làm sau khi làm. Không cần đặt cọc.
        </p>
      </fieldset>

      <p className="flex gap-2 text-xs text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Khách không mất phí đăng yêu cầu. Nếu nhà bạn cách người nhận việc xa hơn {POLICY.freeTravelKm} km hoặc giờ hẹn trong vòng{" "}
        {POLICY.urgentWithinHours} giờ tới, lịch hẹn cộng thêm phí di chuyển / đặt gấp theo quy định, hiện rõ trong lịch hẹn.
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
