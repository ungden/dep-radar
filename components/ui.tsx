"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Star } from "lucide-react"
import type { BookingStatus } from "@/lib/types"
import { cn, initials } from "@/lib/utils"

type ButtonVariant = "primary" | "outline" | "soft" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,transform] duration-150 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]"
const buttonVariants: Record<ButtonVariant, string> = {
  // The main action is black; the accent is kept for marks, not buttons.
  primary: "bg-accent text-white hover:bg-accent-dark",
  outline: "border border-line bg-surface text-ink hover:border-ink/40",
  soft: "bg-subtle text-ink hover:bg-subtle-strong",
  ghost: "text-ink-soft hover:bg-subtle",
  danger: "border border-danger/40 bg-surface text-danger hover:bg-danger-soft",
}
const buttonSizes: Record<ButtonSize, string> = {
  // 36px is below the 44px recommendation, so a small button keeps a larger
  // invisible hit area around it.
  sm: "h-9 rounded-full px-4 text-[13px] [&]:relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
  md: "h-11 rounded-full px-5 text-sm font-semibold",
  lg: "h-13 rounded-full px-7 text-[15px] font-semibold",
}

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}

/** The mark: a lens ring with a red "recording" dot. Reads at 16px. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 32 32" className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="var(--color-accent)" />
      <circle cx="15.5" cy="16.5" r="7.6" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="24" cy="8" r="2.8" fill="#F6E6E6" />
    </svg>
  )
}

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const lg = size === "lg"
  return (
    <span className={cn("inline-flex items-center", lg ? "gap-3" : "gap-2", className)}>
      <LogoMark size={lg ? 44 : 28} />
      <span className={cn("font-display font-bold leading-none tracking-[-0.02em] text-accent", lg ? "text-[36px]" : "text-[24px]")}>
        360dep
      </span>
    </span>
  )
}

export function Avatar({
  name,
  tone = "#EAD6D0",
  src,
  size = 44,
  className,
}: {
  name: string
  tone?: string
  src?: string
  size?: number
  className?: string
}) {
  if (src) {
    return (
      <span aria-hidden className={cn("relative inline-block shrink-0 overflow-hidden rounded-full", className)} style={{ width: size, height: size, background: tone }}>
        <Image src={src} alt="" fill sizes={`${size * 2}px`} className="object-cover" />
      </span>
    )
  }
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink-soft", className)}
      style={{ width: size, height: size, background: tone, fontSize: Math.max(11, size * 0.34) }}
    >
      {initials(name)}
    </span>
  )
}

export function Chip({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        active ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:border-ink/30",
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line bg-surface", className)} {...props} />
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px] text-ink-soft", className)}>
      <Star className="size-3.5 fill-ink text-ink" aria-hidden />
      <span className="font-medium text-ink">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  )
}

const STATUS: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "Chờ gọi xác nhận", className: "bg-warning-soft text-warning" },
  confirmed: { label: "Đã xác nhận", className: "bg-success-soft text-success" },
  in_progress: { label: "Đang làm", className: "bg-success-soft text-success" },
  completed: { label: "Hoàn thành", className: "bg-subtle text-ink" },
  declined: { label: "Bị từ chối", className: "bg-danger-soft text-danger" },
  cancelled: { label: "Đã huỷ", className: "bg-canvas text-muted" },
  expired: { label: "Hết hạn chờ", className: "bg-canvas text-muted" },
  no_show: { label: "Khách vắng mặt", className: "bg-danger-soft text-danger" },
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS[status]
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", s.className)}>{s.label}</span>
}

export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-ink-soft", className)}
      {...props}
    />
  )
}

export function PageHeader({
  title,
  back,
  onBack,
  action,
  className,
}: {
  title?: React.ReactNode
  back?: boolean | string
  onBack?: () => void
  action?: React.ReactNode
  className?: string
}) {
  const router = useRouter()
  return (
    <div className={cn("sticky top-0 z-30 -mx-4 mb-2 flex h-14 items-center gap-2 bg-canvas/90 px-4 backdrop-blur md:static md:mx-0 md:px-0 md:bg-transparent", className)}>
      {back && (
        <button
          type="button"
          aria-label="Quay lại"
          onClick={() => (onBack ? onBack() : typeof back === "string" ? router.push(back) : router.back())}
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-subtle"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      {title && <h1 className={cn("flex-1 truncate text-[17px] font-bold md:text-2xl md:font-bold", back && "text-center md:text-left")}>{title}</h1>}
      {!title && <div className="flex-1" />}
      <div className={cn("flex min-w-10 justify-end", !action && back && "md:hidden")}>{action}</div>
    </div>
  )
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T
  onChange: (v: T) => void
  items: { value: T; label: React.ReactNode }[]
  className?: string
}) {
  /**
   * A tablist that declares ARIA has to behave like one: arrow keys move between
   * tabs, and only the selected tab is in the tab order. Without this a keyboard
   * user tabs through every tab to reach the content.
   */
  const move = (from: number, delta: number) => {
    const next = (from + delta + items.length) % items.length
    onChange(items[next].value)
    // Focus follows selection, which is the expected behaviour for this pattern.
    requestAnimationFrame(() => {
      document.getElementById(`tab-${items[next].value}`)?.focus()
    })
  }

  return (
    <div role="tablist" className={cn("no-scrollbar flex gap-6 overflow-x-auto border-b border-line", className)}>
      {items.map((it, index) => (
        <button
          key={it.value}
          id={`tab-${it.value}`}
          role="tab"
          type="button"
          aria-selected={value === it.value}
          tabIndex={value === it.value ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault()
              move(index, 1)
            } else if (e.key === "ArrowLeft") {
              e.preventDefault()
              move(index, -1)
            } else if (e.key === "Home") {
              e.preventDefault()
              move(index, -index)
            } else if (e.key === "End") {
              e.preventDefault()
              move(index, items.length - 1 - index)
            }
          }}
          onClick={() => onChange(it.value)}
          className={cn(
            "relative shrink-0 pb-3 pt-1 text-[15px] transition-colors",
            value === it.value ? "font-semibold text-accent" : "font-medium text-muted hover:text-ink",
          )}
        >
          {it.label}
          {value === it.value && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: React.ReactNode
  title: string
  text?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-subtle text-ink">{icon}</div>}
      <p className="text-[17px] font-bold">{title}</p>
      {text && <p className="mt-1.5 max-w-xs text-[15px] text-ink-soft">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Standard route-level loading placeholder (used as Suspense fallback). */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-3 pt-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải…</span>
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-subtle", className)} />
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-subtle-strong")}
    >
      <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all", checked ? "left-6" : "left-1")} />
    </button>
  )
}

export function BottomBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      <div className="h-24 md:hidden" />
      <div
        className={cn(
          "pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0",
          className,
        )}
      >
        <div className="mx-auto max-w-2xl pb-3 md:pb-0">{children}</div>
      </div>
    </>
  )
}
