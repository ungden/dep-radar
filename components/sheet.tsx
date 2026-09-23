"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A bottom sheet on the phone, a centred panel on a wide screen. Built on
 * <dialog>, so focus is trapped, Escape closes it and the page behind is inert
 * without any of that being reimplemented here.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Kept in view under the scrolling content, e.g. "Xem 24 kết quả". */
  footer?: React.ReactNode
  className?: string
}) {
  const ref = React.useRef<HTMLDialogElement>(null)
  const titleId = React.useId()

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // Escape is handled here as well: some browsers only let a modal be
      // cancelled once per user activation, and the sheet must always close.
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault()
          onClose()
        }
      }}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={cn(
        "m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-[var(--radius-xl)] bg-surface p-0 text-ink shadow-[var(--shadow-overlay)] backdrop:bg-black/40",
        "open:flex open:flex-col open:animate-fade-up",
        "md:m-auto md:max-w-lg md:rounded-[var(--radius-xl)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 id={titleId} className="text-[17px] font-bold tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-subtle"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="border-t border-line px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
    </dialog>
  )
}
