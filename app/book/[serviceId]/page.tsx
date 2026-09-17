"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Check, CheckCircle2, Clock, Home, Info, Store } from "lucide-react"
import { Avatar, BottomBar, Button, ButtonLink, Card, EmptyState, PageHeader, Skeleton, inputClass } from "@/components/ui"
import { DEMO_PRO_ID, getPro, worksByPro } from "@/lib/data"
import { DEMO_CUSTOMER, TIME_SLOTS, actions, findService, servicesFor, takenSlots, useApp, useHydrated } from "@/lib/store"
import {
  addDays,
  addMinutes,
  cn,
  formatDateLong,
  formatDuration,
  formatPrice,
  parseISODate,
  todayISO,
  weekdayShort,
} from "@/lib/utils"

const STEPS = ["Dịch vụ", "Thời gian", "Xác nhận"]

export default function BookPage() {
  const hydrated = useHydrated()
  const { serviceId } = useParams<{ serviceId: string }>()
  const state = useApp()
  const initial = findService(state, serviceId)

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-16">
        <Skeleton className="h-10" />
        <Skeleton className="h-28" />
        <Skeleton className="h-56" />
      </div>
    )
  }
  if (!initial || initial.active === false) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader back title="Đặt lịch" />
        <EmptyState title="Dịch vụ không còn nhận đặt" text="Chuyên viên đã tạm ẩn dịch vụ này." action={<ButtonLink href="/">Về trang khám phá</ButtonLink>} />
      </div>
    )
  }
  return <BookingFlow key={initial.id} initialServiceId={initial.id} />
}

function BookingFlow({ initialServiceId }: { initialServiceId: string }) {
  const router = useRouter()
  const state = useApp()
  const initial = findService(state, initialServiceId)!
  const pro = getPro(initial.proId)!
  const services = servicesFor(state, pro.id)
  const isOwnProfile = state.session?.role === "pro" && state.session.proId === pro.id
  const paused = pro.id === DEMO_PRO_ID && !state.acceptingJobs

  const [step, setStep] = React.useState(1)
  const [serviceId, setServiceId] = React.useState(initial.id)
  const [date, setDate] = React.useState(addDays(todayISO(), 1))
  const [time, setTime] = React.useState<string | null>(null)
  const [atHome, setAtHome] = React.useState(pro.homeService)
  const [address, setAddress] = React.useState(DEMO_CUSTOMER.address)
  const [note, setNote] = React.useState("")
  const [doneId, setDoneId] = React.useState<string | null>(null)

  const service = findService(state, serviceId)!
  const days = Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i))
  const taken = takenSlots(state, pro.id, date)
  const now = new Date()
  const isPast = (slot: string) => {
    if (date !== todayISO()) return false
    const [h, m] = slot.split(":").map(Number)
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes() + 60
  }
  const deposit = Math.round((service.price * 0.3) / 1000) * 1000
  const sample = worksByPro(pro.id).find((w) => w.serviceId === service.id) ?? worksByPro(pro.id)[0]

  const canNext = step === 1 ? true : step === 2 ? Boolean(time) : !atHome || address.trim().length > 5

  const submit = () => {
    if (!state.session) {
      router.push(`/login?next=${encodeURIComponent(`/book/${serviceId}`)}`)
      return
    }
    const id = actions.createBooking({
      serviceId,
      date,
      time: time!,
      atHome,
      address: atHome ? address.trim() : pro.studioAddress ?? `${pro.district}, ${pro.city}`,
      note: note.trim(),
    })
    setDoneId(id)
  }

  if (doneId) {
    return (
      <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-10" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Đã gửi yêu cầu đặt lịch</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {pro.name} sẽ xác nhận lịch {time} · {formatDateLong(date)}. {pro.responseTime}.
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
      <PageHeader
        title={step === 3 ? "Xác nhận đặt lịch" : "Đặt lịch"}
        back
        onBack={step > 1 ? () => setStep((s) => s - 1) : undefined}
      />

      {step < 3 && <Stepper step={step} onJump={(s) => s < step && setStep(s)} />}

      {isOwnProfile && (
        <p className="mb-4 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
          Bạn đang ở chế độ freelancer và xem dịch vụ của chính mình. Chuyển sang chế độ đặt lịch để thử luồng khách hàng.
        </p>
      )}

      {paused && (
        <p className="mb-4 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
          {pro.name} đang tạm nghỉ nhận lịch mới. Bạn có thể lưu hồ sơ hoặc đăng yêu cầu để freelancer khác báo giá.
        </p>
      )}

      {step === 1 && (
        <section>
          <h2 className="mb-3 font-semibold">Chọn dịch vụ</h2>
          <ul className="space-y-2.5">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  aria-pressed={s.id === serviceId}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border bg-surface p-3.5 text-left transition-colors",
                    s.id === serviceId ? "border-rose ring-1 ring-rose" : "border-line hover:border-blush-strong",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{s.name}</span>
                    <span className="block truncate text-xs text-muted">{s.description}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Clock className="size-3.5" /> {formatDuration(s.durationMin)}
                    </span>
                  </span>
                  <span className="font-semibold">{formatPrice(s.price)}</span>
                  <span className={cn("flex size-5 items-center justify-center rounded-full border", s.id === serviceId ? "border-rose bg-rose text-white" : "border-line")}>
                    {s.id === serviceId && <Check className="size-3.5" />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step >= 2 && step < 3 && (
        <>
          <ServiceSummary image={sample?.images[0]} name={service.name} price={service.price} duration={service.durationMin} />

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
                    <span className="text-[11px] text-muted">{weekdayShort(d)}</span>
                    <span className={cn("font-medium", active && "font-semibold")}>{parseISODate(d).getDate()}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-semibold">Chọn khung giờ</h2>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {TIME_SLOTS.map((slot) => {
                const disabled = taken.has(slot) || isPast(slot)
                const active = slot === time
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    onClick={() => setTime(slot)}
                    className={cn(
                      "h-11 rounded-xl border text-sm transition-colors",
                      active
                        ? "border-rose bg-blush font-semibold text-rose-dark"
                        : "border-line bg-surface text-ink hover:border-blush-strong",
                      disabled && "cursor-not-allowed border-transparent bg-canvas text-muted/60 line-through",
                    )}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-muted">Khung giờ gạch ngang là {pro.name} đã có lịch.</p>
          </section>
        </>
      )}

      {step === 3 && time && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={48} />
            <div>
              <p className="font-semibold">{pro.name}</p>
              <p className="text-xs text-muted">{pro.title}</p>
            </div>
          </div>

          <ServiceSummary image={sample?.images[0]} name={service.name} price={service.price} duration={service.durationMin} />

          <Card className="divide-y divide-line px-4">
            <Row label="Thời gian">
              {formatDateLong(date, true)}
              <br />
              {time} - {addMinutes(time, service.durationMin)}
            </Row>
            <div className="py-3.5">
              <p className="mb-2 text-[13px] text-muted">Địa điểm</p>
              <div className="grid grid-cols-2 gap-2">
                <PlaceOption active={atHome} disabled={!pro.homeService} onClick={() => setAtHome(true)} icon={<Home className="size-4" />}>
                  Làm tại nhà
                </PlaceOption>
                <PlaceOption active={!atHome} disabled={!pro.studioAddress} onClick={() => setAtHome(false)} icon={<Store className="size-4" />}>
                  Tại studio
                </PlaceOption>
              </div>
              {atHome ? (
                <textarea
                  aria-label="Địa chỉ"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={cn(inputClass, "mt-2 resize-none text-sm")}
                />
              ) : (
                <p className="mt-2 text-sm text-ink-soft">{pro.studioAddress}</p>
              )}
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
                placeholder="VD: muốn làm giống mẫu milky, móng đang dài 1cm..."
                className={cn(inputClass, "mt-2 resize-none text-sm")}
              />
            </div>
          </Card>

          <Card className="space-y-2 p-4 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Tổng tiền</span>
              <span>{formatPrice(service.price)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Đặt cọc trước (30%)</span>
              <span className="font-semibold text-rose">{formatPrice(deposit)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Thanh toán sau khi làm</span>
              <span>{formatPrice(service.price - deposit)}</span>
            </div>
          </Card>

          <p className="flex gap-2 text-xs text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Bạn có thể hủy lịch miễn phí trước 12 giờ. Tiền cọc chỉ chuyển cho chuyên viên sau khi hoàn thành.{" "}
              <Link href="/me/policy" className="text-rose underline underline-offset-2">
                Xem chính sách
              </Link>
            </span>
          </p>
        </section>
      )}

      <BottomBar>
        <div className="flex gap-2">
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
            {step < 3 ? "Tiếp tục" : state.session ? "Xác nhận và đặt cọc" : "Đăng nhập để đặt lịch"}
          </Button>
        </div>
      </BottomBar>
    </div>
  )
}

function Stepper({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  return (
    <ol className="mb-6 flex items-start">
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
              className={cn(
                "relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                active || done ? "bg-rose text-white" : "bg-line text-muted",
              )}
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

function ServiceSummary({ image, name, price, duration }: { image?: string; name: string; price: number; duration: number }) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-blush">
        {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
      </div>
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-ink-soft">
          {formatPrice(price)} · {formatDuration(duration)}
        </p>
      </div>
    </Card>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-3.5 text-sm">
      <span className="w-20 shrink-0 text-[13px] text-muted">{label}</span>
      <span className="flex-1 font-medium">{children}</span>
    </div>
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
