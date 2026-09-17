"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Car, Check, CheckCircle2, Clock, CreditCard, HandCoins, Home, Info, Store, Zap } from "lucide-react"
import { PriceBreakdown } from "@/components/price-breakdown"
import { TierBadge, VerifiedMark } from "@/components/trust"
import { Avatar, BottomBar, Button, ButtonLink, Card, EmptyState, PageHeader, Skeleton, inputClass } from "@/components/ui"
import { getTemplate } from "@/lib/catalog"
import { DEMO_PRO_ID } from "@/lib/data"
import { CITIES, districtsOf } from "@/lib/geo"
import { POLICY, isTooSoon, isUrgent } from "@/lib/pricing"
import {
  TIME_SLOTS,
  actions,
  homeAvailability,
  priceOf,
  proView,
  quoteFor,
  servicesOf,
  takenSlots,
  useApp,
  useHydrated,
} from "@/lib/store"
import { tierOf } from "@/lib/trust"
import type { CustomerAddress, PaymentMethod, PriceQuote } from "@/lib/types"
import { addDays, addMinutes, cn, formatDateLong, formatDuration, formatPrice, parseISODate, todayISO, weekdayShort } from "@/lib/utils"

const STEPS = ["Dịch vụ", "Thời gian", "Xác nhận"]

export default function BookPage() {
  return (
    <Suspense>
      <BookGate />
    </Suspense>
  )
}

function BookGate() {
  const hydrated = useHydrated()
  const { proId } = useParams<{ proId: string }>()
  const state = useApp()
  const pro = proView(state, proId)

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-16">
        <Skeleton className="h-10" />
        <Skeleton className="h-28" />
        <Skeleton className="h-56" />
      </div>
    )
  }
  if (!pro || !servicesOf(state, proId).length) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader back title="Đặt lịch" />
        <EmptyState title="Chuyên viên chưa nhận đặt lịch" action={<ButtonLink href="/">Về trang khám phá</ButtonLink>} />
      </div>
    )
  }
  return <BookingFlow proId={proId} />
}

function BookingFlow({ proId }: { proId: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const state = useApp()
  const pro = proView(state, proId)!
  const services = servicesOf(state, proId)
  const isOwnProfile = state.session?.role === "pro" && state.session.proId === pro.id
  const paused = pro.id === DEMO_PRO_ID && !state.acceptingJobs

  const initialService = services.find((s) => s.templateId === params.get("service")) ?? services[0]
  const initialVariant =
    params.get("variant") && initialService.prices[params.get("variant")!] !== undefined
      ? params.get("variant")!
      : Object.keys(initialService.prices)[0]

  const [step, setStep] = React.useState(1)
  const [templateId, setTemplateId] = React.useState(initialService.templateId)
  const [variantId, setVariantId] = React.useState(initialVariant)
  const [date, setDate] = React.useState(addDays(todayISO(), 1))
  const [time, setTime] = React.useState<string | null>(null)
  const [address, setAddress] = React.useState<CustomerAddress>(state.customerAddress)
  const [note, setNote] = React.useState("")
  const [payment, setPayment] = React.useState<PaymentMethod>("online")
  const [error, setError] = React.useState<string | null>(null)
  const [doneId, setDoneId] = React.useState<string | null>(null)

  const tpl = getTemplate(templateId)!
  const variant = tpl.variants.find((v) => v.id === variantId)!
  const price = priceOf(state, proId, templateId, variantId)!
  const home = homeAvailability(state, proId, templateId, address)
  const canStudio = Boolean(pro.studioAddress)
  const [atHomePref, setAtHome] = React.useState(true)
  const atHome = home.ok && (atHomePref || !canStudio)
  const locationOk = atHome || canStudio

  const days = Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i))
  const taken = takenSlots(state, pro.id, date)
  const quote: PriceQuote | null = time ? quoteFor(state, { proId, price, atHome, address, date, time }) : null

  const canNext = step === 1 ? true : step === 2 ? Boolean(time) : locationOk && (!atHome || address.detail.trim().length >= 3)

  const submit = () => {
    setError(null)
    if (!state.session) {
      router.push(`/login?next=${encodeURIComponent(`/book/${proId}?service=${templateId}&variant=${variantId}`)}`)
      return
    }
    const res = actions.createBooking({ proId, templateId, variantId, date, time: time!, atHome, address, note: note.trim(), paymentMethod: payment })
    if ("error" in res) setError(res.error)
    else setDoneId(res.id)
  }

  if (doneId) {
    return (
      <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-10" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Đã gửi yêu cầu đặt lịch</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {pro.name} sẽ gọi cho bạn qua số {state.session?.phone} để xác nhận lịch {time} · {formatDateLong(date)}, thường trong ~{pro.stats.responseMinutes} phút. Nếu không được xác nhận trong{" "}
          {POLICY.confirmWithinHours} giờ, lịch tự huỷ{payment === "online" ? " và tiền được hoàn 100%" : ""}.
        </p>
        <div className="mt-8 grid w-full gap-2">
          <ButtonLink href={`/bookings/${doneId}`} size="lg">
            Xem lịch hẹn
          </ButtonLink>
          <ButtonLink href="/" variant="ghost">
            Về trang khám phá
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={step === 3 ? "Xác nhận đặt lịch" : "Đặt lịch"} back onBack={step > 1 ? () => setStep((s) => s - 1) : undefined} />

      <Stepper step={step} onJump={(s) => s < step && setStep(s)} />

      <Card className="mb-4 flex items-center gap-3 p-3">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={44} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            {pro.name} <VerifiedMark pro={pro} /> <TierBadge tier={tierOf(pro)} />
          </p>
          <p className="text-xs text-muted">
            ★ {pro.rating.average.toFixed(1)} ({pro.rating.count}) · {pro.stats.completedJobs} job · đúng giờ {Math.round(pro.stats.onTimeRate * 100)}%
          </p>
        </div>
      </Card>

      {(isOwnProfile || paused) && (
        <p className="mb-4 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
          {isOwnProfile
            ? "Bạn đang xem dịch vụ của chính mình ở chế độ freelancer. Chuyển sang chế độ đặt lịch để thử luồng khách hàng."
            : `${pro.name} đang tạm nghỉ nhận lịch mới. Bạn có thể đăng yêu cầu để freelancer khác báo giá.`}
        </p>
      )}

      {step === 1 && (
        <section>
          <h2 className="mb-3 font-semibold">Chọn dịch vụ & gói</h2>
          <ul className="space-y-2.5">
            {services.map((s) => {
              const t = getTemplate(s.templateId)!
              const selected = s.templateId === templateId
              const offered = t.variants.filter((v) => s.prices[v.id] !== undefined)
              return (
                <li key={s.id}>
                  <div
                    className={cn(
                      "rounded-2xl border bg-surface p-3.5 transition-colors",
                      selected ? "border-rose ring-1 ring-rose" : "border-line",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateId(s.templateId)
                        setVariantId(offered[0].id)
                      }}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{t.name}</span>
                        <span className="block truncate text-xs text-muted">{t.description}</span>
                      </span>
                      <span className="text-sm text-ink-soft">từ {formatPrice(Math.min(...Object.values(s.prices)))}</span>
                      <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-rose bg-rose text-white" : "border-line")}>
                        {selected && <Check className="size-3.5" />}
                      </span>
                    </button>
                    {selected && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {offered.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            aria-pressed={v.id === variantId}
                            onClick={() => setVariantId(v.id)}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-left text-[13px]",
                              v.id === variantId ? "border-rose bg-blush text-rose-dark" : "border-line bg-canvas text-ink-soft",
                            )}
                          >
                            <span className="block font-medium">{v.label}</span>
                            <span className="block text-xs">
                              {formatPrice(s.prices[v.id])} · {formatDuration(v.durationMin)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {step === 2 && (
        <>
          <ServiceSummary name={tpl.name} variant={variant.label} price={price} duration={variant.durationMin} />

          <section className="mt-6">
            <h2 className="mb-3 flex items-baseline justify-between font-semibold">
              Chọn ngày
              <span className="text-xs font-normal text-muted">Tháng {parseISODate(date).getMonth() + 1}</span>
            </h2>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              {days.map((d) => {
                const active = d === date
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setDate(d)
                      setTime(null)
                    }}
                    className={cn(
                      "flex w-12 shrink-0 flex-col items-center gap-1.5 rounded-xl border py-2.5 text-sm transition-colors",
                      active ? "border-rose bg-blush text-rose-dark" : "border-transparent text-ink-soft hover:bg-surface",
                    )}
                  >
                    <span className="text-[11px] text-muted">{d === todayISO() ? "Nay" : weekdayShort(d)}</span>
                    <span className={cn("font-medium", active && "font-semibold")}>{parseISODate(d).getDate()}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-semibold">Chọn khung giờ</h2>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              {TIME_SLOTS.map((slot) => {
                const disabled = taken.has(slot) || isTooSoon(date, slot)
                const urgent = !disabled && isUrgent(date, slot)
                const active = slot === time
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    onClick={() => setTime(slot)}
                    className={cn(
                      "relative h-12 rounded-xl border text-sm transition-colors",
                      active ? "border-rose bg-blush font-semibold text-rose-dark" : "border-line bg-surface text-ink hover:border-blush-strong",
                      disabled && "cursor-not-allowed border-transparent bg-canvas text-muted/60 line-through",
                    )}
                  >
                    {slot}
                    {urgent && (
                      <span className="absolute -right-1 -top-2 inline-flex items-center gap-0.5 rounded-full bg-warning px-1.5 py-0.5 text-[9.5px] font-semibold text-white">
                        <Zap className="size-2.5" />
                        Gấp
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              Gạch ngang: {pro.name} đã có lịch hoặc còn dưới {POLICY.minLeadMinutes} phút. Khung giờ bắt đầu trong vòng {POLICY.urgentWithinHours} giờ tính phí đặt gấp{" "}
              {formatPrice(POLICY.urgentFee)} để chuyên viên đặt xe tới kịp.
            </p>
          </section>
        </>
      )}

      {step === 3 && time && quote && (
        <section className="space-y-4">
          <ServiceSummary name={tpl.name} variant={variant.label} price={price} duration={variant.durationMin} />

          <Card className="divide-y divide-line px-4">
            <div className="flex gap-4 py-3.5 text-sm">
              <span className="w-20 shrink-0 text-[13px] text-muted">Thời gian</span>
              <span className="flex-1 font-medium">
                {formatDateLong(date, true)}
                <br />
                {time} - {addMinutes(time, variant.durationMin)}
                {quote.urgentFee > 0 && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-warning-soft px-1.5 py-0.5 text-[11px] font-semibold text-warning">
                    <Zap className="size-3" /> Đặt gấp
                  </span>
                )}
              </span>
            </div>

            <div className="py-3.5">
              <p className="mb-2 text-[13px] text-muted">Địa điểm</p>
              <div className="grid grid-cols-2 gap-2">
                <PlaceOption active={atHome} disabled={!home.ok} onClick={() => setAtHome(true)} icon={<Home className="size-4" />}>
                  Làm tại nhà
                </PlaceOption>
                <PlaceOption active={!atHome && canStudio} disabled={!canStudio} onClick={() => setAtHome(false)} icon={<Store className="size-4" />}>
                  Tại studio
                </PlaceOption>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <select
                  aria-label="Tỉnh/thành"
                  className={cn(inputClass, "text-sm")}
                  value={address.city}
                  onChange={(e) => setAddress({ city: e.target.value, district: districtsOf(e.target.value)[0], detail: address.detail })}
                >
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select
                  aria-label="Quận/huyện"
                  className={cn(inputClass, "text-sm")}
                  value={address.district}
                  onChange={(e) => setAddress({ ...address, district: e.target.value })}
                >
                  {districtsOf(address.city).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              {atHome && (
                <input
                  aria-label="Số nhà, đường"
                  placeholder="Số nhà, ngõ, đường, toà nhà"
                  className={cn(inputClass, "mt-2 text-sm")}
                  value={address.detail}
                  onChange={(e) => setAddress({ ...address, detail: e.target.value })}
                />
              )}

              {!home.ok && <p className="mt-2 text-xs text-warning">{home.reason}{canStudio ? " Bạn có thể đến studio." : ""}</p>}
              {atHome && quote.distanceKm !== null && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                  <Car className="size-3.5" />
                  Khoảng cách ước tính ~{quote.distanceKm.toLocaleString("vi-VN")} km từ {pro.district}.
                  {quote.travelFee === 0 ? " Miễn phí di chuyển." : ` Phí di chuyển ${formatPrice(quote.travelFee)}.`}
                </p>
              )}
              {!atHome && canStudio && <p className="mt-2 text-sm text-ink-soft">Studio: {pro.studioAddress}</p>}
            </div>

            <div className="py-3.5">
              <label className="text-[13px] text-muted" htmlFor="note">
                Ghi chú cho chuyên viên
              </label>
              <textarea
                id="note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: muốn làm giống mẫu milky, có thú cưng trong nhà, gửi xe ở hầm B1…"
                className={cn(inputClass, "mt-2 resize-none text-sm")}
              />
            </div>
          </Card>

          <Card className="p-4">
            <p className="mb-2 text-[13px] text-muted">Thanh toán</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["online", "Thanh toán online toàn bộ", "MoMo, ZaloPay, thẻ. Hoàn 100% nếu chuyên viên không nhận.", CreditCard],
                  ["cash", "Trả trực tiếp sau khi làm", "Tiền mặt hoặc chuyển khoản cho chuyên viên.", HandCoins],
                ] as const
              ).map(([value, label, hint, Icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={payment === value}
                  onClick={() => setPayment(value)}
                  className={cn(
                    "flex gap-2.5 rounded-xl border p-3 text-left",
                    payment === value ? "border-rose bg-blush" : "border-line bg-surface",
                  )}
                >
                  <Icon className={cn("mt-0.5 size-4 shrink-0", payment === value ? "text-rose" : "text-muted")} />
                  <span>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-muted">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <PriceBreakdown quote={quote} paymentMethod={payment} />

          <p className="flex gap-2 text-xs text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Không cần đặt cọc. {pro.name} sẽ gọi điện xác nhận trước khi nhận job. Huỷ miễn phí trước {POLICY.freeCancelHours} giờ
              {payment === "online" ? "; tiền online do dep360 giữ và chỉ chuyển cho chuyên viên sau khi hoàn thành" : ""}.{" "}
              <Link href="/me/policy" className="text-rose underline underline-offset-2">
                Chính sách phí
              </Link>
            </span>
          </p>
          {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
        </section>
      )}

      <BottomBar>
        <div className="flex items-center gap-3">
          {step === 3 && quote && (
            <div className="shrink-0">
              <p className="text-[11px] text-muted">Tổng</p>
              <p className="font-semibold">{formatPrice(quote.total)}</p>
            </div>
          )}
          {step > 1 && (
            <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} className="hidden md:inline-flex md:w-40">
              Quay lại
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1"
            disabled={!canNext || isOwnProfile || paused}
            onClick={() => (step < 3 ? setStep((s) => s + 1) : submit())}
          >
            {step < 3 ? "Tiếp tục" : !state.session ? "Đăng nhập để đặt lịch" : payment === "online" ? "Thanh toán & gửi yêu cầu" : "Gửi yêu cầu đặt lịch"}
          </Button>
        </div>
      </BottomBar>
    </div>
  )
}

function Stepper({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  return (
    <ol className="mb-5 flex items-start">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center">
            {i > 0 && <span className={cn("absolute right-1/2 top-3.5 h-px w-full", n <= step ? "bg-rose" : "bg-line")} />}
            <button
              type="button"
              onClick={() => onJump(n)}
              className={cn("relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-semibold", active || done ? "bg-rose text-white" : "bg-line text-muted")}
            >
              {done ? <Check className="size-3.5" /> : n}
            </button>
            <span className={cn("mt-1.5 text-xs", active ? "font-medium text-ink" : "text-muted")}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function ServiceSummary({ name, variant, price, duration }: { name: string; variant: string; price: number; duration: number }) {
  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="font-semibold">{name}</p>
        <p className="flex items-center gap-1 text-sm text-ink-soft">
          {variant} · <Clock className="size-3.5" /> {formatDuration(duration)}
        </p>
      </div>
      <p className="shrink-0 text-lg font-semibold">{formatPrice(price)}</p>
    </Card>
  )
}

function PlaceOption({
  active,
  disabled,
  onClick,
  icon,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-center gap-2 rounded-xl border text-sm transition-colors disabled:opacity-40",
        active ? "border-rose bg-blush font-medium text-rose-dark" : "border-line text-ink-soft",
      )}
    >
      {icon}
      {children}
    </button>
  )
}
