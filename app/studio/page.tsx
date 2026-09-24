"use client"

import Link from "next/link"
import { ChevronRight, Contact, Gift, IdCard, ImagePlus, Navigation, Phone, Tags, UserRoundPen, Users } from "lucide-react"
import { JobBookingRow } from "@/components/booking-card"
import { MessageButton } from "@/components/message-button"
import { BookingLink } from "@/components/booking-link"
import { OwnClientsCard, PortfolioCard } from "@/components/portfolio-share"
import { FeeDueCard } from "@/components/fee-due"
import { PublishProgress } from "@/components/publish-progress"
import { RequestCard } from "@/components/request-card"
import { RequireSession } from "@/components/require-session"
import { buttonClass, Card, LogoMark, Toggle } from "@/components/ui"
import { getTemplate } from "@/lib/catalog"
import { POLICY } from "@/lib/pricing"
import { actions, useAct } from "@/lib/client-actions"
import { distanceToCustomer, proView, useApp } from "@/lib/store"
import type { Pro } from "@/lib/types"
import { showsAverage } from "@/lib/connection"
import { addDays, cn, formatDateLong, formatPrice, parseISODate, todayISO } from "@/lib/utils"

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-4xl pt-2 md:pt-8">
      <div className="flex h-12 items-center gap-2 md:hidden">
        <LogoMark size={28} />
        <span className="text-[15px] font-bold tracking-tight">Studio</span>
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
      km <= pro.maxTravelKm
    )
  })

  // Photo & video sessions whose files are still owed, soonest deadline first.
  const toDeliver = mine
    .filter((b) => b.status === "completed" && b.delivery && !b.delivery.deliveredAt)
    .sort((a, b) => (a.delivery?.dueAt ?? "").localeCompare(b.delivery?.dueAt ?? ""))
  const weekStart = addDays(today, -((parseISODate(today).getUTCDay() + 6) % 7))
  const doneThisWeek = mine.filter((b) => b.status === "completed" && b.date >= weekStart && b.date <= today)
  const weekNet = doneThisWeek.reduce((s, b) => s + b.quote.payout, 0)
  const myCastings = state.castings.filter((c) => c.proId === proId && c.status === "open")
  const waitingApplicants = myCastings.reduce((n, c) => n + c.applications.filter((a) => a.status === "pending").length, 0)
  const clientCount = new Set(mine.filter((b) => b.status === "completed").map((b) => b.customerId)).size

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-medium text-muted">{formatDateLong(today)}</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight md:text-[34px]">
          {pending.length
            ? `${pending.length} khách đang chờ bạn nhận lịch`
            : todays.length
              ? `Hôm nay có ${todays.length} lịch`
              : `Chào ${pro.name}`}
        </h1>
      </div>

      <div className={cn("flex items-center gap-3 rounded-[var(--radius-lg)] border p-4", state.acceptingJobs ? "border-line bg-surface" : "border-warning/30 bg-warning-soft")}>
        <span className={cn("size-2.5 rounded-full", state.acceptingJobs ? "bg-success" : "bg-warning")} />
        <div className="flex-1">
          <p className="text-[15px] font-bold">{state.acceptingJobs ? "Đang nhận khách mới" : "Đang tạm nghỉ"}</p>
          <p className="text-[13px] text-ink-soft">
            {state.acceptingJobs ? `Trong bán kính ${pro.maxTravelKm} km quanh ${pro.district}` : "Hồ sơ vẫn hiện nhưng khách không đặt được lịch mới"}
          </p>
        </div>
        <Toggle
          label="Nhận khách mới"
          checked={state.acceptingJobs}
          onChange={(value) => void act(() => actions.setAcceptingJobs(value), value ? "Đang nhận khách mới" : "Đã tạm nghỉ nhận khách")}
        />
      </div>

      {/* The fee comes before the next job: first thing on the page while it is owed. */}
      <FeeDueCard />

      <PublishProgress />
      <VerifyNudge pro={pro} />

      {pending.length > 0 && (
        <section>
          <SectionTitle title="Chờ bạn nhận lịch" href="/studio/schedule?tab=pending" count={pending.length} />
          <ul className="space-y-3">
            {pending.slice(0, 3).map((b) => (
              <li key={b.id}>
                <JobBookingRow booking={b} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] text-ink-soft">
            Xem giờ, địa chỉ, yêu cầu rồi bấm Nhận lịch; nhận rồi thì hai bên nhắn tin, gọi được cho nhau. Quá{" "}
            {POLICY.confirmWithinHours} giờ, yêu cầu tự hết hạn và khung giờ được trả lại.
          </p>
        </section>
      )}

      <section>
        <SectionTitle title="Lịch hôm nay" href="/studio/schedule" />
        {todays.length ? (
          <ul className="space-y-3">
            {todays.map((b) => (
              <li key={b.id}>
                <JobBookingRow
                  booking={b}
                  actions={
                    <>
                      {b.customerPhone ? (
                        <a href={`tel:${b.customerPhone.replace(/\s/g, "")}`} className={buttonClass("outline", "sm")}>
                          <Phone className="size-4" /> Gọi khách
                        </a>
                      ) : (
                        <MessageButton booking={b} label="Nhắn khách" className="h-9 text-[13px]" />
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonClass("primary", "sm")}
                      >
                        <Navigation className="size-4" /> Chỉ đường
                      </a>
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[var(--radius-lg)] bg-subtle px-4 py-6 text-center text-[15px] text-ink-soft">Hôm nay trống lịch.</p>
        )}
      </section>

      {toDeliver.length > 0 && (
        <section>
          <SectionTitle title="Cần giao file" href="/studio/schedule?tab=deliver" count={toDeliver.length} />
          <ul className="space-y-3">
            {toDeliver.slice(0, 3).map((b) => (
              <li key={b.id}>
                <JobBookingRow booking={b} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Thực nhận tuần này" value={formatPrice(weekNet)} sub={`${doneThisWeek.length} lịch hoàn thành`} />
        <Stat label="Tháng này" value={formatPrice(net)} sub={`Khách trả ${formatPrice(gross)} · hoa hồng ${formatPrice(commission)}`} />
        <Stat
          label="Đánh giá"
          value={showsAverage(pro.rating.count) ? `★ ${pro.rating.average.toFixed(1)}` : "Mới"}
          sub={
            showsAverage(pro.rating.count)
              ? `${pro.rating.count} lượt`
              : `${pro.rating.count ? `${pro.rating.count} đánh giá · ` : ""}điểm hiện từ 3 đánh giá`
          }
        />
        <Link href="/studio/wallet" className="contents">
          <Stat label="Ví & sổ thu" value="Xem" sub={`Tổng ${pro.stats.completedJobs} lịch đã làm`} />
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-[20px] font-bold tracking-tight">Làm nhanh</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Shortcut href="/studio/works" icon={<ImagePlus className="size-5" />} title="Đăng tác phẩm" text="Ảnh, trước/sau, clip" />
          <Shortcut
            href="/studio/tuyen-mau"
            icon={<Users className="size-5" />}
            title="Tuyển mẫu"
            text={waitingApplicants ? `${waitingApplicants} người đang chờ bạn chọn` : myCastings.length ? `${myCastings.length} tin đang mở` : "Tìm mẫu luyện tay, chụp portfolio"}
          />
          <Shortcut href="/studio/services" icon={<Tags className="size-5" />} title="Bảng giá" text="Dịch vụ và giá của bạn" />
          <Shortcut href="/studio/profile/edit" icon={<UserRoundPen className="size-5" />} title="Hồ sơ & giờ làm" text="Giới thiệu, khu vực, lịch tuần" />
          <Shortcut
            href="/studio/khach"
            icon={<Contact className="size-5" />}
            title="Khách của bạn"
            text={clientCount ? `${clientCount} khách đã làm xong` : "Khách đã làm xong sẽ hiện ở đây"}
          />
          {/* Only while the programme runs, with the amount the owner set. */}
          {state.platform.referralEnabled && state.platform.referralProAmount > 0 && (
            <Shortcut
              href="/gioi-thieu"
              icon={<Gift className="size-5" />}
              title="Giới thiệu người làm"
              text={`Giới thiệu người làm khác, nhận ${formatPrice(state.platform.referralProAmount)} vào ví`}
            />
          )}
        </div>
      </section>

      {pro.published && <OwnClientsCard />}
      <BookingLink slug={pro.id} published={pro.published} />
      <PortfolioCard slug={pro.id} published={pro.published} />

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
          <p className="rounded-[var(--radius-lg)] bg-subtle px-4 py-6 text-center text-[15px] text-ink-soft">Chưa có yêu cầu mới phù hợp với bạn.</p>
        )}
      </section>
    </div>
  )
}

function Shortcut({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="block rounded-[var(--radius-lg)] border border-line bg-surface p-4 transition-colors hover:border-ink/30">
      <span className="flex size-10 items-center justify-center rounded-xl bg-subtle">{icon}</span>
      <p className="mt-3 text-[15px] font-bold">{title}</p>
      <p className="mt-0.5 text-[13px] text-ink-soft">{text}</p>
    </Link>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-[22px] font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">{sub}</p>}
    </div>
  )
}

function SectionTitle({ title, href, count }: { title: string; href: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-[20px] font-bold tracking-tight">
        {title}
        {count ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">{count}</span> : null}
      </h2>
      <Link href={href} className="inline-flex items-center text-[14px] font-semibold text-ink">
        Xem tất cả <ChevronRight className="size-4" />
      </Link>
    </div>
  )
}

function VerifyNudge({ pro }: { pro: Pro }) {
  if (pro.identity === "verified") return null
  return (
    <Link href="/studio/verify" className="block">
      <Card className="flex items-center gap-3 p-4 transition-colors hover:border-ink/30">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-subtle text-ink">
          <IdCard className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">{pro.identity === "pending" ? "Đang xác minh danh tính" : "Xác minh danh tính để được ưu tiên"}</p>
          <p className="text-[13px] text-ink-soft">
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
