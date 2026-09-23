"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CalendarDays, MapPin, Users } from "lucide-react"
import { compensationLabel, SafetyNote } from "@/components/casting"
import { ReportButton } from "@/components/report-button"
import { VerifiedBadge, VerifiedMark } from "@/components/trust"
import { Avatar, Button, ButtonLink, EmptyState, PageHeader, inputClass } from "@/components/ui"
import { categoryLabel, getVertical, verticalOf } from "@/lib/catalog"
import { actions, useAct } from "@/lib/client-actions"
import { getPro, useApp, worksOf } from "@/lib/store"
import type { ApplicationStatus } from "@/lib/types"
import { cn, formatDateLong } from "@/lib/utils"

const APPLICATION_LABEL: Record<ApplicationStatus, string> = {
  pending: "Đã gửi, đang chờ chọn",
  accepted: "Bạn được chọn",
  rejected: "Lần này chưa được chọn",
  withdrawn: "Bạn đã rút",
}

export default function CastingPage() {
  const { id } = useParams<{ id: string }>()
  const state = useApp()
  const act = useAct()
  const casting = state.castings.find((c) => c.id === id)
  const [message, setMessage] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (!casting)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader back="/tuyen-mau" />
        <EmptyState title="Tin này đã đóng hoặc không tồn tại" action={<ButtonLink href="/tuyen-mau">Xem tin đang mở</ButtonLink>} />
      </div>
    )

  const pro = getPro(state, casting.proId)
  const photos = pro ? worksOf(state, pro.id).slice(0, 3) : []
  const mine = state.session?.proId === casting.proId
  const application = casting.myApplication
  const left = Math.max(0, casting.slots - casting.acceptedCount)
  const trade = getVertical(verticalOf(casting.category))

  const run = async (fn: () => Promise<{ error?: string } | { id: string }>, done: string) => {
    setBusy(true)
    setError(await act(fn, done))
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-5xl md:pt-4">
      <PageHeader back="/tuyen-mau" title="Tuyển mẫu" />
      <div className="grid gap-8 md:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-subtle px-3 py-1 text-[13px] font-semibold">{categoryLabel(casting.category)}</span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[13px] font-bold",
                casting.compensation === "paid" ? "bg-success-soft text-success" : "bg-accent-soft text-accent-dark",
              )}
            >
              {compensationLabel(casting)}
            </span>
          </div>
          <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight md:text-[34px]">{casting.title}</h1>

          <dl className="mt-5 grid gap-3 text-[15px] sm:grid-cols-3">
            <Fact icon={<CalendarDays className="size-5" />} label="Khi nào">
              {formatDateLong(casting.date)}, {casting.time}
            </Fact>
            <Fact icon={<MapPin className="size-5" />} label="Ở đâu">
              {casting.district}, {casting.city}
            </Fact>
            <Fact icon={<Users className="size-5" />} label="Cần">
              {casting.status === "open" ? `${left}/${casting.slots} mẫu` : "Đã đóng"}
            </Fact>
          </dl>

          {casting.description && <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed">{casting.description}</p>}
          <p className="mt-4 text-[14px] text-ink-soft">Địa chỉ cụ thể được gửi trong tin nhắn khi bạn được chọn.</p>

          {pro && (
            <section className="mt-8">
              <h2 className="mb-3 text-[20px] font-bold tracking-tight">Người tuyển</h2>
              <Link href={`/pros/${pro.id}`} className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4 hover:border-ink/30">
                <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[16px] font-bold">
                    {pro.name} <VerifiedMark pro={pro} />
                  </p>
                  <p className="text-[13px] text-ink-soft">
                    {pro.title || trade.label}
                    {pro.rating.count ? ` · ★ ${pro.rating.average.toFixed(1)} (${pro.rating.count})` : ""}
                  </p>
                  <VerifiedBadge pro={pro} className="mt-1.5" />
                </div>
              </Link>
              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {photos.map((w) => (
                    <Link key={w.id} href={`/works/${w.id}`} className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-subtle">
                      <Image src={w.images[0]} alt={w.title} fill sizes="200px" className="object-cover" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
            {mine ? (
              <>
                <p className="text-[15px] font-bold">Tin của bạn</p>
                <ButtonLink href="/studio/tuyen-mau" className="mt-3 w-full">
                  Xem người ứng tuyển
                </ButtonLink>
              </>
            ) : application && application.status !== "withdrawn" ? (
              <>
                <p className="text-[13px] font-medium text-muted">Trạng thái</p>
                <p className={cn("mt-1 text-[18px] font-bold", application.status === "accepted" && "text-success")}>
                  {APPLICATION_LABEL[application.status]}
                </p>
                {application.status === "accepted" && (
                  <ButtonLink href="/tin-nhan" className="mt-4 w-full">
                    Nhắn tin với {pro?.name ?? "người tuyển"}
                  </ButtonLink>
                )}
                {application.status === "pending" && (
                  <Button variant="outline" className="mt-4 w-full" disabled={busy} onClick={() => run(() => actions.withdrawApplication(application.id), "Đã rút ứng tuyển")}>
                    Rút ứng tuyển
                  </Button>
                )}
              </>
            ) : casting.status !== "open" || left === 0 ? (
              <p className="text-[15px] font-bold">Tin đã đủ người hoặc đã đóng</p>
            ) : !state.session ? (
              <>
                <p className="text-[15px] font-bold">Muốn làm mẫu?</p>
                <p className="mt-1 text-[14px] text-ink-soft">Đăng nhập để ứng tuyển. Người tuyển sẽ thấy tên của bạn và lời nhắn.</p>
                <ButtonLink href={`/login?next=${encodeURIComponent(`/tuyen-mau/${casting.id}`)}`} className="mt-4 w-full">
                  Đăng nhập để ứng tuyển
                </ButtonLink>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void run(() => actions.applyCasting(casting.id, message.trim()), "Đã gửi ứng tuyển")
                }}
              >
                <label htmlFor="message" className="text-[15px] font-bold">
                  Lời nhắn cho {pro?.name ?? "người tuyển"}
                </label>
                <textarea
                  id="message"
                  rows={4}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="VD: Mình rảnh cả buổi, móng tay khoẻ, chưa làm gel 2 tuần nay."
                  className={cn(inputClass, "mt-2 resize-none")}
                />
                <Button type="submit" className="mt-3 w-full" disabled={busy}>
                  Ứng tuyển
                </Button>
              </form>
            )}
            {error && (
              <p role="alert" className="mt-3 text-[14px] text-danger">
                {error}
              </p>
            )}
          </div>
          <SafetyNote className="mt-4" />
          {!mine && pro && (
            <div className="mt-3">
              <ReportButton targetAccountId={pro.uuid} label="Báo cáo tin này" />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-[var(--radius-lg)] bg-subtle p-3.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <dt className="text-[13px] font-medium text-muted">{label}</dt>
        <dd className="font-semibold">{children}</dd>
      </div>
    </div>
  )
}
