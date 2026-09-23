"use client"

import { cn } from "@/lib/utils"

/**
 * A typed price next to a slider: a slider in 5.000đ steps across a
 * 1.000.000đ band is hard to land on an exact number with a thumb. Out-of-band
 * values are kept (not silently clamped) so the form can say what is wrong.
 */
export function PriceInput({
  value,
  onChange,
  min,
  max,
  step = 5000,
  label,
  className,
}: {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  /** The database only stores prices in 5.000đ steps. */
  step?: number
  label: string
  className?: string
}) {
  const outside = value < min || value > max || value % step !== 0
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center rounded-[var(--radius-sm)] border bg-surface pr-2.5 focus-within:border-accent",
        outside ? "border-danger" : "border-line",
        className,
      )}
    >
      <input
        aria-label={label}
        aria-invalid={outside}
        inputMode="numeric"
        className="h-full w-28 rounded-[var(--radius-sm)] bg-transparent px-2.5 text-right text-[15px] font-semibold tabular-nums text-ink focus:outline-none"
        value={value ? value.toLocaleString("vi-VN") : ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 9)
          onChange(digits ? Number(digits) : 0)
        }}
      />
      <span className="text-[13px] text-muted">đ</span>
    </span>
  )
}
