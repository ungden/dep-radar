"use client"

import * as React from "react"
import { Flag } from "lucide-react"
import { Button, Card, inputClass } from "@/components/ui"
import { fileReport } from "@/lib/api/me"
import { cn } from "@/lib/utils"

/**
 * Reporting a problem. It goes into the admin queue with whatever context the
 * page has, so the person on the other end is not starting from "something
 * happened". Deliberately plain: somebody using this is not having a good day.
 */
const REASONS = [
  "Hành vi không phù hợp",
  "Chất lượng không như cam kết",
  "Không đến / không liên lạc được",
  "Giá khác với báo giá",
  "Ảnh tác phẩm không phải của họ",
  "Khác",
]

export function ReportButton({
  bookingId,
  targetAccountId,
  label = "Báo cáo vấn đề",
}: {
  bookingId?: string | null
  targetAccountId?: string | null
  label?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState(REASONS[0])
  const [detail, setDetail] = React.useState("")
  const [state, setState] = React.useState<"form" | "sent">("form")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted underline underline-offset-2 hover:text-ink"
      >
        <Flag className="size-3.5" /> {label}
      </button>
    )
  }

  if (state === "sent") {
    return (
      <Card className="p-4 text-[13px] text-ink-soft">
        <p className="font-semibold text-ink">Đã gửi báo cáo</p>
        <p className="mt-1">
          Đội ngũ dep360 sẽ xem và liên hệ nếu cần thêm thông tin. Việc bạn báo cáo không hiển thị với phía bên kia.
        </p>
      </Card>
    )
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold">Báo cáo vấn đề</p>
      <select
        aria-label="Lý do"
        className={cn(inputClass, "text-sm")}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      >
        {REASONS.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <textarea
        aria-label="Mô tả"
        rows={3}
        className={cn(inputClass, "resize-none text-sm")}
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="Kể lại chuyện gì đã xảy ra, càng cụ thể càng dễ xử lý."
      />
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Huỷ
        </Button>
        <Button
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError(null)
            const result = await fileReport({ reason, detail, bookingId, targetAccountId })
            setBusy(false)
            if (!result.ok) return setError(result.error)
            setState("sent")
          }}
        >
          {busy ? "Đang gửi…" : "Gửi báo cáo"}
        </Button>
      </div>
    </Card>
  )
}
