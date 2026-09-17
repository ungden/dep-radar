"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { CATEGORY_ICON } from "@/components/beauty"
import { Card } from "@/components/ui"
import { categoryLabel } from "@/lib/data"
import type { JobPost } from "@/lib/types"
import { cn, formatDateLong, formatPrice } from "@/lib/utils"

export function JobStatusLabel({ job }: { job: JobPost }) {
  const map = {
    open: ["Đang nhận báo giá", "bg-warning-soft text-warning"],
    booked: ["Đã chốt", "bg-success-soft text-success"],
    closed: ["Đã đóng", "bg-canvas text-muted"],
  } as const
  const [label, cls] = map[job.status]
  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", cls)}>{label}</span>
}

export function RequestCard({ job, href, footer }: { job: JobPost; href: string; footer?: React.ReactNode }) {
  const Icon = CATEGORY_ICON[job.category]
  const pendingOffers = job.offers.filter((o) => o.status === "pending").length
  return (
    <Card className="p-4">
      <Link href={href} className="block">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blush text-rose">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold leading-snug">{job.title}</p>
              <JobStatusLabel job={job} />
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {categoryLabel(job.category)} · {job.district}, {job.city} · {job.atHome ? "Tại nhà" : "Tại studio"}
            </p>
            <p className="mt-2 line-clamp-2 text-[13px] text-ink-soft">{job.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
              <span>
                {formatDateLong(job.date)} · {job.time}
              </span>
              <span className="font-semibold">
                {formatPrice(job.budgetMin)} - {formatPrice(job.budgetMax)}
              </span>
              {job.mine && (
                <span className="ml-auto inline-flex items-center gap-0.5 text-rose">
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
