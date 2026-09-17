"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { BadgeCheck, Hourglass } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Avatar, Button, ButtonLink, Card, EmptyState, PageHeader, Rating } from "@/components/ui"
import { getPro } from "@/lib/data"
import { actions, useApp } from "@/lib/store"
import { cn, formatPrice, timeAgo } from "@/lib/utils"
import { RequestCard } from "@/components/request-card"

export default function RequestDetailPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Yêu cầu" back="/requests" />
      <RequireSession role="customer">
        <RequestDetail />
      </RequireSession>
    </div>
  )
}

function RequestDetail() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { jobs, bookings } = useApp()
  const job = jobs.find((j) => j.id === id && j.mine)

  if (!job) return <EmptyState title="Không tìm thấy yêu cầu" action={<ButtonLink href="/requests">Về danh sách</ButtonLink>} />

  const accepted = job.offers.find((o) => o.status === "accepted")
  const booking = accepted && bookings.find((b) => b.source === "job" && b.proId === accepted.proId && b.date === job.date && b.time === job.time)

  return (
    <div className="space-y-5">
      <RequestCard job={job} href={`/requests/${job.id}`} />

      {job.status === "booked" && booking && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-success-soft px-4 py-3 text-sm text-success">
          Đã chốt với {getPro(booking.proId)?.name}.
          <Link href={`/bookings/${booking.id}`} className="font-semibold underline underline-offset-2">
            Xem lịch hẹn
          </Link>
        </div>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Báo giá nhận được ({job.offers.length})</h2>
        {job.offers.length === 0 ? (
          <EmptyState
            icon={<Hourglass className="size-6" />}
            title="Đang chờ freelancer báo giá"
            text="Yêu cầu đã được gửi tới freelancer phù hợp trong khu vực. Thường có báo giá đầu tiên sau 15-30 phút."
          />
        ) : (
          <ul className="space-y-3">
            {job.offers.map((o) => {
              const pro = getPro(o.proId)!
              return (
                <li key={o.id}>
                  <Card className={cn("p-4", o.status === "rejected" && "opacity-55")}>
                    <div className="flex items-center gap-3">
                      <Link href={`/pros/${pro.id}`}>
                        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={44} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/pros/${pro.id}`} className="flex items-center gap-1 font-semibold hover:underline">
                          {pro.name}
                          {pro.verified && <BadgeCheck className="size-4 fill-rose text-white" />}
                        </Link>
                        <p className="flex items-center gap-2 text-xs text-muted">
                          <Rating value={pro.rating} count={pro.reviewCount} className="text-xs" /> · {pro.completedJobs} job
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatPrice(o.price)}</p>
                        <p className="text-[11px] text-muted">{timeAgo(o.createdAt)}</p>
                      </div>
                    </div>
                    <p className="mt-3 rounded-xl bg-canvas px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft">{o.message}</p>
                    {job.status === "open" && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <ButtonLink href={`/pros/${pro.id}`} variant="outline" size="sm" className="border-line text-ink">
                          Xem hồ sơ
                        </ButtonLink>
                        <Button
                          size="sm"
                          onClick={() => {
                            const bookingId = actions.acceptOffer(job.id, o.id)
                            if (bookingId) router.push(`/bookings/${bookingId}`)
                          }}
                        >
                          Chọn báo giá này
                        </Button>
                      </div>
                    )}
                    {o.status === "accepted" && <p className="mt-3 text-sm font-medium text-success">Bạn đã chọn báo giá này</p>}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {job.status === "open" && (
        <button type="button" onClick={() => actions.closeJob(job.id)} className="mx-auto block py-2 text-sm text-muted underline underline-offset-2">
          Đóng yêu cầu
        </button>
      )}
    </div>
  )
}
