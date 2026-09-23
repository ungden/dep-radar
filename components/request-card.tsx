"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { CATEGORY_ICON } from "@/components/beauty"
import { Card } from "@/components/ui"
import { getTemplate, getVariant } from "@/lib/catalog"
import type { JobPost } from "@/lib/types"
import { cn, formatDateLong, formatDuration, formatPrice } from "@/lib/utils"

export function JobStatusLabel({ job }: { job: JobPost }) {
  const map = {
    open: ["Đang nhận báo giá", "bg-warning-soft text-warning"],
    booked: ["Đã chốt", "bg-success-soft text-success"],
    closed: ["Đã đóng", "bg-canvas text-muted"],
  } as const
  const [label, cls] = map[job.status]
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>{label}</span>
}

export function RequestCard({ job, href, footer, extra }: { job: JobPost; href: string; footer?: React.ReactNode; extra?: React.ReactNode }) {
  const tpl = getTemplate(job.templateId)!
  const variant = getVariant(job.templateId, job.variantId)!
  const Icon = CATEGORY_ICON[tpl.category]
  const pendingOffers = job.offers.filter((o) => o.status === "pending").length
  return (
    <Card className="p-4">
      <Link href={href} className="block">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-subtle text-accent">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold leading-snug">
                {tpl.name} <span className="font-normal text-muted">· {variant.label}</span>
                {job.quantity > 1 && <span className="ml-1.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 align-middle text-xs font-semibold text-accent-dark">{job.quantity} người</span>}
              </p>
              <JobStatusLabel job={job} />
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {job.district}, {job.city} · {job.atHome ? "Tại nhà khách" : "Khách đến studio"} ·{" "}
              {formatDuration(variant.durationMin * (variant.perPerson ? Math.max(1, job.quantity) : 1))}
            </p>
            {job.description && <p className="mt-2 line-clamp-2 text-[13px] text-ink-soft">{job.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
              <span>
                {formatDateLong(job.date)} · {job.time}
              </span>
              <span className="text-ink-soft">
                Khung giá <b className="text-ink">{formatPrice(variant.minPrice)} – {formatPrice(variant.maxPrice)}</b>
                {job.quantity > 1 && " / người"}
              </span>
              {extra}
              {job.mine && (
                <span className="ml-auto inline-flex items-center gap-0.5 text-accent">
                  {job.offers.length} báo giá{pendingOffers && job.status === "open" ? " mới" : ""}
                  <ChevronRight className="size-4" />
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      {footer}
    </Card>
  )
}
