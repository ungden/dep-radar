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
  const openJobs = jobs.filter((j) => j.mine && j.status === "open")
  const newOffers = openJobs.reduce((n, j) => n + j.offers.filter((o) => o.status === "pending").length, 0)

  return (
    <>
      <Link
        href="/requests"
        className="mb-4 flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-[var(--shadow-soft)] hover:bg-blush/40"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-blush text-rose">
          <Megaphone className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">Yêu cầu đã đăng</span>
          <span className="block text-xs text-muted">
            {openJobs.length} yêu cầu đang mở{newOffers ? ` · ${newOffers} báo giá mới` : ""}
          </span>
        </span>
        {newOffers > 0 && <span className="rounded-full bg-rose px-2 py-0.5 text-xs font-semibold text-white">{newOffers}</span>}
        <ChevronRight className="size-4 text-muted" />
      </Link>

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
          text="Khám phá tác phẩm và đặt lịch với chuyên viên bạn thích."
          action={tab === "upcoming" ? <ButtonLink href="/">Khám phá ngay</ButtonLink> : undefined}
        />
      )}
    </>
  )
}
