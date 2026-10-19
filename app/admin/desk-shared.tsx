"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Badge, Button, Skeleton, inputClass } from "./ui"
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

/** One row of filters, with how many each would show: a segmented bar that scrolls on a phone. */
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
    <div role="group" aria-label={label} className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="inline-flex gap-0.5 rounded-lg border border-line bg-subtle p-0.5">
        {items.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            aria-pressed={value === f.value}
            className={cn(
              "inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium transition-colors",
              value === f.value ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
            )}
          >
            {f.label}
            {f.count !== undefined && (
              <span className={cn("tabular-nums text-[11px]", value === f.value ? "text-ink-soft" : "text-muted")}>{f.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        className={cn(inputClass, "pl-9")}
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
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  )
}

export function PanelError({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-body text-danger">
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
  return <Badge tone={tone === "muted" ? "neutral" : tone}>{label}</Badge>
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
      <Button variant="outline" size="sm" className="mx-auto mt-1 flex" onClick={() => setLimit((n) => n + step)}>
        Xem thêm ({rows.length - limit})
      </Button>
    ) : null
  return { shown, more }
}

