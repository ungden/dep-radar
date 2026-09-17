"use client"

import * as React from "react"
import { BriefcaseBusiness, Send } from "lucide-react"
import { RequestCard } from "@/components/request-card"
import { RequireSession } from "@/components/require-session"
import { Button, Chip, EmptyState, PageHeader, inputClass } from "@/components/ui"
import { getPro } from "@/lib/data"
import { actions, useApp } from "@/lib/store"
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
  const pro = getPro(proId)!
  const [scope, setScope] = React.useState<"match" | "all" | "offered">("match")

  const jobs = state.jobs
    .filter((j) => !j.mine)
    .filter((j) => {
      const offered = j.offers.some((o) => o.proId === proId)
      if (scope === "offered") return offered
      if (j.status !== "open") return false
      if (scope === "match") return pro.categories.includes(j.category) && j.city === pro.city
      return true
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      {!state.acceptingJobs && (
        <p className="mb-3 rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">
          Bạn đang tạm nghỉ nhận job. Bật lại ở trang Tổng quan để khách thấy báo giá của bạn.
        </p>
      )}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={scope === "match"} onClick={() => setScope("match")}>
          Phù hợp ({pro.city})
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
          {jobs.map((j) => (
            <li key={j.id} id={j.id} className="scroll-mt-20">
              <RequestCard job={j} href={`/studio/jobs#${j.id}`} footer={<OfferBox job={j} proId={proId} disabled={!state.acceptingJobs} />} />
            </li>
          ))}
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

function OfferBox({ job, proId, disabled }: { job: JobPost; proId: string; disabled: boolean }) {
  const existing = job.offers.find((o) => o.proId === proId)
  const [open, setOpen] = React.useState(false)
  const [price, setPrice] = React.useState(String(Math.round((job.budgetMin + job.budgetMax) / 2 / 10000) * 10000))
  const [message, setMessage] = React.useState("")
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
        <span className="text-xs text-muted">{others ? `${others} freelancer đã báo giá` : "Chưa có ai báo giá"}</span>
        <Button size="sm" disabled={disabled} onClick={() => setOpen(true)}>
          Gửi báo giá
        </Button>
      </div>
    )
  }

  const priceNum = Number(price.replace(/\D/g, ""))
  return (
    <form
      className="mt-3 space-y-2.5 border-t border-line pt-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!priceNum || message.trim().length < 5) return
        actions.sendOffer(job.id, priceNum, message.trim())
        setOpen(false)
      }}
    >
      <div className="flex items-center gap-2">
        <label className="w-20 shrink-0 text-[13px] text-muted" htmlFor={`price-${job.id}`}>
          Giá (đ)
        </label>
        <input
          id={`price-${job.id}`}
          inputMode="numeric"
          className={cn(inputClass, "py-2")}
          value={priceNum ? priceNum.toLocaleString("vi-VN") : price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <textarea
        aria-label="Lời nhắn cho khách"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Giới thiệu ngắn: bạn sẽ làm thế nào, đã có mẫu tương tự chưa, có mang đủ dụng cụ không..."
        className={cn(inputClass, "resize-none text-sm")}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Hủy
        </Button>
        <Button type="submit" size="sm" disabled={!priceNum || message.trim().length < 5}>
          <Send className="size-3.5" /> Gửi báo giá
        </Button>
      </div>
    </form>
  )
}
