"use client"

import { requestCopy } from "@/lib/request-copy"
import * as React from "react"
import { Suspense } from "react"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react"
import { NewAddressForm, addressLine, defaultAddressId } from "@/components/address-picker"
import { ConductNote } from "@/components/conduct"
import { ReferenceUpload, type RefUpload } from "@/components/reference-photos"
import { RequireSession } from "@/components/require-session"
import { CategoryBubble, IllustrationBadge } from "@/components/shop"
import { PageSkeleton, inputClass } from "@/components/ui"
import { getTemplate, serviceDuration, serviceQuantity, tierLabels } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import { needsConductNote } from "@/lib/conduct"
import { categoryPhoto } from "@/lib/design/photos"
import { POLICY, isUrgent, isTooSoon } from "@/lib/pricing"
import { REQUEST_GOALS, canRequestService, requestCategories, requestSelection, requestTemplates, requestVariants } from "@/lib/request-goals"
import { moveRadio } from "@/lib/radio-navigation"
import { useApp, useRefresh } from "@/lib/store"
import type { CategoryId, PaymentMethod, ServiceTemplate } from "@/lib/types"
import { addDays, cn, formatDateLong, formatDuration, formatPrice, todayISO, weekdayShort } from "@/lib/utils"

/**
 * Đặt theo dịch vụ, one question to a screen: which package and level, when,
 * where, then a summary to send. An Artist listed at or below the level can
 * take it, so a higher level reaches more of them; every Artist who can do it
 * is told and the first to take it gets it (post_job, as the app's
 * apps/mobile/src/app/yeu-cau/moi.tsx). Requests are for work at the customer's
 * place. Anyone can walk through it: a sign-in is asked for only when sending,
 * and the choices wait in this tab (sessionStorage) while they do.
 */
const STEPS = [
  { id: "goi", label: "Gói và giá" },
  { id: "thoi-gian", label: "Thời gian" },
  { id: "dia-chi", label: "Địa chỉ" },
  { id: "xem-lai", label: "Xem lại" },
] as const

/** Half-hour starts, the same step the freelancers' own calendars use. */
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})
const DAY_PARTS = [
  { label: "Sáng", from: "00:00", to: "12:00" },
  { label: "Chiều", from: "12:00", to: "18:00" },
  { label: "Tối", from: "18:00", to: "24:00" },
]
const DAYS_AHEAD = 21
const FEE_CHOICES: readonly number[] = [POLICY.nearTravelFee, POLICY.travelFeeCap]
const DRAFT_KEY = "dep360_order_draft"

const cta = "inline-flex min-h-[54px] items-center justify-center rounded-[var(--radius-md)] bg-accent px-6 text-[17px] font-bold text-white transition-colors hover:bg-accent-dark disabled:pointer-events-none disabled:opacity-40"
const softButton = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-accent-soft px-[18px] text-meta font-bold text-accent-dark transition-colors hover:bg-[#F8DCE6]"

const firstOf = (c: CategoryId) => requestTemplates(c)[0]

type Draft = {
  /** The link they arrived by: a different one starts over instead of resuming. */
  origin: string
  category: CategoryId
  templateId: string
  variantId: string
  quantity: number
  tier: number | null
  feeLimit: number
  date: string
  time: string
  description: string
  addressId: string | null
}

function readDraft(origin: string): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as Draft
    const template = getTemplate(draft.templateId)
    if (draft.origin !== origin || !template || !canRequestService(template) || template.category !== draft.category) return null
    if (!requestVariants(template).some((v) => v.id === draft.variantId) || !FEE_CHOICES.includes(draft.feeLimit)) return null
    return draft
  } catch {
    return null
  }
}

function saveDraft(draft: Draft | null) {
  try {
    if (draft) window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    else window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {}
}

const subscribeNever = () => () => {}

export function OrderFlowPage() {
  return (
    <div className="roomy pt-3 md:pt-10">
      <Suspense fallback={<PageSkeleton />}>
        <OrderGate />
      </Suspense>
    </div>
  )
}

/**
 * The form reads this tab's saved choices and today's clock, so it starts in
 * the browser. A partner gets the existing "switch mode" answer; a visitor
 * passes, and is asked to sign in at the last step.
 */
function OrderGate() {
  const { session } = useApp()
  const inBrowser = React.useSyncExternalStore(subscribeNever, () => true, () => false)
  if (!inBrowser) return <PageSkeleton />
  return session ? (
    <RequireSession role="customer">
      <OrderForm />
    </RequireSession>
  ) : (
    <OrderForm />
  )
}

function OrderForm() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const state = useApp()
  const refresh = useRefresh()
  const { session } = state

  // Arriving from a service or a trade: start on that one.
  const asked = requestSelection(params.get("service"), params.get("variant"))
  const askedCategory = requestCategories.find((c) => c.id === params.get("category"))?.id
  const origin = `${params.get("service") ?? ""}|${params.get("category") ?? ""}|${params.get("variant") ?? ""}`
  const [start] = React.useState(() => {
    const draft = readDraft(origin)
    const template = draft ? getTemplate(draft.templateId)! : (asked?.template ?? (askedCategory ? firstOf(askedCategory) : getTemplate("makeup-party")!))
    return {
      draft,
      category: template.category,
      templateId: template.id,
      variantId: draft?.variantId ?? asked?.variant.id ?? requestSelection(template.id)!.variant.id,
      date: draft && draft.date >= todayISO() ? draft.date : addDays(todayISO(), 2),
    }
  })

  const [category, setCategory] = React.useState<CategoryId>(start.category)
  const [templateId, setTemplateId] = React.useState(start.templateId)
  const [variantId, setVariantId] = React.useState(start.variantId)
  const [quantity, setQuantity] = React.useState(start.draft?.quantity ?? 1)
  // One of the option's price levels, per person; null starts on the option's own suggestion.
  const [tier, setTier] = React.useState<number | null>(start.draft?.tier ?? null)
  const [feeLimit, setFeeLimit] = React.useState<number>(start.draft?.feeLimit ?? POLICY.nearTravelFee)
  const [description, setDescription] = React.useState(start.draft?.description ?? "")
  const [refs, setRefs] = React.useState<RefUpload[]>([])
  const [date, setDate] = React.useState(start.date)
  const [time, setTime] = React.useState(start.draft?.time ?? "16:00")
  const [pickedAddress, setAddressId] = React.useState<string | null>(start.draft?.addressId ?? null)
  const atHomePref = true
  const paymentMethod: PaymentMethod = "cash"
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  // Coming from a service page the service is settled; "Đổi" opens the choice again.
  const [picking, setPicking] = React.useState(!asked)
  const [addingAddress, setAddingAddress] = React.useState(false)

  const addressId = state.addresses.some((a) => a.id === pickedAddress) ? pickedAddress : defaultAddressId(state.addresses)
  const chosenAddress = state.addresses.find((a) => a.id === addressId)
  const templates = requestTemplates(category)
  const tpl = templates.find((t) => t.id === templateId) ?? templates[0]
  const variant = requestSelection(tpl.id, variantId)!.variant
  const atHome = atHomePref && !tpl.studioOnly
  const heads = serviceQuantity(variant, quantity)
  // post_job fixes the price per person at one of the catalogue's levels.
  const unit = tier !== null && variant.tiers.includes(tier) ? tier : variant.suggestedPrice
  const labels = tierLabels(variant)
  const tierLabel = labels[variant.tiers.indexOf(unit)] ?? ""
  const maxTotal = unit * heads + feeLimit + (isUrgent(date, time) ? POLICY.urgentFee : 0)
  const valid = date >= todayISO() && atHome && Boolean(addressId) && (variant.sessions ?? 1) === 1

  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.id === params.get("buoc")))
  const onLast = stepIndex === STEPS.length - 1
  // One history entry per step, so the browser's back goes to the step before.
  // A plain entry, not a route change: nothing to fetch between questions.
  const goTo = (index: number) => {
    const next = new URLSearchParams(window.location.search)
    if (index === 0) next.delete("buoc")
    else next.set("buoc", STEPS[index].id)
    window.history.pushState(null, "", `${pathname}${next.size ? `?${next}` : ""}`)
    window.scrollTo({ top: 0 })
  }

  const today = todayISO()
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i))
  const openTimes = TIME_OPTIONS.filter((t) => !isTooSoon(date, t))
  const timeOk = openTimes.includes(time) && date >= today
  const packageOk = (variant.sessions ?? 1) === 1 && atHome
  const canContinue = stepIndex === 0 ? packageOk : stepIndex === 1 ? timeOk : true

  // Said before sending, not discovered after a long wait.
  const area = chosenAddress?.city ?? state.city
  const nobodyHere =
    !state.catalogError &&
    !state.pros.some(
      (p) =>
        p.published &&
        p.acceptingJobs &&
        (!area || p.city === area) &&
        state.proServices.some((s) => s.proId === p.id && s.templateId === tpl.id && s.active && s.prices[variant.id] != null && s.prices[variant.id] <= unit),
    )

  const pickVariant = (id: string) => {
    setVariantId(id)
    setQuantity(1)
    setTier(null)
  }
  const pickTemplate = (t: ServiceTemplate) => {
    setTemplateId(t.id)
    pickVariant(t.variants[0].id)
  }
  const pickCategory = (c: CategoryId) => {
    setCategory(c)
    pickTemplate(firstOf(c))
  }

  // The choices wait in this tab while the visitor signs in or adds a phone number.
  React.useEffect(() => {
    saveDraft({ origin, category, templateId: tpl.id, variantId: variant.id, quantity, tier, feeLimit, date, time, description, addressId: pickedAddress })
  }, [origin, category, tpl.id, variant.id, quantity, tier, feeLimit, date, time, description, pickedAddress])

  // A new question takes the focus, so a screen reader reads it and the keyboard starts there.
  const heading = React.useRef<HTMLHeadingElement>(null)
  const firstRender = React.useRef(true)
  React.useEffect(() => {
    if (firstRender.current) firstRender.current = false
    else heading.current?.focus({ preventScroll: true })
  }, [stepIndex])

  const here = () => `${pathname}?${new URLSearchParams(window.location.search)}`

  const send = async () => {
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
      price: unit,
      maxTotal,
    })
    if ("error" in result) {
      setBusy(false)
      return setError(result.error)
    }
    // The request is up; its photos follow, and a failure does not take it down.
    if (refs.length) {
      const sent = await actions.setJobReferences(result.id, refs.map((r) => r.path))
      if (sent.error) window.alert(`Đã đăng yêu cầu, nhưng chưa gửi được ảnh mẫu: ${sent.error}`)
    }
    setBusy(false)
    saveDraft(null)
    router.replace(`/requests/${result.id}`)
  }

  const primary = () => {
    if (!onLast) return goTo(stepIndex + 1)
    if (!session) return router.push(`/login?next=${encodeURIComponent(here())}`)
    if (!addressId) return goTo(2)
    // Bookings end in a call: the middleware asks on /requests/new, this page is open to visitors, and the database refuses without one.
    if (!session.phone) return router.push(`/me/so-dien-thoai?next=${encodeURIComponent(here())}`)
    void send()
  }
  const primaryLabel = !onLast ? "Tiếp tục" : !session ? "Đăng nhập để đặt" : !addressId ? "Thêm địa chỉ" : busy ? "Đang gửi…" : "Tìm Artist"
  // A visitor's address comes after signing in; everything else has to hold already.
  const primaryDisabled = busy || (onLast ? !timeOk || !packageOk : !canContinue)

  const addressPart = addingAddress || state.addresses.length === 0

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 pb-32 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:pb-0">
      <div className="min-w-0">
        <StepIndicator index={stepIndex} onPick={goTo} onBack={() => (stepIndex > 0 ? goTo(stepIndex - 1) : router.back())} />

        <div key={stepIndex} className="mt-7 animate-fade-up space-y-8 md:mt-9">
          {stepIndex === 0 && (
            <>
              <Question ref={heading}>{picking ? "Bạn cần làm gì?" : "Chọn gói và mức giá"}</Question>

              <p className="text-ink-soft">{requestCopy.vi.noArtist}</p>
              {picking ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2" aria-label="Nhu cầu thường chọn">
                    {REQUEST_GOALS.map((g) => <button key={g.templateId} type="button" className={softButton} onClick={() => {
                      const choice = requestSelection(g.templateId, g.variantId)
                      if (choice) { setCategory(choice.template.category); pickTemplate(choice.template); setVariantId(choice.variant.id); setPicking(false) }
                    }}>{g.label}</button>)}
                  </div>
                  <div role="radiogroup" aria-label="Danh mục" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:gap-x-2 md:gap-y-4 md:overflow-visible md:px-0">
                    {requestCategories.map((c) => (
                      <CategoryBubble
                        key={c.id}
                        category={c}
                        photo={categoryPhoto(c.id)}
                        active={c.id === category}
                        onClick={() => pickCategory(c.id)}
                        radio={{ role: "radio", "aria-checked": c.id === category, tabIndex: c.id === category ? 0 : -1, onKeyDown: (e) => moveRadio(e, () => pickCategory(c.id)) }}
                      />
                    ))}
                  </div>
                  <div role="radiogroup" aria-label="Dịch vụ" className="grid gap-3 md:grid-cols-2">
                    {templates.map((t) => (
                      <Option key={t.id} title={t.name} selected={t.id === tpl.id} onPick={() => pickTemplate(t)} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[var(--radius-lg)] bg-surface">
                  <div className="relative h-[150px] lg:hidden">
                    <Image src={categoryPhoto(category, 1)} alt="" fill sizes="100vw" className="object-cover" />
                    <IllustrationBadge className="left-3 top-3" />
                  </div>
                  <div className="flex items-center gap-3 p-4 md:p-5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[20px] font-bold leading-tight tracking-[-0.02em]">{tpl.name}</p>
                      <p className="mt-1 text-meta text-muted">Bao gồm: {tpl.includes.join(" · ")}</p>
                    </div>
                    <button type="button" className={softButton} onClick={() => setPicking(true)}>
                      Đổi
                    </button>
                  </div>
                </div>
              )}

              <Group title="Chọn gói">
                <div role="radiogroup" aria-label="Gói" className="grid gap-3 md:grid-cols-2">
                  {requestVariants(tpl).map((v) => (
                    <Option key={v.id} title={v.label} note={`${formatDuration(v.durationMin)} · từ ${formatPrice(v.minPrice)}${v.perPerson ? " / người" : ""}`} selected={v.id === variant.id} onPick={() => pickVariant(v.id)} />
                  ))}
                </div>
                {picking && <p className="mt-3 text-meta text-muted">Bao gồm: {tpl.includes.join(" · ")}</p>}
                {variant.perPerson && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-4 py-3">
                    <span className="font-semibold">Số người</span>
                    <span className="flex items-center gap-3">
                      <button type="button" aria-label="Giảm số người" disabled={heads <= (variant.minQuantity ?? 1)} onClick={() => setQuantity(heads - 1)} className="inline-flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark disabled:opacity-40">
                        <Minus className="size-4" aria-hidden />
                      </button>
                      <span className="w-7 text-center text-lead font-bold tabular-nums">{heads}</span>
                      <button type="button" aria-label="Tăng số người" disabled={heads >= (variant.maxQuantity ?? 1)} onClick={() => setQuantity(heads + 1)} className="inline-flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark disabled:opacity-40">
                        <Plus className="size-4" aria-hidden />
                      </button>
                    </span>
                  </div>
                )}
                {(variant.sessions ?? 1) > 1 && (
                  <p role="alert" className="mt-3 rounded-[var(--radius-md)] bg-warning-soft px-4 py-3 text-meta text-warning">
                    Gói nhiều buổi: hãy đặt trực tiếp từ hồ sơ Artist để chọn đủ lịch.
                  </p>
                )}
                {!atHome && (
                  <p role="alert" className="mt-3 rounded-[var(--radius-md)] bg-warning-soft px-4 py-3 text-meta text-warning">
                    Dịch vụ cần thiết bị tại studio hiện chưa mở. Hãy chọn dịch vụ làm tận nơi.
                  </p>
                )}
              </Group>

              <Group title="Chọn mức giá" note="Mức càng cao, càng nhiều Artist nhận được.">
                <div role="radiogroup" aria-label="Mức giá" className={cn("grid gap-3", variant.tiers.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2")}>
                  {variant.tiers.map((t, i) => (
                    <Option key={t} title={labels[i]} trailing={`${formatPrice(t)}${heads > 1 ? "/người" : ""}`} selected={t === unit} onPick={() => setTier(t)} />
                  ))}
                </div>
              </Group>
            </>
          )}

          {stepIndex === 1 && (
            <>
              <Question ref={heading}>Khi nào bạn muốn làm?</Question>
              <DayRow days={days} today={today} value={date} onChange={setDate} />
              {openTimes.length === 0 ? (
                <p className="rounded-[var(--radius-md)] bg-surface px-4 py-3">Hôm nay đã hết giờ nhận. Bạn chọn ngày khác nhé.</p>
              ) : (
                DAY_PARTS.map((part) => {
                  const times = openTimes.filter((t) => t >= part.from && t < part.to)
                  if (!times.length) return null
                  return (
                    <div key={part.label}>
                      <p className="mb-3 font-semibold text-ink-soft">{part.label}</p>
                      <div role="radiogroup" aria-label={`Giờ buổi ${part.label.toLowerCase()}`} className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                        {times.map((t) => (
                          <button
                            key={t}
                            type="button"
                            role="radio"
                            aria-checked={t === time}
                            tabIndex={t === time || (!times.includes(time) && t === times[0]) ? 0 : -1}
                            onKeyDown={(e) => moveRadio(e, () => setTime(t))}
                            onClick={() => setTime(t)}
                            className={cn("h-[52px] rounded-[var(--radius-md)] text-body font-semibold tabular-nums transition-colors", t === time ? "bg-accent text-white" : "bg-surface text-ink hover:bg-white/70")}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
              {timeOk && isUrgent(date, time) && (
                <p className="rounded-[var(--radius-md)] bg-highlight-soft px-4 py-3 text-meta">
                  Giờ hẹn trong vòng {POLICY.urgentWithinHours} giờ tới có thêm phí đặt gấp {formatPrice(POLICY.urgentFee)}.
                </p>
              )}
            </>
          )}

          {stepIndex === 2 && (
            <>
              <Question ref={heading}>Artist đến đâu?</Question>
              <div>
                {state.addresses.length > 0 && (
                  <div role="radiogroup" aria-label="Địa chỉ" className="space-y-3">
                    {state.addresses.map((a) => (
                      <Option
                        key={a.id}
                        title={a.label || "Địa chỉ"}
                        note={addressLine(a)}
                        selected={a.id === addressId && !addingAddress}
                        onPick={() => {
                          setAddressId(a.id)
                          setAddingAddress(false)
                        }}
                      />
                    ))}
                  </div>
                )}
                {!session ? (
                  <p className="rounded-[var(--radius-md)] bg-surface px-4 py-4 text-ink-soft">Bạn thêm địa chỉ sau khi đăng nhập, ở bước gửi đơn.</p>
                ) : addressPart ? (
                  <NewAddressForm
                    className="mt-3 rounded-[var(--radius-lg)] border-0 p-4 md:p-5"
                    city={state.city ?? state.addresses[0]?.city ?? "Hà Nội"}
                    district={state.addresses[0]?.district}
                    onCancel={state.addresses.length ? () => setAddingAddress(false) : undefined}
                    onSaved={(id) => {
                      setAddressId(id)
                      setAddingAddress(false)
                      refresh()
                    }}
                  />
                ) : (
                  <button type="button" className={cn(softButton, "mt-3")} onClick={() => setAddingAddress(true)}>
                    <Plus className="size-4" aria-hidden /> Thêm địa chỉ khác
                  </button>
                )}
              </div>

              <Group title="Phí di chuyển tối đa" note="Artist ở xa hơn mức này sẽ không nhận được đơn.">
                <div role="radiogroup" aria-label="Phí di chuyển tối đa" className="grid gap-3 md:grid-cols-2">
                  {FEE_CHOICES.map((n) => (
                    <Option key={n} title={formatPrice(n)} selected={n === feeLimit} onPick={() => setFeeLimit(n)} />
                  ))}
                </div>
                <p className="mt-3 text-meta text-ink-soft">
                  Tổng tối đa {formatPrice(maxTotal)}, đã gồm phí di chuyển và phí đặt gấp nếu có. Chỉ Artist có cùng mức giá, đủ điều kiện và không vượt tổng này mới nhận được.
                </p>
              </Group>
            </>
          )}

          {stepIndex === 3 && (
            <>
              <Question ref={heading}>Xem lại đơn của bạn</Question>
              <div className="rounded-[var(--radius-lg)] bg-surface px-4 md:px-5">
                <SummaryRow label="Dịch vụ" value={`${tpl.name}, ${variant.label}${heads > 1 ? `, ${heads} người` : ""}`} onEdit={() => goTo(0)} />
                <SummaryRow label="Mức giá" value={`${tierLabel} · ${formatPrice(unit * heads)}`} onEdit={() => goTo(0)} />
                <SummaryRow label="Thời gian" value={`${time}, ${formatDateLong(date)}`} onEdit={() => goTo(1)} />
                <SummaryRow label="Địa chỉ" value={chosenAddress ? addressLine(chosenAddress) : session ? "Chưa có, thêm địa chỉ để gửi đơn" : "Thêm sau khi đăng nhập"} onEdit={() => goTo(2)} />
                <SummaryRow label="Phí di chuyển tối đa" value={formatPrice(feeLimit)} onEdit={() => goTo(2)} last />
              </div>

              {!timeOk && (
                <p role="alert" className="rounded-[var(--radius-md)] bg-warning-soft px-4 py-3 text-meta text-warning">
                  Giờ này đã qua. Bạn chọn lại thời gian nhé.
                </p>
              )}
              {nobodyHere && <p className="rounded-[var(--radius-md)] bg-highlight-soft px-4 py-3 text-meta">Khu vực này chưa có Artist nhận dịch vụ này ở mức giá đã chọn, có thể phải chờ lâu.</p>}

              <Group title="Thêm cho Artist">
                <label className="block">
                  <span className="sr-only">Mô tả thêm</span>
                  <textarea
                    className={cn(inputClass, "min-h-[108px] resize-none border-transparent")}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="VD: da hơi dầu, muốn makeup trong trẻo, bền đến tối… (không bắt buộc)"
                    maxLength={300}
                  />
                </label>
                <p className="mt-2 text-meta text-muted">{requestCopy.vi.privacy}</p>
                <p className="mb-2 mt-4 font-semibold">Ảnh mẫu (không bắt buộc, tối đa 3)</p>
                <p className="mb-3 text-meta text-muted">Tone makeup, kiểu tóc, mẫu nail bạn muốn. Artist xem trước khi nhận đơn.</p>
                {session ? <ReferenceUpload value={refs} onChange={setRefs} onError={setError} /> : <p className="text-meta text-ink-soft">Bạn thêm ảnh mẫu được sau khi đăng nhập.</p>}
              </Group>

              {needsConductNote(category) && <ConductNote className="border-0" />}

              <p className="text-meta text-muted">
                360đẹp báo cho mọi Artist phù hợp quanh bạn, ai nhận trước sẽ làm với giá này. Tổng tối đa {formatPrice(maxTotal)}, đã gồm phí di chuyển và phí đặt gấp nếu có. Giờ hẹn trong vòng {POLICY.urgentWithinHours} giờ tới có phí đặt gấp. Không mất phí đăng; trả tiền mặt hoặc chuyển khoản cho Artist sau khi xong, không cần đặt cọc.
              </p>

              {error && (
                <p role="alert" className="rounded-[var(--radius-md)] bg-danger-soft px-4 py-3 text-danger">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stays beside the questions on a wide screen. */}
      <aside className="hidden lg:block">
        <div className="sticky top-[100px] overflow-hidden rounded-[var(--radius-xl)] bg-surface">
          <div className="relative h-[170px] bg-subtle">
            <Image src={categoryPhoto(category, 1)} alt="" fill priority sizes="380px" className="object-cover" />
            <IllustrationBadge className="left-3 top-3" />
          </div>
          <div className="p-6">
            <p className="text-[22px] font-bold leading-tight tracking-[-0.02em]">{tpl.name}</p>
            <p className="mt-3 text-ink-soft">
              {variant.label}, {formatDuration(serviceDuration(variant, heads))}
              {heads > 1 ? `, ${heads} người` : ""}
            </p>
            <p className="mt-0.5 text-ink-soft">{variant.tiers.length === 1 ? tierLabel : `Mức ${tierLabel}`}</p>
            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-4">
              <span className="text-ink-soft">Giá dịch vụ</span>
              <span className="text-[26px] font-bold tabular-nums leading-tight tracking-[-0.02em] text-accent-dark">{formatPrice(unit * heads)}</span>
            </div>
            <p className="mt-1.5 text-meta text-muted">{heads > 1 ? `${formatPrice(unit)} × ${heads} người, chưa gồm phí di chuyển` : "Chưa gồm phí di chuyển"}</p>
            <button type="button" className={cn(cta, "mt-5 w-full")} disabled={primaryDisabled} onClick={primary}>
              {primaryLabel}
            </button>
          </div>
        </div>
      </aside>

      {/* The same card, down to one bar, on a phone. */}
      <div className="roomy pb-safe fixed inset-x-0 bottom-0 z-40 bg-surface shadow-[0_-8px_24px_-16px_rgb(28_24_18/0.25)] lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="whitespace-nowrap text-[22px] font-bold leading-tight tabular-nums tracking-[-0.02em] text-accent-dark">{formatPrice(unit * heads)}</p>
            <p className="text-meta leading-tight text-muted">{heads > 1 ? `${formatPrice(unit)} × ${heads} người, chưa gồm phí di chuyển` : "Chưa gồm phí di chuyển"}</p>
          </div>
          <button type="button" className={cn(cta, "shrink-0 px-4")} disabled={primaryDisabled} onClick={primary}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const Question = React.forwardRef<HTMLHeadingElement, { children: React.ReactNode }>(function Question({ children }, ref) {
  return (
    <h1 ref={ref} tabIndex={-1} className="text-[30px] font-bold leading-[1.15] tracking-[-0.03em] outline-none md:text-[38px]">
      {children}
    </h1>
  )
})

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[20px] font-bold tracking-[-0.02em]">{title}</h2>
      {note && <p className="mt-1 text-meta text-muted">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** One choice on its own row, tall enough to breathe; the ring and the tick say which is chosen. */
function Option({ title, note, trailing, selected, onPick }: { title: string; note?: string; trailing?: string; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onKeyDown={(e) => moveRadio(e, onPick)}
      onClick={onPick}
      className={cn("flex min-h-16 w-full items-center gap-3 rounded-[var(--radius-md)] bg-surface px-4 py-3 text-left transition-shadow", selected ? "ring-2 ring-inset ring-accent" : "hover:shadow-[var(--shadow-soft)]")}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{title}</span>
        {note && <span className="mt-0.5 block text-meta text-ink-soft">{note}</span>}
        {trailing && <span className={cn("mt-0.5 block font-bold tabular-nums", selected ? "text-accent-dark" : "text-ink")}>{trailing}</span>}
      </span>
      <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", selected ? "bg-accent text-white" : "shadow-[inset_0_0_0_1.5px_var(--color-line)]")}>
        {selected && <Check className="size-3.5 stroke-[3]" />}
      </span>
    </button>
  )
}

function SummaryRow({ label, value, onEdit, last }: { label: string; value: string; onEdit: () => void; last?: boolean }) {
  return (
    <button type="button" onClick={onEdit} aria-label={`${label}: ${value}. Sửa`} className={cn("flex min-h-[60px] w-full items-center gap-3 py-3.5 text-left", !last && "border-b border-line")}>
      <span className="min-w-0 flex-1">
        <span className="block text-meta text-muted">{label}</span>
        <span className="block font-medium">{value}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
    </button>
  )
}

/** Where they are: done steps go back when tapped, the one in hand is rose. A phone keeps only its name. */
function StepIndicator({ index, onPick, onBack }: { index: number; onPick: (i: number) => void; onBack: () => void }) {
  return (
    <nav aria-label={`Bước ${index + 1} trên ${STEPS.length}`} className="flex items-center gap-2 md:gap-0">
      <button type="button" aria-label="Quay lại" onClick={onBack} className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-subtle lg:hidden">
        <ChevronLeft className="size-6" aria-hidden />
      </button>
      <ol className="flex min-w-0 flex-1 items-center">
        {STEPS.map((s, i) => {
          const done = i < index
          const current = i === index
          const inner = (
            <>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-meta font-bold",
                  done && "bg-accent-soft text-accent-dark",
                  current && "bg-accent text-white",
                  !done && !current && "bg-surface text-muted",
                )}
              >
                {done ? <Check className="size-4 stroke-[2.5]" aria-hidden /> : i + 1}
              </span>
              <span className={cn("truncate text-[16px]", current ? "font-bold text-ink" : done ? "hidden font-semibold text-ink md:inline" : "hidden font-medium text-muted md:inline")}>{s.label}</span>
            </>
          )
          return (
            <li key={s.id} aria-current={current ? "step" : undefined} className={cn("flex min-w-0 items-center", i < STEPS.length - 1 && "flex-auto")}>
              {done ? (
                <button type="button" onClick={() => onPick(i)} aria-label={`Quay lại bước ${s.label}`} className="flex min-h-11 shrink-0 items-center gap-2.5">
                  {inner}
                </button>
              ) : (
                <span className="flex min-h-11 min-w-0 items-center gap-2 md:gap-2.5">{inner}</span>
              )}
              {i < STEPS.length - 1 && <span aria-hidden className="mx-1 h-0.5 min-w-2 flex-1 rounded-full bg-line md:mx-3.5 md:min-w-3" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Three weeks of days, sideways. Seven fit at a time; the arrows are for a mouse, a finger just swipes. */
function DayRow({ days, today, value, onChange }: { days: string[]; today: string; value: string; onChange: (d: string) => void }) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const page = (direction: 1 | -1) => scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth, behavior: "smooth" })
  // Back on this step with a day further out: start where it is.
  const [startDay] = React.useState(value)
  React.useEffect(() => {
    const box = scroller.current
    const chosen = box?.querySelector<HTMLElement>(`[data-day="${startDay}"]`)
    if (box && chosen) box.scrollLeft = Math.max(0, chosen.offsetLeft - box.offsetLeft - (box.clientWidth - chosen.offsetWidth) / 2)
  }, [startDay])
  return (
    <div>
      <div
        ref={scroller}
        role="radiogroup"
        aria-label="Ngày"
        className="no-scrollbar -mx-4 grid snap-x scroll-px-4 auto-cols-[76px] grid-flow-col gap-2.5 overflow-x-auto px-4 md:mx-0 md:scroll-px-0 md:auto-cols-[calc((100%-72px)/7)] md:gap-3 md:px-0"
      >
        {days.map((d) => {
          const selected = d === value
          return (
            <button
              key={d}
              data-day={d}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={formatDateLong(d)}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(e) => moveRadio(e, () => onChange(d))}
              onClick={() => onChange(d)}
              className={cn("flex h-[78px] snap-start flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] transition-colors", selected ? "bg-accent text-white" : "bg-surface text-ink hover:bg-white/70")}
            >
              <span className={cn("text-meta", selected ? "text-white" : "text-muted")}>{d === today ? "Nay" : weekdayShort(d)}</span>
              <span className="text-[22px] font-bold leading-none tabular-nums">{Number(d.slice(8))}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-meta text-ink-soft">{formatDateLong(value)}</p>
        <div className="hidden gap-2 md:flex">
          <button type="button" aria-label="Những ngày trước" onClick={() => page(-1)} className="inline-flex size-11 items-center justify-center rounded-full bg-surface hover:bg-white/70">
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button type="button" aria-label="Những ngày sau" onClick={() => page(1)} className="inline-flex size-11 items-center justify-center rounded-full bg-surface hover:bg-white/70">
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
