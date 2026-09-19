"use client"

import * as React from "react"
import { Share2 } from "lucide-react"
import type { Booking } from "@/lib/types"
import { addMinutes, formatDateLong } from "@/lib/utils"

/**
 * Share an appointment with someone you trust. Deliberately a plain text share
 * rather than a link: the person receiving it should not need an account, and
 * nothing here exposes the customer's address to anyone but them — it is their
 * own address, which they can decide to include.
 */
export function ShareBooking({ booking }: { booking: Booking }) {
  const [copied, setCopied] = React.useState(false)

  const text = [
    `Mình có hẹn làm đẹp qua 360dep:`,
    `• ${booking.serviceName} · ${booking.variantLabel}`,
    `• Chuyên viên: ${booking.proName}`,
    `• ${formatDateLong(booking.date, true)}, ${booking.time}–${addMinutes(booking.time, booking.durationMin)}`,
    booking.atHome ? `• Tại: ${booking.address}` : `• Tại studio: ${booking.address}`,
  ].join("\n")

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ text })
          else {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
        } catch {
          // The share sheet was dismissed; nothing to report.
        }
      }}
      className="inline-flex items-center gap-1.5 text-[13px] text-muted underline underline-offset-2 hover:text-ink"
    >
      <Share2 className="size-3.5" />
      {copied ? "Đã chép thông tin lịch hẹn" : "Chia sẻ lịch hẹn cho người thân"}
    </button>
  )
}
