"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarDays } from "lucide-react"
import { JobBookingRow } from "@/components/booking-card"
import { RequireSession } from "@/components/require-session"
import { Button, EmptyState, PageHeader, Tabs, PageSkeleton } from "@/components/ui"
import { actions, useAct } from "@/lib/client-actions"
import { useApp } from "@/lib/store"
import type { Booking } from "@/lib/types"
import { addDays, cn, formatDateLong, parseISODate, todayISO, weekdayShort } from "@/lib/utils"

type Tab = "calendar" | "pending" | "history"

export default function SchedulePage() {
  return (
    <div className="mx-auto max-w-3xl md:pt-4">
      <PageHeader title="Lịch làm" />
      <RequireSession role="pro">
        <Suspense fallback={<PageSkeleton />}>
          <Schedule />
        </Suspense>
      </RequireSession>
    </div>
  )
}

function Schedule() {
  const params = useSearchParams()
  const state = useApp()
  const act = useAct()
  const proId = state.session!.proId!
  const [tab, setTab] = React.useState<Tab>((params.get("tab") as Tab | null) ?? "calendar")
  const today = todayISO()
  const [day, setDay] = React.useState(today)
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))

  // Jobs booked with this freelancer, not their own bookings as a customer.
  const mine = state.bookings.filter((b) => b.proId === proId && !b.mine)
  const active = mine.filter((b) => b.status === "confirmed" || b.status === "pending")
  const countByDay = (d: string) => active.filter((b) => b.date === d).length
  const byTime = (a: Booking, b: Booking) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)

  const pending = mine.filter((b) => b.status === "pending").sort(byTime)
  const history = mine.filter((b) => ["completed", "cancelled", "declined"].includes(b.status)).sort((a, b) => byTime(b, a))
  const dayList = active.filter((b) => b.date === day).sort(byTime)

  return (
    <>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "calendar", label: "Theo ngày" },
          { value: "pending", label: `Chờ xác nhận (${pending.length})` },
          { value: "history", label: "Lịch sử" },
        ]}
      />

      {tab === "calendar" && (
        <>
          <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {days.map((d) => {
              const n = countByDay(d)
              const activeDay = d === day
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={activeDay}
                  onClick={() => setDay(d)}
                  className={cn(
                    "relative flex w-13 shrink-0 flex-col items-center gap-1 rounded-2xl border py-2.5 text-sm",
                    activeDay ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink",
                  )}
                >
                  <span className={cn("text-xs", activeDay ? "text-white/80" : "text-muted")}>{d === today ? "Nay" : weekdayShort(d)}</span>
                  <span className="font-semibold">{parseISODate(d).getDate()}</span>
                  <span className={cn("size-1.5 rounded-full", n ? (activeDay ? "bg-white" : "bg-accent") : "bg-transparent")} />
                </button>
              )
            })}
          </div>
          <h2 className="mb-3 mt-5 text-sm font-semibold text-ink-soft">
            {formatDateLong(day)} · {dayList.length} lịch
          </h2>
          {dayList.length ? (
            <List bookings={dayList} />
          ) : (
            <EmptyState icon={<CalendarDays className="size-6" />} title="Ngày này còn trống" text="Khách có thể đặt các khung giờ trống của bạn." />
          )}
        </>
      )}

      {tab === "pending" && (
        <div className="mt-4">{pending.length ? <List bookings={pending} /> : <EmptyState title="Không có yêu cầu chờ xác nhận" />}</div>
      )}

      {tab === "history" && (
        <div className="mt-4">{history.length ? <List bookings={history} /> : <EmptyState title="Chưa có lịch sử" />}</div>
      )}
    </>
  )
}

function List({ bookings }: { bookings: Booking[] }) {
  const act = useAct()
  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <li key={b.id}>
          <JobBookingRow
            booking={b}
            actions={
              b.status === "confirmed" && b.date <= todayISO() ? (
                <>
                  <span />
                  <Button size="sm" variant="soft" onClick={() => void act(() => actions.setBookingStatus(b.id, "completed"), "Đã đánh dấu hoàn thành")}>
                    Hoàn thành
                  </Button>
                </>
              ) : undefined
            }
          />
        </li>
      ))}
    </ul>
  )
}
