"use client"

import Link from "next/link"
import { CalendarCheck, ChevronRight, Hourglass, Star, Wallet } from "lucide-react"
import { JobBookingRow } from "@/components/booking-card"
import { RequestCard } from "@/components/request-card"
import { RequireSession } from "@/components/require-session"
import { Button, Card, EmptyState, Logo, Toggle } from "@/components/ui"
import { getPro } from "@/lib/data"
import { actions, useApp } from "@/lib/store"
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
  const proId = state.session!.proId!
  const pro = getPro(proId)!
  const today = todayISO()
  const mine = state.bookings.filter((b) => b.proId === proId)
  const pending = mine.filter((b) => b.status === "pending").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const todays = mine.filter((b) => b.date === today && b.status === "confirmed").sort((a, b) => a.time.localeCompare(b.time))
  const upcoming = mine.filter((b) => b.date > today && b.status === "confirmed")
  const month = today.slice(0, 7)
  const monthEarnings = mine.filter((b) => b.status === "completed" && b.date.startsWith(month)).reduce((s, b) => s + b.total, 0)
  const expected = mine.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.total, 0)
  const matchingJobs = state.jobs.filter(
    (j) => !j.mine && j.status === "open" && pro.categories.includes(j.category) && j.city === pro.city && !j.offers.some((o) => o.proId === proId),
  )

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{formatDateLong(today)}</p>
        <h1 className="text-2xl font-semibold">Chào {pro.name}, hôm nay có {todays.length} lịch làm</h1>
      </div>

      <Card className={cn("flex items-center gap-3 p-4", !state.acceptingJobs && "bg-warning-soft")}>
        <span className={cn("size-2.5 rounded-full", state.acceptingJobs ? "bg-success" : "bg-warning")} />
        <div className="flex-1">
          <p className="text-sm font-semibold">{state.acceptingJobs ? "Đang nhận job mới" : "Đang tạm nghỉ"}</p>
          <p className="text-xs text-muted">
            {state.acceptingJobs ? `Khách ở ${pro.areas.join(", ")} có thể đặt lịch với bạn` : "Hồ sơ vẫn hiển thị nhưng khách không đặt được lịch mới"}
          </p>
        </div>
        <Toggle label="Nhận job mới" checked={state.acceptingJobs} onChange={actions.setAcceptingJobs} />
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Wallet className="size-4" />} label="Thu nhập tháng này" value={formatPrice(monthEarnings)} />
        <Stat icon={<CalendarCheck className="size-4" />} label="Sắp tới (dự kiến)" value={formatPrice(expected)} sub={`${upcoming.length + todays.length} lịch đã nhận`} />
        <Stat icon={<Hourglass className="size-4" />} label="Chờ bạn xác nhận" value={String(pending.length)} highlight={pending.length > 0} />
        <Stat icon={<Star className="size-4" />} label="Đánh giá" value={pro.rating.toFixed(1)} sub={`${pro.reviewCount} lượt`} />
      </div>

      <section>
        <SectionTitle title="Yêu cầu đặt lịch mới" href="/studio/schedule?tab=pending" count={pending.length} />
        {pending.length ? (
          <ul className="space-y-3">
            {pending.slice(0, 3).map((b) => (
              <li key={b.id}>
                <JobBookingRow
                  booking={b}
                  actions={
                    <>
                      <Button variant="outline" size="sm" className="border-line text-ink" onClick={() => actions.setBookingStatus(b.id, "declined")}>
                        Từ chối
                      </Button>
                      <Button size="sm" onClick={() => actions.setBookingStatus(b.id, "confirmed")}>
                        Nhận job
                      </Button>
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-surface px-4 py-5 text-center text-sm text-muted">Không có yêu cầu nào đang chờ.</p>
        )}
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
        <SectionTitle title="Việc mới phù hợp với bạn" href="/studio/jobs" count={matchingJobs.length} />
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
    <Card className={cn("p-4", highlight && "ring-1 ring-rose")}>
      <p className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </p>
      <p className={cn("mt-1.5 text-xl font-semibold", highlight && "text-rose")}>{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </Card>
  )
}

function SectionTitle({ title, href, count }: { title: string; href: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-semibold">
        {title}
        {count ? <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] text-white">{count}</span> : null}
      </h2>
      <Link href={href} className="inline-flex items-center text-sm text-rose">
        Xem tất cả <ChevronRight className="size-4" />
      </Link>
    </div>
  )
}
