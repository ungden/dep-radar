import type { Metadata } from "next"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Avatar, Card, EmptyState, PageHeader } from "@/components/ui"
import { listThreads } from "@/lib/api/chat"
import { timeAgo } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Tin nhắn",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function InboxPage() {
  const threads = await listThreads()

  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Tin nhắn" back />
      <RequireSession>
        {threads.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="size-6" />}
            title="Chưa có tin nhắn nào"
            text="Nhắn cho người làm từ hồ sơ của họ, hoặc từ một lịch hẹn đã đặt."
          />
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => (
              <li key={t.id}>
                <Link href={`/tin-nhan/${t.id}`}>
                  <Card className="flex items-center gap-3 p-3.5">
                    <Avatar name={t.otherName} src={t.otherAvatar ?? undefined} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{t.otherName}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted">{timeAgo(t.lastMessageAt)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-[13px] text-ink-soft">{t.lastMessage}</span>
                        {t.unread > 0 && (
                          <span className="ml-auto shrink-0 rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
                            {t.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </RequireSession>
    </div>
  )
}
