"use client"

import * as React from "react"
import Link from "next/link"
import type { BookingStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * The desk's own controls. Same names and props as components/ui, drawn for a
 * workspace: compact, square-ish, neutral, one dark primary per row. The shop's
 * rounded rose buttons stay in the shop.
 */

type ButtonVariant = "primary" | "dark" | "highlight" | "outline" | "soft" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0"
const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white shadow-sm hover:bg-ink-soft",
  dark: "bg-ink text-white shadow-sm hover:bg-ink-soft",
  highlight: "bg-accent text-white shadow-sm hover:bg-accent-dark",
  outline: "border border-line bg-surface text-ink shadow-sm hover:bg-subtle",
  soft: "border border-line bg-surface text-ink shadow-sm hover:bg-subtle",
  ghost: "text-ink-soft hover:bg-subtle hover:text-ink",
  danger: "border border-danger/30 bg-surface text-danger shadow-sm hover:bg-danger-soft",
}
const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-9 px-3.5 text-[13px]",
  lg: "h-10 px-4 text-sm",
}

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgb(16_24_40/0.04)]", className)} {...props} />
}

/** A card with a title row: the unit most of the desk is made of. */
export function Panel({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <Card className={className}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
            {description && <p className="mt-0.5 text-meta text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </Card>
  )
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong/60 bg-surface px-6 py-10 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-meta text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-subtle-strong/60", className)} />
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-meta font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-label text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  "h-9 w-full rounded-md border border-line-strong/70 bg-surface px-3 text-body text-ink shadow-sm placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent"
const TONE: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-soft ring-line",
  success: "bg-success-soft text-success ring-success/15",
  warning: "bg-warning-soft text-warning ring-warning/15",
  danger: "bg-danger-soft text-danger ring-danger/15",
  info: "bg-[#EEF4FF] text-[#2F55B5] ring-[#2F55B5]/15",
  accent: "bg-accent-soft text-accent-dark ring-accent/15",
}

/** A short state word in a tinted box. */
export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-label font-medium ring-1 ring-inset", TONE[tone], className)}
      {...props}
    />
  )
}

const STATUS: Record<BookingStatus, { label: string; tone: Tone }> = {
  pending: { label: "Chờ nhận", tone: "warning" },
  confirmed: { label: "Đã xác nhận", tone: "info" },
  in_progress: { label: "Đang làm", tone: "info" },
  completed: { label: "Hoàn thành", tone: "success" },
  declined: { label: "Từ chối", tone: "neutral" },
  cancelled: { label: "Đã huỷ", tone: "neutral" },
  expired: { label: "Hết hạn", tone: "neutral" },
  no_show: { label: "Vắng mặt", tone: "danger" },
}

export function StatusBadge({ status, label }: { status: BookingStatus; label?: string }) {
  const s = STATUS[status] ?? { label: status, tone: "neutral" as const }
  return <Badge tone={s.tone}>{label ?? s.label}</Badge>
}

// Tables ---------------------------------------------------------------------------

/** A data table that scrolls sideways on a phone instead of squeezing its columns. */
export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-body">{children}</table>
      </div>
    </Card>
  )
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn("whitespace-nowrap border-b border-line bg-subtle/70 px-3 py-2 text-label font-medium uppercase tracking-wide text-muted first:pl-4 last:pr-4", className)}
      {...props}
    />
  )
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-line px-3 py-2.5 align-middle first:pl-4 last:pr-4", className)} {...props} />
}

/** A row; `expanded` holds a form under it (lock, reset) across every column. */
export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-subtle/50 [&:last-child>td]:border-b-0", className)} {...props} />
}

/** The count and paging line under a table. */
export function TableFoot({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-2 text-label text-muted">{children}</div>
}
