"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Button, Skeleton, inputClass } from "@/components/ui"
import { cn } from "@/lib/utils"

/** A button whose action is a server call: disabled while it runs, so one tap does one thing. */
export function ActButton({
  onClick,
  children,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & { onClick: () => Promise<unknown> | void }) {
  const [busy, setBusy] = React.useState(false)
  return (
    <Button
      {...props}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={async () => {
        if (busy) return
        setBusy(true)
        try {
          await onClick()
        } finally {
          setBusy(false)
        }
      }}
    >
      {children}
    </Button>
  )
}

/** One row of filters, with how many each would show. Ink when chosen, like the tabs. */
export function FilterChips<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T
  onChange: (v: T) => void
  items: { value: T; label: string; count?: number }[]
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      {items.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => onChange(f.value)}
          aria-pressed={value === f.value}
          className={cn(
            "min-h-9 shrink-0 rounded-full border px-3 py-1.5 text-meta font-semibold",
            value === f.value ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink-soft hover:border-ink",
          )}
        >
          {f.label}
          {f.count !== undefined && <span className={cn("ml-1 tabular-nums", value === f.value ? "opacity-80" : "text-muted")}>{f.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        className={cn(inputClass, "pl-10 text-body")}
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/** While a panel reads its own data. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <span className="sr-only">Đang tải…</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  )
}

export function PanelError({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-body text-danger">
      <span className="min-w-0 flex-1">{text}</span>
      {onRetry && (
        <Button size="sm" variant="danger" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  )
}

export function Flag({ on, label, tone = "success" }: { on: boolean; label: string; tone?: "success" | "muted" | "danger" | "warning" }) {
  if (!on) return null
  const tones = {
    success: "bg-success-soft text-success",
    muted: "bg-subtle text-ink-soft",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
  }
  return <span className={cn("rounded-full px-2 py-0.5 text-label font-semibold", tones[tone])}>{label}</span>
}

/** Folds Vietnamese marks so "hoa" finds "Hoà" and "duong" finds "Dương". */
export function fold(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
}

/** Shows the first `step` rows and a button for the rest, so a long roster stays quick on a phone. */
export function useShowMore<T>(rows: T[], step = 60) {
  const [limit, setLimit] = React.useState(step)
  const shown = rows.slice(0, limit)
  const more =
    rows.length > limit ? (
      <Button variant="outline" size="sm" className="w-full" onClick={() => setLimit((n) => n + step)}>
        Xem thêm ({rows.length - limit})
      </Button>
    ) : null
  return { shown, more }
}

