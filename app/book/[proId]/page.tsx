"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { CalendarX2, Car, Check, CheckCircle2, Clock, CreditCard, HandCoins, Home, Info, Link2, MapPin, Phone, Store, Zap } from "lucide-react"
import { AddressPicker, defaultAddressId } from "@/components/address-picker"
import { PriceBreakdown } from "@/components/price-breakdown"
import { VerifiedMark } from "@/components/trust"
import { Avatar, BottomBar, Button, ButtonLink, Card, EmptyState, PageHeader, Skeleton, inputClass, PageSkeleton } from "@/components/ui"
import { getTemplate, getVertical, verticalOf } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import { formatPhone } from "@/lib/auth/phone"
import { CITIES, districtsOf, travelDistanceKm } from "@/lib/geo"
import { POLICY, buildQuote, isUrgent } from "@/lib/pricing"
import { getPro, homeAvailability, priceOf, proView, servicesOf, useApp } from "@/lib/store"
import { ComboSuggestions } from "@/components/combo"
import type { CustomerAddress, PaymentMethod, PriceQuote, UsageScope } from "@/lib/types"
import {
  addDays,
  addMinutes,
  cn,
  formatDateLong,
  formatDuration,
  formatPrice,
  formatResponseTime,
  ratingText,
  localDate,
  localTime,
  parseISODate,
  toTimestamptz,
  todayISO,
  weekdayShort,
} from "@/lib/utils"

const STEPS = ["Dịch vụ", "Nơi & giờ", "Xác nhận"]

export default function BookPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BookGate />
    </Suspense>
  )
}

function BookGate() {
  const { proId } = useParams<{ proId: string }>()
  const state = useApp()
  const pro = proView(state, proId)

  if (!pro || !servicesOf(state, proId).length) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader back title="Đặt lịch" />
        <EmptyState title="Người làm này chưa nhận đặt lịch" action={<ButtonLink href="/">Về trang khám phá</ButtonLink>} />
      </div>
    )
  }
  return <BookingFlow proId={proId} />
}

/** A date the form can offer: today or one of the next 13 days. */
function bookableDate(raw: string | null) {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const today = todayISO()
  return raw >= today && raw <= addDays(today, 13) ? raw : null
}

/** "22:00 24/09": the last moment a booking can be cancelled for free. */
function freeCancelUntil(date: string, time: string) {
  const until = new Date(Date.parse(toTimestamptz(date, time)) - POLICY.freeCancelHours * 3_600_000).toISOString()
  const [, m, d] = localDate(until).split("-")
  return { passed: Date.parse(until) <= Date.now(), label: `${localTime(until)} ${d}/${m}` }
}

function BookingFlow({ proId }: { proId: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const state = useApp()
  const { session } = state
  const pro = proView(state, proId)!
  const services = servicesOf(state, proId)
  const isOwnProfile = session?.proId === pro.id
  const paused = !pro.acceptingJobs

  const initialService = services.find((s) => s.templateId === params.get("service")) ?? services[0]
  const initialVariant =
    params.get("variant") && initialService.prices[params.get("variant")!] !== undefined
      ? params.get("variant")!
      : Object.keys(initialService.prices)[0]

  // "Đặt chung một buổi": this booking joins one the customer already made.
  const partner = state.bookings.find(
    (b) => b.id === params.get("cung") && b.mine && (b.status === "pending" || b.status === "confirmed"),
  )
  const partnerPro = partner ? getPro(state, partner.proId) : undefined

  // A visitor who chose everything before signing in comes back through the
  // login page with the choices in the URL (see resumeUrl below).
  const restoredDate = bookableDate(params.get("date"))
  const restoredTime = /^\d{2}:\d{2}$/.test(params.get("time") ?? "") ? params.get("time") : null
  const restoredArea = (() => {
    const c = params.get("city")
    const d = params.get("district")
    return c && d && districtsOf(c).includes(d) ? { city: c, district: d } : null
  })()

  const [templateId, setTemplateId] = React.useState(initialService.templateId)
  const [variantId, setVariantId] = React.useState(initialVariant)
  const [date, setDate] = React.useState(partner?.date ?? restoredDate ?? addDays(todayISO(), 1))
  const [pickedTime, setTime] = React.useState<string | null>(partner?.time ?? (restoredDate ? restoredTime : null))
  const [usageScope, setUsageScope] = React.useState<UsageScope>(params.get("usage") === "commercial" ? "commercial" : "personal")
  const [consentRepost, setConsentRepost] = React.useState(params.get("repost") === "1")
  const [linkError, setLinkError] = React.useState<string | null>(null)
  const [quantity, setQuantity] = React.useState(() => Math.max(1, Number(params.get("qty")) || 1))
  const [pickedAddress, setAddressId] = React.useState<string | null>(null)
  // Signed out there is no saved address yet: a district is enough to estimate
  // the travel fee. The real address is saved after signing in.
  const [area, setArea] = React.useState<{ city: string; district: string }>(restoredArea ?? { city: pro.city, district: "" })
  const [note, setNote] = React.useState(params.get("note") ?? "")
  const [payment, setPayment] = React.useState<PaymentMethod>("cash")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [doneId, setDoneId] = React.useState<string | null>(null)
  const [atHomePref, setAtHome] = React.useState(params.get("place") !== "studio")

  const tpl = getTemplate(templateId)!
  const variant = tpl.variants.find((v) => v.id === variantId)!
  const unitPrice = priceOf(state, proId, templateId, variantId)!
  // A per-head option is priced and timed per person, so the head count changes
  // both the total and how long the freelancer is booked for.
  const heads = variant.perPerson ? Math.min(Math.max(quantity, 1), variant.maxQuantity ?? 1) : 1
  const price = unitPrice * heads
  const durationMin = variant.durationMin * heads
  const canStudio = Boolean(pro.studioAddress)
  const atHome = !tpl.studioOnly && (atHomePref || !canStudio)

  // Start on the customer's default address without an effect writing it back.
  const addressId = session ? (pickedAddress ?? defaultAddressId(state.addresses)) : null
  const chosen = state.addresses.find((a) => a.id === addressId) ?? null
  const address: CustomerAddress | null = session
    ? chosen && { city: chosen.city, district: chosen.district, detail: chosen.detail }
    : area.district
      ? { city: area.city, district: area.district, detail: "" }
      : null
  const home = homeAvailability(state, proId, templateId, address ?? { city: pro.city, district: pro.district, detail: "" })
  const locationOk = atHome ? home.ok && Boolean(address) : canStudio

  // Back from signing in with everything chosen: straight to the summary,
  // unless the address still has to be saved.
  const [step, setStep] = React.useState(() => (restoredDate && restoredTime && !partner ? (atHome && !address ? 2 : 3) : 1))

  // Each step starts at its top, not where the last one was scrolled to.
  React.useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const days = Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i))

  // The freelancer's real openings for this day, from their working hours. The
  // answer is tagged with what was asked, so a stale reply is simply ignored
  // rather than having to be cleared from state first. Works signed out too:
  // without an address the server measures from the freelancer's own location.
  const slotKey = [proId, templateId, variantId, heads, date, atHome, addressId].join("|")
  const [loaded, setLoaded] = React.useState<{ key: string; list: { startsAt: string; time: string }[] } | null>(null)
  React.useEffect(() => {
    let live = true
    void actions
      .slotsFor({ proId, templateId, variantId, quantity: heads, date, atHome, addressId })
      .then((list) => live && setLoaded({ key: slotKey, list }))
    return () => {
      live = false
    }
  }, [slotKey, proId, templateId, variantId, heads, date, atHome, addressId])
  const slots = loaded?.key === slotKey ? loaded.list : null

  // A time picked for another day, service or address may no longer be on offer.
  const time = slots && pickedTime && !slots.some((s) => s.time === pickedTime) ? null : pickedTime
  const lostTime = Boolean(slots && pickedTime && !time)

  // The same arithmetic as the server (lib/pricing.ts), shown as it changes.
  const quote: PriceQuote = buildQuote({
    servicePrice: price,
    atHome,
    distanceKm: atHome && address ? travelDistanceKm(pro.city, pro.district, address.city, address.district) : null,
    urgent: time ? isUrgent(date, time) : false,
  })
  const ready = Boolean(time) && locationOk
  const canNext = step === 1 ? true : ready

  // Everything chosen so far, so signing in does not start the booking over.
  const resumeUrl = () => {
    const q = new URLSearchParams({ service: templateId, variant: variantId, date })
    if (time) q.set("time", time)
    if (heads > 1) q.set("qty", String(heads))
    if (note.trim()) q.set("note", note.trim().slice(0, 500))
    if (!atHome) q.set("place", "studio")
    if (atHome && area.district) {
      q.set("city", area.city)
      q.set("district", area.district)
    }
    if (usageScope === "commercial") q.set("usage", "commercial")
    if (consentRepost) q.set("repost", "1")
    return `/book/${proId}?${q}`
  }

  const submit = async () => {
    setError(null)
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(resumeUrl())}`)
      return
    }
    setBusy(true)
    const res = await actions.createBooking({
      proId,
      templateId,
      variantId,
      date,
      time: time!,
      atHome,
      addressId: atHome ? addressId : null,
      quantity: heads,
      note: note.trim(),
      paymentMethod: payment,
    })
    if ("error" in res) {
      setBusy(false)
      setError(res.error)
      return
    }
    // The booking exists either way; these only add to it, so a failure is
    // reported on the confirmation screen rather than undoing the booking.
    if (usageScope !== "personal" || consentRepost) {
      const terms = await actions.setBookingTerms(res.id, usageScope, consentRepost)
      if (terms.error) setLinkError(terms.error)
    }
    if (partner) {
      const linked = await actions.linkBookings([partner.id, res.id])
      if ("error" in linked) setLinkError(`Đã đặt lịch, nhưng chưa ghép được vào buổi chung: ${linked.error}`)
    }
    setBusy(false)
    setDoneId(res.id)
  }

  const trade = verticalOf(tpl.category)
  const person = getVertical(trade).person
  const responseTime = formatResponseTime(pro.stats.responseMinutes)
  const placeLabelText = tpl.onLocation ? "Địa điểm bạn chọn" : "Làm tại nhà"
  const variantText = heads > 1 ? `${variant.label} × ${heads} người` : variant.label

  if (doneId) {
    return (
      <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-10" />
        </span>
        <h1 className="mt-5 text-[28px] font-bold tracking-tight">Đã gửi yêu cầu đặt lịch</h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          {pro.name} xem lịch {time} · {formatDateLong(date)} và bấm nhận trong app
          {responseTime ? `, thường trong ${responseTime}` : ""}. Nhận rồi thì hai bên nhắn tin, gọi được cho nhau trong lịch hẹn.
          Nếu không được nhận trong {POLICY.confirmWithinHours} giờ, lịch tự huỷ{payment === "online" ? " và tiền được hoàn 100%" : ""}.
        </p>
        {linkError && <p className="mt-4 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[14px] text-warning">{linkError}</p>}
        {!partner && <ComboSuggestions bookingId={doneId} templateId={templateId} city={pro.city} className="mt-8 w-full text-left" />}
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

  const cancel = time ? freeCancelUntil(date, time) : null

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={step === 3 ? "Xác nhận đặt lịch" : "Đặt lịch"} back onBack={step > 1 ? () => setStep((s) => s - 1) : undefined} />

      <Stepper step={step} onJump={(s) => s < step && setStep(s)} />

      <Card className="mb-4 flex items-center gap-3 p-3">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={44} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            {pro.name} <VerifiedMark pro={pro} />
          </p>
          <p className="text-[13px] text-ink-soft">
            {pro.rating.count ? `${ratingText(pro.rating)} · ` : ""}
            {pro.stats.completedJobs > 0 ? `${pro.stats.completedJobs} lịch đã làm` : "Mới trên 360dep"}
          </p>
        </div>
      </Card>

      {partner && (
        <p className="mb-4 flex gap-2.5 rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px]">
          <Link2 className="mt-0.5 size-4 shrink-0" />
          <span>
            <b>Đặt chung buổi</b> với {partner.serviceName.toLowerCase()} của {partnerPro?.name ?? partner.proName}, {partner.time} ·{" "}
            {formatDateLong(partner.date)}. Chọn giờ bắt đầu cách giờ đó không quá 60 phút để hai lịch được ghép.
          </span>
        </p>
      )}

      {(isOwnProfile || paused) && (
        <p className="mb-4 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
          {isOwnProfile
            ? "Bạn đang xem dịch vụ của chính mình ở chế độ nhận khách. Chuyển sang chế độ đặt lịch để thử luồng khách hàng."
            : `${pro.name} đang tạm nghỉ nhận lịch mới. Bạn có thể đăng yêu cầu để người làm khác nhận việc.`}
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
                      selected ? "border-accent ring-1 ring-accent" : "border-line",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateId(s.templateId)
                        setVariantId(offered[0].id)
                        setQuantity(1)
                      }}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{t.name}</span>
                        <span className="block truncate text-xs text-muted">{t.description}</span>
                      </span>
                      <span className="text-sm text-ink-soft">từ {formatPrice(Math.min(...Object.values(s.prices)))}</span>
                      <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-accent bg-accent text-white" : "border-line-strong")}>
                        {selected && <Check className="size-3.5" />}
                      </span>
                    </button>
                    {selected && variant.perPerson && (
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
                    {selected && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {offered.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            aria-pressed={v.id === variantId}
                            onClick={() => {
                              setVariantId(v.id)
                              setQuantity(1)
                            }}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-left text-[13px]",
                              v.id === variantId ? "border-accent bg-subtle text-accent-dark" : "border-line-strong bg-surface text-ink-soft",
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
          <ServiceSummary name={tpl.name} variant={variantText} price={price} duration={durationMin} />

          {/* The place is chosen here, once: it decides the travel fee and which
              hours are free, so it comes before the time. */}
          <section className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-soft)]">
            <h2 className="mb-3 font-semibold">Làm ở đâu?</h2>
            <div className="grid grid-cols-2 gap-2">
              <PlaceOption
                active={atHome}
                disabled={tpl.studioOnly || !pro.homeService}
                onClick={() => {
                  setAtHome(true)
                  setTime(null)
                }}
                icon={tpl.onLocation ? <MapPin className="size-4" /> : <Home className="size-4" />}
              >
                {placeLabelText}
              </PlaceOption>
              <PlaceOption
                active={!atHome && canStudio}
                disabled={!canStudio}
                onClick={() => {
                  setAtHome(false)
                  setTime(null)
                }}
                icon={<Store className="size-4" />}
              >
                Tại studio
              </PlaceOption>
            </div>
            {atHome && session && (
              <div className="mt-3">
                <AddressPicker
                  value={addressId}
                  onChange={(id) => {
                    setAddressId(id)
                    setTime(null)
                  }}
                  city={restoredArea?.city ?? pro.city}
                  district={restoredArea?.district ?? pro.district}
                />
              </div>
            )}
            {atHome && !session && (
              <AreaPicker
                value={area}
                onChange={(next) => {
                  setArea(next)
                  setTime(null)
                }}
              />
            )}
            {tpl.studioOnly && <p className="mt-2 text-xs text-ink-soft">Gói dịch vụ này chỉ thực hiện tại studio.</p>}
            {atHome && address && !home.ok && (
              <p className="mt-2 text-xs text-warning">
                {home.reason}
                {canStudio ? " Bạn có thể đến studio." : ""}
              </p>
            )}
            {atHome && address && home.ok && quote.distanceKm !== null && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                <Car className="size-3.5" />
                Khoảng {quote.distanceKm.toLocaleString("vi-VN")} km từ {pro.district}.
                {quote.travelFee === 0 ? " Miễn phí di chuyển." : ` Phí di chuyển ${formatPrice(quote.travelFee)}.`}
              </p>
            )}
            {!atHome && canStudio && <p className="mt-2 text-xs text-ink-soft">Studio: {pro.studioAddress}</p>}
          </section>

          <section className="mt-6">
            <h2 className="mb-3 flex items-baseline justify-between font-semibold">
              Chọn ngày
              <span className="text-xs font-normal text-muted">Tháng {parseISODate(date).getUTCMonth() + 1}</span>
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
                      active ? "border-accent bg-subtle text-accent-dark" : "border-line-strong bg-surface text-ink hover:border-accent",
                    )}
                  >
                    <span className="text-xs text-muted">{d === todayISO() ? "Nay" : weekdayShort(d)}</span>
                    <span className={cn("font-medium", active && "font-semibold")}>{parseISODate(d).getUTCDate()}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-semibold">Chọn khung giờ</h2>
            {lostTime && (
              <p role="status" className="mb-3 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
                {pickedTime} không còn trống với lựa chọn này. Chọn giờ khác nhé.
              </p>
            )}
            {slots === null ? (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="rounded-xl bg-canvas px-3.5 py-3 text-[13px] text-ink-soft">
                {pro.name} không nhận khách hoặc đã kín lịch ngày này. Chọn ngày khác nhé.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {slots.map((slot) => {
                  const urgent = isUrgent(date, slot.time)
                  const active = slot.time === time
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTime(slot.time)}
                      className={cn(
                        "relative h-12 rounded-xl border text-sm transition-colors",
                        active
                          ? "border-accent bg-accent font-semibold text-white"
                          : "border-line-strong bg-surface text-ink hover:border-accent",
                      )}
                    >
                      {slot.time}
                      {urgent && (
                        <span className="absolute -right-1 -top-2.5 inline-flex items-center gap-0.5 rounded-full bg-warning px-1.5 text-[12px] font-semibold leading-[18px] text-white">
                          <Zap className="size-3" aria-hidden />
                          Gấp
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
            <p className="mt-3 text-xs text-muted">
              Chỉ hiện khung giờ {pro.name} còn trống, đã tính cả thời lượng dịch vụ và thời gian di chuyển giữa hai
              khách. Cần đặt trước ít nhất {POLICY.minLeadMinutes} phút. Khung giờ bắt đầu trong vòng{" "}
              {POLICY.urgentWithinHours} giờ tính phí đặt gấp {formatPrice(POLICY.urgentFee)} để {person} đặt xe tới
              kịp.
            </p>
          </section>
        </>
      )}

      {/* Step 3 never disappears: if the time or the place stopped being valid
          (someone else took the slot, the address changed), it says so and
          sends the customer back to pick again. */}
      {step === 3 && !ready && (
        <section className="rounded-[var(--radius-lg)] border border-line bg-surface px-5 py-8 text-center">
          <p className="text-[17px] font-bold">
            {!locationOk ? "Cần chọn nơi làm" : pickedTime ? "Giờ bạn chọn không còn trống" : "Bạn chưa chọn giờ"}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-ink-soft">
            {!locationOk
              ? atHome && session && !chosen
                ? "Lưu địa chỉ nơi làm để tính phí di chuyển và gửi lịch."
                : "Chọn lại nơi làm để xem giờ còn trống."
              : pickedTime
                ? `${pickedTime} · ${formatDateLong(date)} vừa có người khác đặt hoặc không còn phù hợp. Chọn giờ khác nhé.`
                : "Chọn ngày và giờ để xem tổng tiền."}
          </p>
          <Button className="mt-5" onClick={() => setStep(2)}>
            {!locationOk ? "Chọn nơi làm" : "Chọn giờ khác"}
          </Button>
        </section>
      )}

      {step === 3 && ready && time && (
        <section className="space-y-4">
          <ServiceSummary name={tpl.name} variant={variantText} price={price} duration={durationMin} />

          <Card className="divide-y divide-line px-4">
            <SummaryRow label="Thời gian" onEdit={() => setStep(2)}>
              {formatDateLong(date, true)}
              <br />
              {time} - {addMinutes(time, durationMin)}
              {quote.urgentFee > 0 && (
                <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-warning-soft px-1.5 py-0.5 text-xs font-semibold text-warning">
                  <Zap className="size-3" /> Đặt gấp
                </span>
              )}
            </SummaryRow>

            <SummaryRow label="Địa điểm" onEdit={() => setStep(2)}>
              <span className="mb-0.5 flex items-center gap-1 text-xs font-normal text-accent">
                {atHome ? <Home className="size-3.5" /> : <Store className="size-3.5" />}
                {atHome ? placeLabelText : "Tại studio"}
              </span>
              {atHome
                ? chosen
                  ? [chosen.detail, chosen.district, chosen.city].filter(Boolean).join(", ")
                  : `${area.district}, ${area.city}`
                : pro.studioAddress}
              {atHome && quote.distanceKm !== null && (
                <span className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-ink-soft">
                  <Car className="size-3.5" />~{quote.distanceKm.toLocaleString("vi-VN")} km ·{" "}
                  {quote.travelFee === 0 ? "miễn phí di chuyển" : `phí di chuyển ${formatPrice(quote.travelFee)}`}
                </span>
              )}
              {atHome && !session && (
                <span className="mt-0.5 block text-xs font-normal text-ink-soft">Số nhà, đường bạn điền sau khi đăng nhập.</span>
              )}
            </SummaryRow>

            <div className="py-3.5">
              <label className="text-[13px] text-muted" htmlFor="note">
                Ghi chú cho {pro.name}
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

          <Card className="space-y-4 p-4">
            {trade !== "beauty" && (
              <div>
                <p className="mb-2 text-[13px] font-semibold">Ảnh, clip dùng để làm gì?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["personal", "Cá nhân", "Đăng trang riêng, giữ làm kỷ niệm."],
                      ["commercial", "Kinh doanh", "Bán hàng, quảng cáo, fanpage của shop."],
                    ] as const
                  ).map(([value, label, hint]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={usageScope === value}
                      onClick={() => setUsageScope(value)}
                      className={cn(
                        "rounded-[var(--radius-md)] border p-3 text-left transition-colors",
                        usageScope === value ? "border-accent bg-subtle" : "border-line-strong bg-surface hover:border-accent",
                      )}
                    >
                      <span className="block text-[15px] font-semibold">{label}</span>
                      <span className="block text-[13px] text-ink-soft">{hint}</span>
                    </button>
                  ))}
                </div>
                {usageScope === "commercial" && (
                  <p className="mt-2 text-[13px] text-ink-soft">
                    {trade === "model"
                      ? `Dùng hình ảnh một người để kinh doanh cần sự đồng ý của họ. ${pro.name} sẽ thấy mục đích này trước khi nhận lịch.`
                      : `${pro.name} sẽ thấy mục đích này trước khi nhận lịch, và hai bên trao đổi thêm về quyền sử dụng qua tin nhắn sau đó.`}
                  </p>
                )}
              </div>
            )}
            <label className="flex cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={consentRepost}
                onChange={(e) => setConsentRepost(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="text-[14px]">
                <span className="font-semibold">Cho {pro.name} đăng ảnh kết quả làm tác phẩm</span>
                <span className="block text-ink-soft">Không bắt buộc. Nếu không chọn, ảnh của bạn chỉ dùng cho bạn.</span>
              </span>
            </label>
          </Card>

          {tpl.deliverable && (
            <p className="flex gap-2 rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px]">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                Bạn nhận: <b>{tpl.deliverable}</b>
                {tpl.deliveryDays ? `, trong ${tpl.deliveryDays} ngày sau buổi chụp. Link tải file hiện trong lịch hẹn.` : "."}
              </span>
            </p>
          )}

          <Card className="p-4">
            <p className="mb-2 text-[13px] text-muted">Thanh toán</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["cash", "Trả trực tiếp sau khi làm", `Tiền mặt hoặc chuyển khoản cho ${pro.name}.`, HandCoins, true],
                  ["online", "Thanh toán online (sắp có)", "Đang tích hợp cổng thanh toán.", CreditCard, false],
                ] as const
              ).map(([value, label, hint, Icon, available]) => (
                <button
                  key={value}
                  type="button"
                  disabled={!available}
                  aria-pressed={payment === value}
                  onClick={() => available && setPayment(value)}
                  className={cn(
                    "flex gap-2.5 rounded-xl border p-3 text-left disabled:opacity-50",
                    payment === value ? "border-accent bg-subtle" : "border-line-strong bg-surface",
                  )}
                >
                  <Icon className={cn("mt-0.5 size-4 shrink-0", payment === value ? "text-ink" : "text-muted")} />
                  <span>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-muted">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <PriceBreakdown quote={quote} paymentMethod={payment} />

          {/* What happens after sending, in the order it happens: the call, then
              until when the booking can be dropped at no cost. */}
          <div className="space-y-2.5 rounded-[var(--radius-lg)] bg-subtle px-4 py-3.5 text-[14px]">
            <p className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
              {session ? (
                <span>
                  {pro.name} nhận lịch trong app{responseTime ? `, thường trong ${responseTime}` : ""}; nhận rồi thì thấy số{" "}
                  <b>{formatPhone(session.phone)}</b> của bạn để liên hệ.{" "}
                  {/* TODO(db): there is no self-service number change yet (set_my_phone
                      only sets the first number); settings explains how to ask support. */}
                  <Link href="/me/cai-dat" className="font-semibold text-accent underline underline-offset-2">
                    Đổi số
                  </Link>
                </span>
              ) : (
                <span>
                  Bước tiếp theo: đăng nhập bằng Google và thêm số điện thoại để {pro.name} liên hệ khi đã nhận lịch. Lựa chọn
                  của bạn được giữ nguyên.
                </span>
              )}
            </p>
            {cancel && (
              <p className="flex gap-2.5">
                <CalendarX2 className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>
                  {cancel.passed
                    ? `Lịch bắt đầu trong chưa đầy ${POLICY.freeCancelHours} giờ nên không còn hạn huỷ miễn phí.`
                    : <>Huỷ miễn phí đến <b>{cancel.label}</b>.</>}{" "}
                  Không cần đặt cọc.{" "}
                  <Link href="/chinh-sach" className="text-accent underline underline-offset-2">
                    Chính sách
                  </Link>
                </span>
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
        </section>
      )}

      {/* The running total is always in view, on every step. */}
      <BottomBar className="md:sticky md:bottom-0 md:bg-canvas/95 md:py-3 md:backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 shrink-0" aria-live="polite">
            <p className="text-xs text-muted">{step === 1 ? "Giá dịch vụ" : ready ? "Tổng" : "Tạm tính"}</p>
            <p className="text-[17px] font-bold tabular-nums">{formatPrice(step === 1 ? price : quote.total)}</p>
          </div>
          {step > 1 && (
            <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} className="hidden md:inline-flex md:w-40">
              Quay lại
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1"
            disabled={(step < 3 && !canNext) || (step === 3 && slots === null) || isOwnProfile || paused || busy}
            onClick={() => (step < 3 ? setStep((s) => s + 1) : ready ? void submit() : setStep(2))}
          >
            {step < 3
              ? "Tiếp tục"
              : slots === null
                ? "Đang kiểm tra giờ…"
                : !ready
                  ? "Chọn lại"
                  : busy
                    ? "Đang gửi…"
                    : "Gửi yêu cầu"}
          </Button>
        </div>
      </BottomBar>
    </div>
  )
}

/** Signed out: a district is enough to estimate the travel fee. */
function AreaPicker({
  value,
  onChange,
}: {
  value: { city: string; district: string }
  onChange: (v: { city: string; district: string }) => void
}) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold">Thành phố</span>
          <select
            className={cn(inputClass, "text-sm")}
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value, district: "" })}
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold">Quận/huyện</span>
          <select
            className={cn(inputClass, "text-sm")}
            value={value.district}
            onChange={(e) => onChange({ city: value.city, district: e.target.value })}
          >
            <option value="">Chọn quận</option>
            {districtsOf(value.city).map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-1.5 text-xs text-muted">Để tính phí di chuyển. Số nhà, đường bạn điền sau khi đăng nhập.</p>
    </div>
  )
}

function SummaryRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-3.5 text-sm">
      <span className="w-20 shrink-0 text-[13px] text-muted">{label}</span>
      <span className="min-w-0 flex-1 font-medium">{children}</span>
      <button type="button" onClick={onEdit} className="-my-1 h-8 shrink-0 text-[13px] font-semibold text-accent underline-offset-2 hover:underline">
        Đổi
      </button>
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
            {i > 0 && <span className={cn("absolute right-1/2 top-3.5 h-px w-full", n <= step ? "bg-accent" : "bg-line")} />}
            <button
              type="button"
              onClick={() => onJump(n)}
              className={cn("relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-semibold", active || done ? "bg-accent text-white" : "bg-subtle-strong text-ink-soft")}
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
        "flex h-11 items-center justify-center gap-2 rounded-full border text-[14px] transition-colors disabled:opacity-40",
        active ? "border-accent bg-accent font-semibold text-white" : "border-line text-ink hover:border-ink/30",
      )}
    >
      {icon}
      {children}
    </button>
  )
}
