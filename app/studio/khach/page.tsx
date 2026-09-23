"use client"

import * as React from "react"
import Link from "next/link"
import { Contact, Phone } from "lucide-react"
import { MessageButton } from "@/components/message-button"
import { RequireSession } from "@/components/require-session"
import { Avatar, Card, EmptyState, PageHeader, buttonClass, inputClass } from "@/components/ui"
import { useApp } from "@/lib/store"
import type { Booking } from "@/lib/types"
import { cn, formatDateLong, formatPrice } from "@/lib/utils"

export default function StudioClientsPage() {
  return (
    <div className="mx-auto max-w-3xl md:pt-4">
      <PageHeader title="Khách của bạn" back="/studio" />
      <RequireSession role="pro">
        <Clients />
      </RequireSession>
    </div>
  )
}

interface Client {
  id: string
  name: string
  phone: string
  visits: number
  spent: number
  last: Booking
}

/**
 * Everyone this freelancer has finished a job for, most recent first. Built
 * from the bookings already in the snapshot: nothing here is a new query, and
 * only completed jobs count as a visit.
 */
function Clients() {
  const state = useApp()
  const proId = state.session!.proId!
  const [query, setQuery] = React.useState("")

  const clients = React.useMemo(() => {
    const byCustomer = new Map<string, Client>()
    const done = state.bookings
      .filter((b) => !b.mine && b.proId === proId && b.status === "completed")
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    for (const b of done) {
      const known = byCustomer.get(b.customerId)
      if (known) {
        known.visits += 1
        known.spent += b.quote.total
        if (!known.phone && b.customerPhone) known.phone = b.customerPhone
      } else {
        byCustomer.set(b.customerId, {
          id: b.customerId,
          name: b.customerName,
          phone: b.customerPhone,
          visits: 1,
          spent: b.quote.total,
          last: b,
        })
      }
    }
    return [...byCustomer.values()]
  }, [state.bookings, proId])

  const q = query.trim().toLowerCase()
  const shown = q ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))) : clients
  const returning = clients.filter((c) => c.visits > 1).length

  if (!clients.length) {
    return (
      <EmptyState
        icon={<Contact className="size-6" />}
        title="Chưa có khách nào"
        text="Khách bạn đã làm xong sẽ hiện ở đây, kèm số lần quay lại và số điện thoại để hẹn lần sau."
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-ink-soft">
        {clients.length} khách đã làm xong · {returning} khách quay lại từ 2 lần trở lên
      </p>
      {clients.length > 6 && (
        <input
          type="search"
          aria-label="Tìm khách"
          placeholder="Tìm theo tên hoặc số điện thoại"
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <ul className="space-y-3">
        {shown.map((c) => (
          <li key={c.id}>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={c.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
                    {c.name}
                    {c.visits > 1 && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-dark">{c.visits} lần</span>
                    )}
                  </p>
                  <p className="text-[13px] text-ink-soft">
                    Lần gần nhất:{" "}
                    <Link href={`/bookings/${c.last.id}`} className="underline-offset-2 hover:underline">
                      {c.last.serviceName} · {formatDateLong(c.last.date, true)}
                    </Link>
                  </p>
                  <p className="text-[13px] text-ink-soft">
                    Đã chi <b className="text-ink">{formatPrice(c.spent)}</b>
                    {c.visits > 1 ? ` qua ${c.visits} lần` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {c.phone ? (
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className={buttonClass("outline", "sm")}>
                    <Phone className="size-4" /> Gọi
                  </a>
                ) : (
                  <span className={cn(buttonClass("soft", "sm"), "pointer-events-none opacity-60")}>Không có số</span>
                )}
                {/* A thread is tied to a booking the two of them share; the last one will do. */}
                <MessageButton proId={proId} bookingId={c.last.id} label="Nhắn tin" className="h-9 text-[13px]" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {q && !shown.length && <p className="text-center text-[14px] text-ink-soft">Không có khách nào khớp “{query}”.</p>}
    </div>
  )
}
