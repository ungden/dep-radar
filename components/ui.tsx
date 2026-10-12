"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Star } from "lucide-react"
import type { BookingStatus } from "@/lib/types"
import { BRAND_DARK, BRAND_GOLD, LOGO_EYE_PATH, LOGO_EYE_STROKE, LOGO_EYE_STROKE_SMALL, LOGO_RADIUS, WORDMARK_BOX, WORDMARK_PATH } from "@/lib/design/brand"
import { showsAverage } from "@/lib/connection"
import { cn, initials } from "@/lib/utils"

type ButtonVariant = "primary" | "dark" | "highlight" | "outline" | "soft" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]"
const buttonVariants: Record<ButtonVariant, string> = {
  // Rose is the action; ink is for search and confirmations that sit next to
  // it; gold invites (become a partner, the hero), always with ink text.
  primary: "bg-accent text-white shadow-[0_6px_16px_-8px_rgb(187_52_96/0.6)] hover:bg-accent-dark",
  dark: "bg-ink text-white hover:bg-ink-soft",
  highlight: "bg-highlight text-ink hover:brightness-95",
  outline: "border border-line bg-surface text-ink hover:border-ink",
  soft: "bg-subtle text-ink hover:bg-subtle-strong",
  ghost: "text-ink-soft hover:bg-subtle hover:text-ink",
  danger: "border border-danger/40 bg-surface text-danger hover:bg-danger-soft",
}
const buttonSizes: Record<ButtonSize, string> = {
  // Visible controls themselves meet the touch target minimum.
  sm: "min-h-11 rounded-full px-4 py-2 text-meta",
  md: "min-h-12 rounded-full px-5 py-2.5 text-body",
  lg: "min-h-14 rounded-full px-7 py-3 text-body",
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

/** The mark: a white serif "đ" on rose (lib/design/brand.ts). Reads at 16px. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 32 32" className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx={LOGO_RADIUS} fill={BRAND_DARK} />
      <path
        d={LOGO_EYE_PATH}
        fill="none"
        stroke={BRAND_GOLD}
        strokeWidth={size < 24 ? LOGO_EYE_STROKE_SMALL : LOGO_EYE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * "360đẹp" in Noto Serif Display, drawn from outlines (lib/design/brand.ts) so
 * it never waits for a font. `size` is the cap height the eye reads at, like a
 * font size. Espresso on light pages, champagne (`tone="gold"`) on dark.
 */
export function Wordmark({ className, size = 24, tone = "dark" }: { className?: string; size?: number; tone?: "dark" | "gold" }) {
  const height = size * 0.92
  return (
    <svg
      role="img"
      aria-label="360đẹp"
      height={height}
      width={(height * WORDMARK_BOX.width) / WORDMARK_BOX.height}
      viewBox={`0 0 ${WORDMARK_BOX.width} ${WORDMARK_BOX.height}`}
      className={cn("shrink-0", className)}
    >
      <path d={WORDMARK_PATH} fill={tone === "gold" ? BRAND_GOLD : BRAND_DARK} />
    </svg>
  )
}

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const lg = size === "lg"
  return (
    <span className={cn("inline-flex items-center", lg ? "gap-3" : "gap-2.5", className)}>
      <LogoMark size={lg ? 44 : 32} />
      <Wordmark size={lg ? 36 : 28} />
    </span>
  )
}

export function Avatar({
  name,
  tone = "#EDE7E0",
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
        "relative inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-meta font-semibold transition-colors",
        active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink",
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line bg-surface shadow-[0_1px_2px_rgb(28_24_18/0.03)]", className)} {...props} />
}

/** A freelancer's rating. With a count under three it says "Mới" rather than an average of one or two reviews. */
export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  if (count !== undefined && !showsAverage(count))
    return (
      <span className={cn("inline-flex items-center gap-1 text-meta text-ink-soft", className)}>
        <span className="font-medium text-ink">Mới</span>
        {count > 0 && <span className="text-muted">· {count} đánh giá</span>}
      </span>
    )
  return (
    <span className={cn("inline-flex items-center gap-1 text-meta text-ink-soft", className)}>
      <Star className="size-3.5 fill-highlight text-[#D9A21F]" aria-hidden />
      <span className="font-medium text-ink">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  )
}

const STATUS: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "Chờ nhận lịch", className: "bg-warning-soft text-warning" },
  confirmed: { label: "Đã xác nhận", className: "bg-success-soft text-success" },
  in_progress: { label: "Đang làm", className: "bg-success-soft text-success" },
  completed: { label: "Hoàn thành", className: "bg-ink text-white" },
  declined: { label: "Bị từ chối", className: "bg-danger-soft text-danger" },
  cancelled: { label: "Đã huỷ", className: "bg-canvas text-muted" },
  expired: { label: "Hết hạn chờ", className: "bg-canvas text-muted" },
  no_show: { label: "Khách vắng mặt", className: "bg-danger-soft text-danger" },
}

export function StatusBadge({ status, label }: { status: BookingStatus; label?: string }) {
  const s = STATUS[status]
  return <span className={cn("rounded-full px-2.5 py-1 text-label font-semibold", s.className)}>{label ?? s.label}</span>
}

export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-label font-medium text-ink-soft", className)}
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
    <div className={cn("sticky top-0 z-30 -mx-4 mb-2 flex h-14 items-center gap-2 border-b border-line/70 bg-canvas/90 px-4 backdrop-blur-md md:static md:mx-0 md:mb-4 md:h-auto md:border-0 md:px-0 md:pt-8 md:bg-transparent", className)}>
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
      {title && <h1 className={cn("flex-1 truncate text-lead font-bold tracking-tight md:text-[30px] md:font-extrabold md:leading-tight", back && "text-center md:text-left")}>{title}</h1>}
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
    <div role="tablist" className={cn("no-scrollbar flex gap-4 overflow-x-auto border-b border-line md:gap-6", className)}>
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
            "relative min-h-12 shrink-0 pb-3 pt-1 text-meta transition-colors sm:text-body",
            value === it.value ? "font-bold text-ink" : "font-medium text-muted hover:text-ink",
          )}
        >
          {it.label}
          {value === it.value && <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-ink" />}
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
      {icon && <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-highlight-soft text-ink">{icon}</div>}
      <p className="text-lead font-bold">{title}</p>
      {text && <p className="mt-1.5 max-w-xs text-body text-ink-soft">{text}</p>}
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
  return <div className={cn("animate-pulse rounded-[var(--radius-lg)] bg-subtle", className)} />
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
      <span className="mb-1.5 block text-meta font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-label text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  "min-h-[52px] w-full rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-3 text-body text-ink placeholder:text-muted transition-shadow focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/[0.06]"

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative flex h-12 w-14 shrink-0 items-center justify-center rounded-lg focus-visible:outline-ink disabled:opacity-50"
    >
      <span aria-hidden className={cn("relative h-7 w-12 rounded-full transition-colors", checked ? "bg-success" : "bg-line-strong")}><span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all", checked ? "left-6" : "left-1")} /></span>
    </button>
  )
}

export function BottomBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      <div className="h-24 md:hidden" />
      <div
        className={cn(
          "pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pt-3 shadow-[0_-8px_24px_-16px_rgb(28_24_18/0.18)] backdrop-blur-md md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none",
          className,
        )}
      >
        <div className="mx-auto max-w-2xl pb-3 md:pb-0">{children}</div>
      </div>
    </>
  )
}
