"use client"

import { Megaphone, Plus } from "lucide-react"
import { RequestCard } from "@/components/request-card"
import { RequireSession } from "@/components/require-session"
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui"
import { useApp } from "@/lib/store"

export default function RequestsPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader
        title="Yêu cầu của tôi"
        back="/bookings"
        action={
          <ButtonLink href="/requests/new" size="sm" variant="soft">
            <Plus className="size-4" /> Đăng
          </ButtonLink>
        }
      />
      <RequireSession role="customer">
        <RequestList />
      </RequireSession>
    </div>
  )
}

function RequestList() {
  const { jobs } = useApp()
  const mine = jobs.filter((j) => j.mine)
  if (!mine.length) {
    return (
      <EmptyState
        icon={<Megaphone className="size-6" />}
        title="Bạn chưa đăng yêu cầu nào"
        text="Chọn dịch vụ và giờ, người làm gần bạn được báo. Ai nhận trước sẽ làm với giá niêm yết."
        action={<ButtonLink href="/requests/new">Đăng yêu cầu</ButtonLink>}
      />
    )
  }
  return (
    <ul className="space-y-3">
      {mine.map((j) => (
        <li key={j.id}>
          <RequestCard job={j} href={`/requests/${j.id}`} />
        </li>
      ))}
    </ul>
  )
}
