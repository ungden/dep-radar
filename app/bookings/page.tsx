"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarDays, ChevronRight, Megaphone } from "lucide-react"
import { BookingCard } from "@/components/booking-card"
import { RequireSession } from "@/components/require-session"
import { ButtonLink, EmptyState, PageHeader, Tabs } from "@/components/ui"
import { useApp } from "@/lib/store"
import type { BookingStatus } from "@/lib/types"

type Tab = "upcoming" | "completed" | "cancelled"
const GROUPS: Record<Tab, BookingStatus[]> = {
  upcoming: ["pending", "confirmed", "in_progress"],
  completed: ["completed"],
  cancelled: ["cancelled", "declined", "expired", "no_show"],
}

export default function BookingsPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Lịch hẹn" />
      <RequireSession role="customer">
        <BookingsView />
      </RequireSession>
    </div>
  )
}

function BookingsView() {
  const { bookings, jobs } = useApp()
  const [tab, setTab] = React.useState<Tab>("upcoming")
  const mine = bookings.filter((b) => b.mine)
  const list = mine
    .filter((b) => GROUPS[tab].includes(b.status))
    .sort((a, b) => (tab === "upcoming" ? 1 : -1) * `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const myJobs = jobs.filter((j) => j.mine)
  const openJobs = myJobs.filter((j) => j.status === "open")

  return (
    <>
      {/* Only once there is something there: a card that says "0" is noise. */}
      {myJobs.length > 0 && (
        <Link
          href="/requests"
          className="mb-4 flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-[var(--shadow-soft)] hover:bg-subtle/40"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-subtle text-accent">
            <Megaphone className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Yêu cầu đã đăng</span>
            <span className="block text-xs text-muted">
              {openJobs.length ? `${openJobs.length} yêu cầu đang tìm người làm` : `${myJobs.length} yêu cầu đã đăng`}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted" />
        </Link>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "upcoming", label: "Sắp tới" },
          { value: "completed", label: "Đã hoàn thành" },
          { value: "cancelled", label: "Đã huỷ" },
        ]}
      />
      {list.length ? (
        <ul className="mt-4 space-y-3">
          {list.map((b) => (
            <li key={b.id}>
              <BookingCard booking={b} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<CalendarDays className="size-6" />}
          title={tab === "upcoming" ? "Chưa có lịch hẹn sắp tới" : "Chưa có lịch hẹn nào"}
          text="Chọn dịch vụ, xem giá và đặt lịch với người làm gần bạn."
          action={tab === "upcoming" ? <ButtonLink href="/">Khám phá ngay</ButtonLink> : undefined}
        />
      )}
    </>
  )
}
