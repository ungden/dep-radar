"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { CircleCheck, Hourglass } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui"
import { actions, useAct } from "@/lib/client-actions"
import { getPro, useApp } from "@/lib/store"
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

/**
 * A request goes to every freelancer who can do it, and the first to press
 * "Nhận việc" gets it at the posted price (take_job). There is nothing to
 * choose here: the page says where it stands and, once taken, opens the booking.
 */
function RequestDetail() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const state = useApp()
  const act = useAct()
  const { jobs, bookings } = state
  const [error, setError] = React.useState<string | null>(null)
  const job = jobs.find((j) => j.id === id && j.mine)

  if (!job) return <EmptyState title="Không tìm thấy yêu cầu" action={<ButtonLink href="/requests">Về danh sách</ButtonLink>} />

  // Before the match-then-chat migration there was no booking_id on the request.
  const booking = job.bookingId
    ? bookings.find((b) => b.id === job.bookingId)
    : bookings.find((b) => b.source === "job" && b.date === job.date && b.time === job.time && b.templateId === job.templateId)
  const taker = booking ? getPro(state, booking.proId) : undefined

  return (
    <div className="space-y-5">
      <RequestCard job={job} href={`/requests/${job.id}`} />

      {job.status === "open" && (
        <div className="rounded-2xl bg-subtle px-4 py-3.5">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-accent-dark">
            <Hourglass className="size-4 shrink-0" />
            Đang tìm người làm
            {job.notified !== null && job.notified > 0 && ` · đã báo cho ${job.notified} người`}
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">
            {job.notified === 0
              ? "Lúc đăng chưa có người làm nào rảnh và nhận dịch vụ này gần bạn. "
              : "Người làm nhận trước sẽ làm với giá trên. "}
            Người làm vào mục Việc mới vẫn thấy yêu cầu này cho tới giờ hẹn. Có người nhận, bạn được báo ngay và nhắn tin được
            với họ trong lịch hẹn.
          </p>
        </div>
      )}

      {job.status === "booked" && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-success-soft px-4 py-3 text-sm text-success">
          <span className="flex items-center gap-2 font-semibold">
            <CircleCheck className="size-4 shrink-0" />
            {taker ? `${taker.name} đã nhận việc` : "Đã có người nhận việc"}
          </span>
          {booking && (
            <Link href={`/bookings/${booking.id}`} className="font-semibold underline underline-offset-2">
              Xem lịch hẹn
            </Link>
          )}
        </div>
      )}

      {job.status === "closed" && (
        <p className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">Yêu cầu đã đóng. Cần làm thì đăng yêu cầu mới hoặc đặt lịch trực tiếp với người làm.</p>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {job.status === "open" && (
        <button
          type="button"
          onClick={async () => {
            const message = await act(() => actions.closeJob(job.id), "Đã xoá yêu cầu")
            if (message) setError(message)
            else router.replace("/requests")
          }}
          className="mx-auto block py-2 text-sm text-muted underline underline-offset-2"
        >
          Xoá yêu cầu
        </button>
      )}
    </div>
  )
}
