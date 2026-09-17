"use client"

import Link from "next/link"
import { ChevronRight, Hourglass, ShieldCheck, Star, Wallet } from "lucide-react"
import { JobBookingRow } from "@/components/booking-card"
import { RequestCard } from "@/components/request-card"
import { RequireSession } from "@/components/require-session"
import { TrustedBadge, VERIFICATION_ICON } from "@/components/trust"
import { Card, EmptyState, Logo, Toggle } from "@/components/ui"
import { getTemplate } from "@/lib/catalog"
import { POLICY } from "@/lib/pricing"
import { actions, distanceToCustomer, proView, useApp } from "@/lib/store"
import { VERIFICATIONS, isVerified, verifiedCount } from "@/lib/trust"
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
  const proId = state.session!.proId!
  const pro = proView(state, proId)!
  const today = todayISO()
  const mine = state.bookings.filter((b) => b.proId === proId)
  const byTime = (a: { date: string; time: string }, b: { date: string; time: string }) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  const pending = mine.filter((b) => b.status === "pending").sort(byTime)
  const todays = mine.filter((b) => b.date === today && b.status === "confirmed").sort(byTime)
  const month = today.slice(0, 7)
  const doneThisMonth = mine.filter((b) => b.status === "completed" && b.date.startsWith(month))
  const gross = doneThisMonth.reduce((s, b) => s + b.quote.total, 0)
  const commission = doneThisMonth.reduce((s, b) => s + b.quote.commission, 0)
  const net = doneThisMonth.reduce((s, b) => s + b.quote.payout, 0)
  const onlinePayout = doneThisMonth.filter((b) => b.paymentMethod === "online").reduce((s, b) => s + b.quote.payout, 0)
  const cashDebt = doneThisMonth.filter((b) => b.paymentMethod === "cash").reduce((s, b) => s + b.quote.commission, 0)
  const settlement = onlinePayout - cashDebt
  const matchingJobs = state.jobs.filter((j) => {
    const km = distanceToCustomer(state, proId, { city: j.city, district: j.district, detail: "" })
    return (
      !j.mine &&
      j.status === "open" &&
      pro.categories.includes(getTemplate(j.templateId)!.category) &&
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
        <Toggle label="Nhận job mới" checked={state.acceptingJobs} onChange={actions.setAcceptingJobs} />
      </Card>

      <VerifyNudge pro={pro} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Wallet className="size-4" />} label="Thực nhận tháng này" value={formatPrice(net)} sub={`Doanh thu ${formatPrice(gross)} · hoa hồng ${formatPrice(commission)}`} />
        <Stat
          icon={<Wallet className="size-4" />}
          label={settlement >= 0 ? "Đối soát: dep360 chuyển bạn" : "Đối soát: bạn cần nộp"}
          value={formatPrice(Math.abs(settlement))}
          sub={`Online ${formatPrice(onlinePayout)} − công nợ hoa hồng tiền mặt ${formatPrice(cashDebt)}`}
        />
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
    <Card className={cn("p-4", highlight && "ring-1 ring-rose")}>
      <p className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </p>
      <p className={cn("mt-1.5 text-xl font-semibold", highlight && "text-rose")}>{value}</p>
      {sub && <p className="text-[11px] leading-snug text-muted">{sub}</p>}
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

function VerifyNudge({ pro }: { pro: Pro }) {
  const done = verifiedCount(pro)
  const total = VERIFICATIONS.length
  return (
    <Link href="/studio/profile" className="block">
      <Card className={cn("p-4 transition-shadow hover:shadow-md", done < total && "ring-1 ring-rose/40")}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-rose" />
          <p className="flex-1 text-sm font-semibold">
            Xác minh hồ sơ {done}/{total}
          </p>
          <TrustedBadge pro={pro} />
          <ChevronRight className="size-4 text-muted" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {VERIFICATIONS.map((v) => {
            const Icon = VERIFICATION_ICON[v.id]
            const ok = isVerified(pro, v.id)
            return (
              <div key={v.id} className={cn("rounded-xl px-2 py-2 text-center text-[11px]", ok ? "bg-success-soft text-success" : "bg-canvas text-muted")}>
                <Icon className="mx-auto mb-1 size-4" />
                {v.label}
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[13px] text-ink-soft">
          {done < total
            ? "Không bắt buộc, nhưng hồ sơ xác minh được đẩy lên đầu kết quả tìm kiếm và gắn huy hiệu cho khách thấy. Đủ 3 mục nhận huy hiệu Tin cậy."
            : "Bạn đã có huy hiệu Tin cậy và đang được ưu tiên hiển thị."}
        </p>
      </Card>
    </Link>
  )
}
