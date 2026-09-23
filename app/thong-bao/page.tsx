import type { Metadata } from "next"
import Link from "next/link"
import { BellOff } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Card, EmptyState, PageHeader } from "@/components/ui"
import { listNotifications, markNotificationsRead } from "@/lib/api/me"
import { MarkAllRead } from "./mark-all-read"
import { timeAgo } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Thông báo",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const items = await listNotifications()
  const unread = items.filter((n) => !n.readAt).length

  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Thông báo" back />
      <RequireSession>
        {unread > 0 && <MarkAllRead count={unread} action={markNotificationsRead} />}

        {items.length === 0 ? (
          <EmptyState
            icon={<BellOff className="size-6" />}
            title="Chưa có thông báo nào"
            text="Nhắc lịch hẹn, xác nhận từ người làm và báo giá mới sẽ hiện ở đây."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const body = (
                <Card className={n.readAt ? "p-3.5" : "p-3.5 ring-1 ring-accent/40"}>
                  <p className="flex items-start gap-2 text-sm font-semibold">
                    {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />}
                    {n.title}
                  </p>
                  {n.body && <p className="mt-0.5 text-[13px] text-ink-soft">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                </Card>
              )
              return <li key={n.id}>{n.link ? <Link href={n.link}>{body}</Link> : body}</li>
            })}
          </ul>
        )}
      </RequireSession>
    </div>
  )
}
