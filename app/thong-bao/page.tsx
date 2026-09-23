import type { Metadata } from "next"
import Link from "next/link"
import { Bell, BellOff, BriefcaseBusiness, CalendarDays, CircleCheck, MessageSquare, Star, Users, Wallet } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Card, EmptyState, PageHeader } from "@/components/ui"
import { listNotifications, markNotificationsRead } from "@/lib/api/me"
import { supabaseServer } from "@/lib/supabase/server"
import { MarkAllRead } from "./mark-all-read"
import { cn, timeAgo } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Thông báo",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/**
 * What each kind looks like. The words come from the database with the
 * notification; this only picks an icon and a tone, so a kind added later
 * still shows (as a bell).
 */
function lookOf(kind: string): { icon: typeof Bell; tone: string } {
  if (kind === "job_new") return { icon: BriefcaseBusiness, tone: "bg-accent-soft text-accent-dark" }
  if (kind === "job_taken" || kind === "booking_confirmed") return { icon: CircleCheck, tone: "bg-success-soft text-success" }
  if (kind === "fee_due") return { icon: Wallet, tone: "bg-danger-soft text-danger" }
  if (kind === "wallet_topup" || kind === "referral_reward" || kind === "voucher_new") return { icon: Wallet, tone: "bg-success-soft text-success" }
  if (kind.startsWith("review")) return { icon: Star, tone: "bg-subtle text-ink" }
  if (kind.startsWith("casting")) return { icon: Users, tone: "bg-subtle text-ink" }
  if (kind.startsWith("message")) return { icon: MessageSquare, tone: "bg-subtle text-ink" }
  if (kind.startsWith("booking") || kind.includes("no_show") || kind.startsWith("delivery") || kind.startsWith("combo"))
    return { icon: CalendarDays, tone: "bg-subtle text-ink" }
  return { icon: Bell, tone: "bg-subtle text-ink" }
}

/** True only when the balance was read and nothing is owed. */
async function walletCleared(): Promise<boolean> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc("my_wallet_balance" as never, {} as never)
  return !error && Number(data ?? 0) >= 0
}

export default async function NotificationsPage() {
  const items = await listNotifications()
  const unread = items.filter((n) => !n.readAt).length
  // A fee reminder stays in the list after it is paid: say so, from the wallet
  // itself, rather than leave an old "Thanh toán phí" looking current.
  const feePaid = items.some((n) => n.kind === "fee_due") && (await walletCleared())

  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Thông báo" back />
      <RequireSession>
        {unread > 0 && <MarkAllRead count={unread} action={markNotificationsRead} />}

        {items.length === 0 ? (
          <EmptyState
            icon={<BellOff className="size-6" />}
            title="Chưa có thông báo nào"
            text="Nhắc lịch hẹn, người làm nhận lịch và việc mới sẽ hiện ở đây."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const { icon: Icon, tone } = lookOf(n.kind)
              const body = (
                <Card className={cn("flex gap-3 p-3.5", !n.readAt && "ring-1 ring-accent/40")}>
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tone)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2 text-sm font-semibold">
                      {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />}
                      {n.title}
                    </span>
                    {n.body && <span className="mt-0.5 block text-[13px] text-ink-soft">{n.body}</span>}
                    {n.kind === "fee_due" && feePaid && (
                      <span className="mt-1 block text-[13px] font-medium text-success">Đã thanh toán xong, bạn nhận đơn mới được.</span>
                    )}
                    <span className="mt-1 block text-xs text-muted">{timeAgo(n.createdAt)}</span>
                  </span>
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
