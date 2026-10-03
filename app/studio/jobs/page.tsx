"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BriefcaseBusiness, Car } from "lucide-react"
import { FEE_ANCHOR, FEE_BLOCK_REASON, FeeDueCard, useFeeOwed } from "@/components/fee-due"
import { RequestCard } from "@/components/request-card"
import { RequireSession } from "@/components/require-session"
import { Button, Chip, EmptyState, PageHeader, buttonClass } from "@/components/ui"
import { jobEligibility } from "@/lib/api/actions"
import type { JobEligibility } from "@/lib/types"
import { actions } from "@/lib/client-actions"
import { POLICY, commissionFor } from "@/lib/pricing"
import { distanceToCustomer, proView, useApp, useRefresh } from "@/lib/store"
import type { JobPost } from "@/lib/types"
import { formatPrice } from "@/lib/utils"

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

/** take_job's answer when someone else was first. */
const TAKEN = "Đã có người nhận việc này."

/**
 * Requests customers posted. Every freelancer who can do one is told, and the
 * first to press "Nhận việc" gets it at the posted price (take_job): a
 * confirmed booking, and the chat opens. Nothing to quote or wait for.
 */
function JobBoard() {
  const state = useApp()
  const owed = useFeeOwed()
  const proId = state.session!.proId!
  const pro = proView(state, proId)!
  const [scope, setScope] = React.useState<"match" | "all">("match")
  // Taken by someone else while this page was open.
  const [gone, setGone] = React.useState<string[]>([])
  const [notice, setNotice] = React.useState<string | null>(null)
  const refresh = useRefresh()

  // Another freelancer can take a request at any moment, and once taken it is
  // no longer theirs to read, so no change feed would say so: re-read the board
  // every 20 seconds while it is on screen, and on coming back to the tab.
  React.useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") refresh()
    }
    const t = setInterval(tick, 20_000)
    document.addEventListener("visibilitychange", tick)
    return () => {
      clearInterval(t)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [refresh])

  const [eligibility, setEligibility] = React.useState<JobEligibility[]>([])
  const [loadError, setLoadError] = React.useState<string | null>(null)
  React.useEffect(() => { let live = true; void jobEligibility(state.jobs.filter((j) => !j.mine && j.status === "open").map((j) => j.id)).then((r) => { if (live) { setEligibility(r); setLoadError(null) } }).catch((e: Error) => { if (live) setLoadError(e.message) }); return () => { live = false } }, [state.jobs])
  const jobs = state.jobs
    .filter((j) => !j.mine && j.status === "open" && !gone.includes(j.id))
    .map((j) => ({ job: j, km: distanceToCustomer(state, proId, { city: j.city, district: j.district, detail: "" }) }))
    .filter(({ job }) =>
      scope === "match"
        ? eligibility.some((e) => e.id === job.id && !e.reason)
        : true,
    )
    .sort((a, b) => `${a.job.date}${a.job.time}`.localeCompare(`${b.job.date}${b.job.time}`))

  return (
    <>
      <p className="mb-3 text-[13px] text-ink-soft">
        Khách đăng yêu cầu với giá cố định. Ai bấm Nhận việc trước sẽ có lịch hẹn đã xác nhận, và nhắn tin được với khách ngay.
      </p>
      <FeeDueCard className="mb-4" />
      {!state.acceptingJobs && (
        <p className="mb-3 rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">
          Bạn đang tạm nghỉ nhận khách. Bật lại ở trang Tổng quan để nhận việc.
        </p>
      )}
      {notice && (
        <p role="status" className="mb-3 rounded-2xl bg-canvas px-4 py-3 text-[13px] text-ink-soft">
          {notice}
        </p>
      )}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={scope === "match"} onClick={() => setScope("match")}>
          Phù hợp (≤ {pro.maxTravelKm} km)
        </Chip>
        <Chip active={scope === "all"} onClick={() => setScope("all")}>
          Tất cả
        </Chip>
      </div>
      {jobs.length ? (
        <ul className="space-y-3">
          {jobs.map(({ job, km }) => {
            // Taking needs the service listed, inside the travel radius; the database checks the rest.
            const match = eligibility.find((e) => e.id === job.id)
            const reason = owed > 0 ? FEE_BLOCK_REASON : loadError ?? (match ? match.reason ?? undefined : "Đang kiểm tra điều kiện nhận việc…")
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
                    <TakeBox
                      job={job}
                      reason={reason}
                      verifiedPayout={match?.payout}
                      onTaken={() => {
                        setGone((ids) => [...ids, job.id])
                        setNotice(`${TAKEN} Yêu cầu đã được gỡ khỏi danh sách.`)
                      }}
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
          title="Chưa có việc mới"
          text="Khi khách quanh bạn đăng yêu cầu bạn làm được, bạn được báo ngay và việc hiện ở đây."
        />
      )}
    </>
  )
}

function TakeBox({ job, reason, verifiedPayout, onTaken }: { job: JobPost; reason?: string; verifiedPayout?: number | null; onTaken: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  // Commission is on the service price only; travel and urgent fees are all the freelancer's.
  const service = job.price !== null ? job.price * job.quantity : null
  const payout = verifiedPayout ?? (service !== null ? service - commissionFor(service) : null)

  return (
    <div className="mt-3 border-t border-line pt-3">
      {payout !== null && (
        <p className="text-[13px] text-ink-soft">
          Bạn nhận <b className="text-success">{formatPrice(payout)}</b> sau phí 360dep {Math.round(POLICY.commissionRate * 100)}%, đã gồm phí di chuyển / đặt gấp khi đủ điều kiện.
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">{reason ?? "Nhận trước, được việc."}</span>
        {/* Owing a fee: the button is the payment, above. */}
        {reason === FEE_BLOCK_REASON ? (
          <a href={`#${FEE_ANCHOR}`} className={buttonClass("soft", "sm")}>
            Thanh toán phí
          </a>
        ) : (
        <Button
          size="sm"
          disabled={busy || Boolean(reason)}
          onClick={async () => {
            setBusy(true)
            setError(null)
            const result = await actions.takeJob(job.id)
            setBusy(false)
            if ("id" in result) return router.push(`/bookings/${result.id}`)
            if (result.error === TAKEN) return onTaken()
            setError(result.error)
          }}
        >
          {busy ? "Đang nhận…" : "Nhận việc"}
        </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
