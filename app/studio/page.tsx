"use client"

import Link from "next/link"
import { ChevronRight, Hourglass, IdCard, Star, Wallet } from "lucide-react"
import { JobBookingRow } from "@/components/booking-card"
import { RequestCard } from "@/components/request-card"
import { RequireSession } from "@/components/require-session"
import { Card, EmptyState, Logo, Toggle } from "@/components/ui"
import { getTemplate } from "@/lib/catalog"
import { POLICY } from "@/lib/pricing"
import { actions, useAct } from "@/lib/client-actions"
import { distanceToCustomer, proView, useApp } from "@/lib/store"
import type { Pro } from "@/lib/types"
import { cn, formatDateLong, formatPrice, todayISO } from "@/lib/utils"

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-3xl pt-2 md:pt-8">
      <div className="flex h-12 items-center md:hidden">
        <Logo />
        <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Studio</span>
      </div>
      <RequireSession role="pro">
        <Dashboard />
      </RequireSession>
    </div>
  )
}

function Dashboard() {
  const state = useApp()
  const act = useAct()
  const proId = state.session!.proId!
  const pro = proView(state, proId)!
  const today = todayISO()
  // Jobs this freelancer was booked for, not bookings they made as a customer.
  const mine = state.bookings.filter((b) => b.proId === proId && !b.mine)
  const byTime = (a: { date: string; time: string }, b: { date: string; time: string }) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  const pending = mine.filter((b) => b.status === "pending").sort(byTime)
  const todays = mine.filter((b) => b.date === today && b.status === "confirmed").sort(byTime)
  const month = today.slice(0, 7)
  const doneThisMonth = mine.filter((b) => b.status === "completed" && b.date.startsWith(month))
  const gross = doneThisMonth.reduce((s, b) => s + b.quote.total, 0)
  const commission = doneThisMonth.reduce((s, b) => s + b.quote.commission, 0)
  const net = doneThisMonth.reduce((s, b) => s + b.quote.payout, 0)
  const matchingJobs = state.jobs.filter((j) => {
    const km = distanceToCustomer(state, proId, { city: j.city, district: j.district, detail: "" })
    return (
      !j.mine &&
      j.status === "open" &&
      pro.categories.includes(getTemplate(j.templateId)?.category ?? "nail") &&
      km !== null &&
      km <= pro.maxTravelKm &&
      !j.offers.some((o) => o.proId === proId)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{formatDateLong(today)}</p>
        <h1 className="text-2xl font-semibold">
          Chào {pro.name}, hôm nay có {todays.length} lịch làm
        </h1>
      </div>

      <Card className={cn("flex items-center gap-3 p-4", !state.acceptingJobs && "bg-warning-soft")}>
        <span className={cn("size-2.5 rounded-full", state.acceptingJobs ? "bg-success" : "bg-warning")} />
        <div className="flex-1">
          <p className="text-sm font-semibold">{state.acceptingJobs ? "Đang nhận job mới" : "Đang tạm nghỉ"}</p>
          <p className="text-xs text-muted">
            {state.acceptingJobs ? `Nhận khách trong bán kính ${pro.maxTravelKm} km quanh ${pro.district}` : "Hồ sơ vẫn hiển thị nhưng khách không đặt được lịch mới"}
          </p>
        </div>
        <Toggle
          label="Nhận job mới"
          checked={state.acceptingJobs}
          onChange={(value) => void act(() => actions.setAcceptingJobs(value), value ? "Đang nhận job mới" : "Đã tạm nghỉ nhận job")}
        />
      </Card>

      {!pro.published && <SetupNudge />}

      <VerifyNudge pro={pro} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          icon={<Wallet className="size-4" />}
          label="Thực nhận tháng này"
          value={formatPrice(net)}
          sub={`Khách trả ${formatPrice(gross)} · hoa hồng ${formatPrice(commission)}`}
        />
        <Link href="/studio/wallet" className="contents">
          <Stat
            icon={<Wallet className="size-4" />}
            label="Ví & thu nhập"
            value={String(doneThisMonth.length) + " job"}
            sub={`Tổng cộng ${pro.stats.completedJobs} job · xem sổ ví`}
          />
        </Link>
        <Stat icon={<Hourglass className="size-4" />} label="Chờ bạn xác nhận" value={String(pending.length)} highlight={pending.length > 0} sub={`Gọi khách & trả lời trong ${POLICY.confirmWithinHours} giờ`} />
        <Stat icon={<Star className="size-4" />} label="Đánh giá" value={pro.rating.average.toFixed(2)} sub={`${pro.rating.count} lượt`} />
      </div>

      <section>
        <SectionTitle title="Yêu cầu đặt lịch mới" href="/studio/schedule?tab=pending" count={pending.length} />
        {pending.length ? (
          <ul className="space-y-3">
            {pending.slice(0, 3).map((b) => (
              <li key={b.id}>
                <JobBookingRow booking={b} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-surface px-4 py-5 text-center text-sm text-muted">Không có yêu cầu nào đang chờ.</p>
        )}
        <p className="mt-2 text-xs text-muted">Gọi cho khách xác nhận giờ, địa chỉ, yêu cầu rồi mới nhận job. Từ chối hoặc để quá {POLICY.confirmWithinHours} giờ không tính là huỷ, nhưng làm giảm tỉ lệ phản hồi.</p>
      </section>

      <section>
        <SectionTitle title="Lịch hôm nay" href="/studio/schedule" />
        {todays.length ? (
          <ul className="space-y-3">
            {todays.map((b) => (
              <li key={b.id}>
                <JobBookingRow booking={b} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Hôm nay trống lịch" text="Xem các yêu cầu mới quanh bạn để lấp khung giờ trống." />
        )}
      </section>

      <section>
        <SectionTitle title="Việc mới trong phạm vi của bạn" href="/studio/jobs" count={matchingJobs.length} />
        {matchingJobs.length ? (
          <ul className="space-y-3">
            {matchingJobs.slice(0, 2).map((j) => (
              <li key={j.id}>
                <RequestCard job={j} href={`/studio/jobs#${j.id}`} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-surface px-4 py-5 text-center text-sm text-muted">Bạn đã báo giá hết các việc phù hợp.</p>
        )}
      </section>
    </div>
  )
}

function Stat({ icon, label, value, sub, highlight }: { icon: React.ReactNode; label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <Card className={cn("p-4", highlight && "ring-1 ring-accent")}>
      <p className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </p>
      <p className={cn("mt-1.5 text-xl font-semibold", highlight && "text-accent")}>{value}</p>
      {sub && <p className="text-[11px] leading-snug text-muted">{sub}</p>}
    </Card>
  )
}

function SectionTitle({ title, href, count }: { title: string; href: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-semibold">
        {title}
        {count ? <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-white">{count}</span> : null}
      </h2>
      <Link href={href} className="inline-flex items-center text-sm text-accent">
        Xem tất cả <ChevronRight className="size-4" />
      </Link>
    </div>
  )
}

/** A profile nobody can see is the first thing to fix. */
function SetupNudge() {
  return (
    <Card className="p-4 ring-1 ring-warning/40">
      <p className="text-sm font-semibold">Hồ sơ của bạn chưa hiển thị với khách</p>
      <p className="mt-1 text-xs text-ink-soft">
        Cần ít nhất một dịch vụ có giá, giờ làm việc và một ảnh tác phẩm. Sau đó bật hiển thị trong trang hồ sơ.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/studio/services" className="rounded-full bg-subtle px-3 py-1.5 text-[13px] font-medium text-accent-dark">
          Dịch vụ & giá
        </Link>
        <Link href="/studio/works" className="rounded-full bg-subtle px-3 py-1.5 text-[13px] font-medium text-accent-dark">
          Tác phẩm
        </Link>
        <Link
          href="/studio/profile/edit"
          className="rounded-full bg-subtle px-3 py-1.5 text-[13px] font-medium text-accent-dark"
        >
          Hồ sơ & giờ làm
        </Link>
      </div>
    </Card>
  )
}

function VerifyNudge({ pro }: { pro: Pro }) {
  if (pro.identity === "verified") return null
  return (
    <Link href="/studio/verify" className="block">
      <Card className="flex items-center gap-3 p-4 ring-1 ring-accent/40 transition-shadow hover:shadow-md">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-subtle text-accent">
          <IdCard className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{pro.identity === "pending" ? "Đang xác minh danh tính" : "Xác minh danh tính để được ưu tiên"}</p>
          <p className="text-xs text-ink-soft">
            {pro.identity === "rejected"
              ? "Lần trước chưa thành công, chụp lại CCCD và selfie nhé."
              : "Chụp CCCD 2 mặt + 1 ảnh selfie. Có dấu tick và được xếp trước khi khách tìm kiếm."}
          </p>
        </div>
        <ChevronRight className="size-4 text-muted" />
      </Card>
    </Link>
  )
}
