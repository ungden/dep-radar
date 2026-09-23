"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { openThread } from "@/lib/api/chat"
import { bookingChatOpen } from "@/lib/connection"
import { cn } from "@/lib/utils"

/**
 * Opens (or reuses) the conversation of one booking. Chat exists only between
 * a customer and a freelancer who are matched, so this renders nothing unless
 * the freelancer has accepted and the job has not ended (bookingChatOpen); the
 * database refuses open_thread otherwise anyway.
 */
export function MessageButton({
  booking,
  label = "Nhắn tin",
  className,
}: {
  booking: { id: string; proId: string; status: string }
  label?: string
  className?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (!bookingChatOpen(booking.status)) return null

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setError(null)
          const result = await openThread(booking.proId, booking.id)
          setBusy(false)
          if (!result.ok) return setError(result.error)
          router.push(`/tin-nhan/${result.data}`)
        }}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-5 text-sm font-semibold text-ink transition-[border-color,transform] duration-150 hover:border-ink/40 active:scale-[0.98] disabled:opacity-60",
          className,
        )}
      >
        <MessageSquare className="size-4" />
        {busy ? "Đang mở…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      )}
    </>
  )
}
