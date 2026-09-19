"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { openThread } from "@/lib/api/chat"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * Opens (or reuses) the conversation with a freelancer. The thread is created by
 * a database function that checks there is a reason for it to exist, so this
 * button cannot be used to message an arbitrary account.
 */
export function MessageButton({
  proId,
  bookingId,
  label = "Nhắn tin",
  className,
}: {
  proId: string
  bookingId?: string | null
  label?: string
  className?: string
}) {
  const router = useRouter()
  const { session } = useApp()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!session) {
            router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
            return
          }
          setBusy(true)
          setError(null)
          const result = await openThread(proId, bookingId)
          setBusy(false)
          if (!result.ok) return setError(result.error)
          router.push(`/tin-nhan/${result.data}`)
        }}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-rose hover:text-rose disabled:opacity-60",
          className,
        )}
      >
        <MessageSquare className="size-4" />
        {busy ? "Đang mở…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </>
  )
}
