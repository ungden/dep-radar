"use client"

import * as React from "react"
import Link from "next/link"
import { Button, Card, EmptyState, PageHeader, StatusBadge, Tabs, inputClass } from "@/components/ui"
import { decideCheck, resolveReport, setSuspended } from "@/lib/api/admin"
import type { AdminBooking, AdminPro, AdminReport, PendingCheck } from "@/lib/api/admin"
import { useRefresh } from "@/lib/store"
import type { BookingStatus } from "@/lib/types"
import { cn, formatPrice, timeAgo } from "@/lib/utils"

type Tab = "checks" | "pros" | "bookings" | "reports"

/**
 * The operations desk: the queue of verifications a vision model was unsure
 * about, the freelancer roster, recent bookings and the report inbox. Every
 * button calls an RPC that checks `is_admin()` again in the database.
 */
export function AdminDesk({
  checks,
  pros,
  bookings,
  reports,
}: {
  checks: PendingCheck[]
  pros: AdminPro[]
  bookings: AdminBooking[]
  reports: AdminReport[]
}) {
  const [tab, setTab] = React.useState<Tab>(checks.length ? "checks" : "pros")
  const [error, setError] = React.useState<string | null>(null)
  const refresh = useRefresh()

  const run = async (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    const result = await fn()
    setError(result.ok ? null : result.error)
    refresh()
  }

  const openReports = reports.filter((r) => r.status === "open" || r.status === "reviewing")

  return (
    <div className="mx-auto max-w-4xl md:pt-4">
      <PageHeader title="Vận hành" />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "checks", label: `Xác minh (${checks.length})` },
          { value: "pros", label: `Chuyên viên (${pros.length})` },
          { value: "bookings", label: "Lịch hẹn" },
          { value: "reports", label: `Báo cáo (${openReports.length})` },
        ]}
      />

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {tab === "checks" && (
        <div className="mt-4 space-y-3">
          {checks.length === 0 && <EmptyState title="Không có hồ sơ nào chờ duyệt" />}
          {checks.map((check) => (
            <CheckCard key={check.id} check={check} onDecide={(ok, reason) => run(() => decideCheck(check.id, ok, reason))} />
          ))}
        </div>
      )}

      {tab === "pros" && (
        <ul className="mt-4 space-y-2">
          {pros.map((pro) => (
            <li key={pro.id}>
              <Card className="flex flex-wrap items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    <Link href={`/pros/${pro.slug}`} className="hover:underline">
                      {pro.name}
                    </Link>
                    <Flag on={pro.identity === "verified"} label="Đã xác minh" />
                    <Flag on={!pro.published} label="Chưa công khai" tone="muted" />
                    <Flag on={pro.suspended} label="Tạm khoá" tone="danger" />
                  </p>
                  <p className="text-xs text-muted">
                    {pro.district}, {pro.city} · {pro.completedJobs} job · ★ {pro.rating.toFixed(2)} ({pro.ratingCount}) ·
                    ví {formatPrice(pro.wallet)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={pro.suspended ? "soft" : "ghost"}
                  onClick={() => run(() => setSuspended(pro.id, !pro.suspended))}
                >
                  {pro.suspended ? "Mở khoá" : "Tạm khoá"}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {tab === "bookings" && (
        <ul className="mt-4 space-y-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <Card className="flex flex-wrap items-center gap-3 p-3.5 text-sm">
                <StatusBadge status={b.status as BookingStatus} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {b.customerName} → {b.proName}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {b.date} {b.time} · {b.serviceLabel}
                  </span>
                </span>
                <span className="font-semibold">{formatPrice(b.total)}</span>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {tab === "reports" && (
        <div className="mt-4 space-y-2">
          {reports.length === 0 && <EmptyState title="Chưa có báo cáo nào" />}
          {reports.map((r) => (
            <Card key={r.id} className="p-3.5">
              <p className="text-sm font-semibold">{r.reason}</p>
              <p className="text-xs text-muted">
                {r.reporter} · {timeAgo(r.createdAt)} · {r.status}
              </p>
              {r.detail && <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-[13px]">{r.detail}</p>}
              {(r.status === "open" || r.status === "reviewing") && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => run(() => resolveReport(r.id, "rejected"))}>
                    Bỏ qua
                  </Button>
                  <Button size="sm" onClick={() => run(() => resolveReport(r.id, "resolved"))}>
                    Đã xử lý
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckCard({ check, onDecide }: { check: PendingCheck; onDecide: (approve: boolean, reason: string) => void }) {
  const [reason, setReason] = React.useState("")
  return (
    <Card className="p-4">
      <p className="font-semibold">
        <Link href={`/pros/${check.proSlug}`} className="hover:underline">
          {check.proName}
        </Link>
      </p>
      <p className="mt-0.5 text-xs text-muted">Gửi {timeAgo(check.createdAt)}</p>

      {/* What the model actually said, so the decision is made on evidence. */}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] sm:grid-cols-4">
        <Fact label="Tên trên thẻ" value={check.nameOnCard || "—"} />
        <Fact label="Khớp tên hồ sơ" value={check.nameMatches === null ? "—" : check.nameMatches ? "Có" : "Không"} />
        <Fact label="Cùng một người" value={check.samePerson ?? "—"} />
        <Fact label="Độ chắc chắn" value={check.confidence === null ? "—" : `${Math.round(check.confidence * 100)}%`} />
      </dl>
      {check.reason && <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-[13px] text-ink-soft">{check.reason}</p>}

      <input
        className={cn(inputClass, "mt-3 text-sm")}
        placeholder="Lý do (gửi cho chuyên viên nếu từ chối)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onDecide(false, reason.trim())}>
          Từ chối
        </Button>
        <Button size="sm" onClick={() => onDecide(true, reason.trim())}>
          Duyệt xác minh
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Ảnh CCCD và selfie không được lưu, nên quyết định dựa trên kết quả AI ở trên. Nếu cần xem lại ảnh, yêu cầu chuyên
        viên gửi lại.
      </p>
    </Card>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function Flag({ on, label, tone = "success" }: { on: boolean; label: string; tone?: "success" | "muted" | "danger" }) {
  if (!on) return null
  const tones = {
    success: "bg-success-soft text-success",
    muted: "bg-canvas text-muted",
    danger: "bg-danger-soft text-danger",
  }
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tones[tone])}>{label}</span>
}
