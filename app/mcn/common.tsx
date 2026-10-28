"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { Button, Card } from "@/components/ui"
import type { ActionResult } from "@/lib/api/actions"
import type { McnMemberStatus, McnStatus } from "@/lib/mcn-types"
import { cn } from "@/lib/utils"
import { POLICY } from "@/lib/pricing"
import { MCN_POLICY } from "@/lib/mcn"

export function useMcnAction() {
  const router = useRouter()
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [refreshing, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null)
  const run = async (action: () => Promise<ActionResult<unknown>>, success: string) => {
    if (lock.current) return false
    lock.current = true
    setBusy(true)
    setFeedback(null)
    try {
      const result = await action()
      setFeedback({ error: !result.ok, text: result.ok ? success : result.error })
      if (result.ok) startTransition(() => router.refresh())
      return result.ok
    } catch {
      setFeedback({ error: true, text: "Chưa kết nối được với hệ thống. Tải lại để kiểm tra kết quả trước khi thử lại." })
      return false
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return { run, busy: busy || refreshing, feedback }
}

export type McnAction = ReturnType<typeof useMcnAction>

export function McnFeedback({ value }: { value: McnAction["feedback"] }) {
  if (!value) return null
  const Icon = value.error ? AlertCircle : CheckCircle2
  return <div role={value.error ? "alert" : "status"} className={cn("flex gap-2 rounded-xl border p-4 text-meta", value.error ? "border-danger/20 bg-danger-soft text-danger" : "border-success/20 bg-success-soft text-success")}><Icon className="mt-0.5 size-4 shrink-0" aria-hidden /><p>{value.text}</p></div>
}

export function McnUnavailable({ error }: { error: string | null }) {
  const router = useRouter()
  return <Card className="p-6"><h2 className="text-lead font-bold">Chưa tải được dữ liệu MCN</h2><p className="mt-2 text-body text-ink-soft">{error ?? "Vui lòng tải lại trang sau ít phút."}</p><Button className="mt-4" variant="outline" onClick={() => router.refresh()}><RefreshCw className="size-4" aria-hidden />Tải lại</Button></Card>
}

const ORG_STATUS: Record<McnStatus, [string, string]> = {
  pending: ["Chờ xét duyệt", "bg-warning-soft text-warning"],
  approved: ["Đang hoạt động", "bg-success-soft text-success"],
  rejected: ["Chưa được duyệt", "bg-danger-soft text-danger"],
  suspended: ["Tạm dừng", "bg-danger-soft text-danger"],
}
const MEMBER_STATUS: Record<McnMemberStatus, string> = {
  invited: "Chờ KTV xác nhận", active: "Đang đồng hành", declined: "Đã từ chối", left: "KTV đã rời", removed: "Đã kết thúc", expired: "Hết hạn lời mời",
}
export function McnStatusBadge({ status }: { status: McnStatus }) {
  const [text, color] = ORG_STATUS[status]
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-label font-semibold", color)}>{text}</span>
}
export function McnMemberBadge({ status }: { status: McnMemberStatus }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-label font-medium", status === "active" ? "bg-success-soft text-success" : "bg-subtle text-ink-soft")}>{MEMBER_STATUS[status]}</span>
}
export function mcnDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return "—"
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(date)
}
export function McnSplit({ compact = false, policy = MCN_POLICY }: { compact?: boolean; policy?: import("@/lib/mcn-admin-types").McnPolicy }) {
  const feePercent = Math.round(POLICY.commissionRate * 100)
  const mcnPercent = feePercent * policy.feeShareRate
  return <div className={cn("rounded-[var(--radius-lg)] bg-highlight-soft", compact ? "p-4" : "p-5")}><p className="text-meta font-bold">Phí hiện tại: KTV {100 - feePercent}% · MCN {mcnPercent}% · Sàn {feePercent - mcnPercent}%</p><p className="mt-2 text-meta leading-relaxed text-ink-soft">MCN nhận {policy.feeShareRate * 100}% khoản phí dịch vụ thực tế sau làm tròn, trích từ phí của sàn. KTV không đóng thêm phí MCN; nhận toàn bộ phí di chuyển và đặt gấp. Mỗi lịch hẹn lưu điều khoản tại thời điểm tạo.</p></div>
}
