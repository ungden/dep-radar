"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarDays, ChevronRight, Megaphone } from "lucide-react"
import { BookingCard } from "@/components/booking-card"
import { RequireSession } from "@/components/require-session"
import { ButtonLink, EmptyState, PageHeader, Tabs } from "@/components/ui"
import { rebookCart } from "@/lib/service-cart"
import { formatPrice } from "@/lib/utils"
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
            <span className="block text-body font-semibold">Yêu cầu đã đăng</span>
            <span className="block text-label text-muted">
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
      {tab === "completed" && list.length > 0 && <p className="mt-3 text-meta text-ink-soft">{list.length} lịch hoàn thành · {formatPrice(list.reduce((sum, b) => sum + b.quote.total - b.discount, 0))} giá trị lịch</p>}
      {list.length ? (
        <ul className="mt-4 space-y-3">
          {list.map((b, i) => (
            <li key={b.id}>
              {tab !== "upcoming" && list[i - 1]?.date.slice(0, 7) !== b.date.slice(0, 7) && <h2 className="mb-2 mt-5 text-lead font-semibold">Tháng {Number(b.date.slice(5, 7))}/{b.date.slice(0, 4)}</h2>}
              <BookingCard booking={b} />
              {tab === "completed" && <Link href={`/book/${b.proId}?cart=${encodeURIComponent(rebookCart(b))}`} className="flex min-h-11 items-center justify-end px-2 text-meta font-semibold text-accent-dark">Đặt lại</Link>}
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
