"use client"

import * as React from "react"
import { BriefcaseBusiness, Car, Send } from "lucide-react"
import { RequestCard } from "@/components/request-card"
import { RequireSession } from "@/components/require-session"
import { Button, Chip, EmptyState, PageHeader, inputClass } from "@/components/ui"
import { getTemplate, getVariant, isPriceAllowed } from "@/lib/catalog"
import { actions, distanceToCustomer, proView, quoteFor, useApp } from "@/lib/store"
import type { JobPost } from "@/lib/types"
import { cn, formatPrice } from "@/lib/utils"

export default function StudioJobsPage() {
  return (
    <div className="mx-auto max-w-3xl md:pt-4">
      <PageHeader title="Việc mới" />
      <RequireSession role="pro">
        <JobBoard />
      </RequireSession>
    </div>
  )
}

function JobBoard() {
  const state = useApp()
  const proId = state.session!.proId!
  const pro = proView(state, proId)!
  const [scope, setScope] = React.useState<"match" | "all" | "offered">("match")

  const withDistance = state.jobs
    .filter((j) => !j.mine)
    .map((j) => ({ job: j, km: distanceToCustomer(state, proId, { city: j.city, district: j.district, detail: "" }) }))

  const jobs = withDistance
    .filter(({ job, km }) => {
      const offered = job.offers.some((o) => o.proId === proId)
      if (scope === "offered") return offered
      if (job.status !== "open") return false
      if (scope === "match") return pro.categories.includes(getTemplate(job.templateId)!.category) && km !== null && km <= pro.maxTravelKm
      return true
    })
    .sort((a, b) => a.job.date.localeCompare(b.job.date))

  return (
    <>
      {!state.acceptingJobs && (
        <p className="mb-3 rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">
          Bạn đang tạm nghỉ nhận job. Bật lại ở trang Tổng quan để gửi báo giá.
        </p>
      )}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={scope === "match"} onClick={() => setScope("match")}>
          Phù hợp (≤ {pro.maxTravelKm} km)
        </Chip>
        <Chip active={scope === "all"} onClick={() => setScope("all")}>
          Tất cả
        </Chip>
        <Chip active={scope === "offered"} onClick={() => setScope("offered")}>
          Đã báo giá
        </Chip>
      </div>
      {jobs.length ? (
        <ul className="space-y-3">
          {jobs.map(({ job, km }) => {
            const canOffer = pro.categories.includes(getTemplate(job.templateId)!.category) && km !== null && km <= pro.maxTravelKm
            return (
              <li key={job.id} id={job.id} className="scroll-mt-20">
                <RequestCard
                  job={job}
                  href={`/studio/jobs#${job.id}`}
                  extra={
                    <span className="inline-flex items-center gap-1 text-ink-soft">
                      <Car className="size-3.5" />
                      {km === null ? "Khác tỉnh" : `~${km.toLocaleString("vi-VN")} km`}
                    </span>
                  }
                  footer={
                    <OfferBox
                      job={job}
                      proId={proId}
                      disabled={!state.acceptingJobs || !canOffer}
                      reason={!canOffer ? "Ngoài chuyên môn hoặc phạm vi di chuyển của bạn" : undefined}
                    />
                  }
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          icon={<BriefcaseBusiness className="size-6" />}
          title={scope === "offered" ? "Bạn chưa gửi báo giá nào" : "Chưa có việc mới"}
          text="Việc mới từ khách quanh khu vực của bạn sẽ hiện ở đây."
        />
      )}
    </>
  )
}

function OfferBox({ job, proId, disabled, reason }: { job: JobPost; proId: string; disabled: boolean; reason?: string }) {
  const state = useApp()
  const variant = getVariant(job.templateId, job.variantId)!
  const existing = job.offers.find((o) => o.proId === proId)
  const [open, setOpen] = React.useState(false)
  const [price, setPrice] = React.useState(variant.suggestedPrice)
  const [message, setMessage] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const others = job.offers.filter((o) => o.proId !== proId).length

  if (existing) {
    const tone =
      existing.status === "accepted" ? "bg-success-soft text-success" : existing.status === "rejected" ? "bg-canvas text-muted" : "bg-blush text-rose-dark"
    return (
      <div className={cn("mt-3 flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-[13px]", tone)}>
        <span>
          {existing.status === "accepted"
            ? `Khách đã chọn bạn · ${formatPrice(existing.price)}`
            : existing.status === "rejected"
              ? "Khách đã chọn freelancer khác"
              : `Đã gửi báo giá ${formatPrice(existing.price)}`}
        </span>
        {existing.status === "pending" && (
          <button type="button" onClick={() => actions.withdrawOffer(job.id)} className="font-medium underline underline-offset-2">
            Rút lại
          </button>
        )}
      </div>
    )
  }

  if (!open) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="text-xs text-muted">{reason ?? (others ? `${others} freelancer đã báo giá` : "Chưa có ai báo giá")}</span>
        <Button size="sm" disabled={disabled} onClick={() => setOpen(true)}>
          Gửi báo giá
        </Button>
      </div>
    )
  }

  const allowed = isPriceAllowed(variant, price)
  const quote = quoteFor(state, {
    proId,
    price: allowed ? price : variant.suggestedPrice,
    atHome: job.atHome,
    address: { city: job.city, district: job.district, detail: job.addressDetail },
    date: job.date,
    time: job.time,
  })

  return (
    <form
      className="mt-3 space-y-3 border-t border-line pt-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (message.trim().length < 10) return setError("Lời nhắn cần ít nhất 10 ký tự.")
        const err = actions.sendOffer(job.id, price, message.trim())
        if (err) setError(err)
        else setOpen(false)
      }}
    >
      <div>
        <div className="flex items-center justify-between text-[13px]">
          <label htmlFor={`price-${job.id}`} className="text-muted">
            Giá dịch vụ
          </label>
          <span className="font-semibold">{formatPrice(price)}</span>
        </div>
        <input
          id={`price-${job.id}`}
          type="range"
          min={variant.minPrice}
          max={variant.maxPrice}
          step={5000}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-rose)]"
        />
        <div className="flex justify-between text-[11px] text-muted">
          <span>{formatPrice(variant.minPrice)}</span>
          <button type="button" className="text-rose" onClick={() => setPrice(variant.suggestedPrice)}>
            Giá gợi ý {formatPrice(variant.suggestedPrice)}
          </button>
          <span>{formatPrice(variant.maxPrice)}</span>
        </div>
      </div>

      <div className="rounded-xl bg-canvas px-3 py-2.5 text-xs text-ink-soft">
        <div className="flex justify-between">
          <span>Khách trả (gồm phí di chuyển/gấp)</span>
          <b className="text-ink">{formatPrice(quote.total)}</b>
        </div>
        <div className="flex justify-between">
          <span>Hoa hồng dep360 ({Math.round(quote.commissionRate * 100)}%)</span>
          <span>−{formatPrice(quote.commission)}</span>
        </div>
        <div className="flex justify-between font-semibold text-success">
          <span>Bạn nhận</span>
          <span>{formatPrice(quote.payout)}</span>
        </div>
      </div>

      <textarea
        aria-label="Lời nhắn cho khách"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Bạn sẽ làm thế nào, đã có mẫu tương tự chưa, có mang đủ dụng cụ không…"
        className={cn(inputClass, "resize-none text-sm")}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Huỷ
        </Button>
        <Button type="submit" size="sm">
          <Send className="size-3.5" /> Gửi báo giá
        </Button>
      </div>
    </form>
  )
}
