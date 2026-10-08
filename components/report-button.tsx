"use client"

import * as React from "react"
import Link from "next/link"
import { Flag } from "lucide-react"
import { EvidencePicker } from "@/components/evidence-picker"
import { Button, Card, inputClass } from "@/components/ui"
import { fileReport } from "@/lib/api/me"
import { removeEvidence } from "@/lib/uploads"
import { cn } from "@/lib/utils"

/**
 * Reporting a problem. It goes into the admin queue with whatever context the
 * page has, so the person on the other end is not starting from "something
 * happened". Deliberately plain: somebody using this is not having a good day.
 */
export const REPORT_REASONS = [
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
  startOpen = false,
  onClose,
  reasons = REPORT_REASONS,
  onSent,
}: {
  bookingId?: string | null
  targetAccountId?: string | null
  label?: string
  /** Show the form straight away, e.g. inside a menu that was opened to report. */
  startOpen?: boolean
  /** Called when the form is dismissed with "Huỷ". */
  onClose?: () => void
  /** The reasons offered, first one picked. */
  reasons?: readonly string[]
  onSent?: (reportId: string) => void
}) {
  const [open, setOpen] = React.useState(startOpen)
  const [reason, setReason] = React.useState<string>(reasons[0])
  const [evidence, setEvidence] = React.useState<string[]>([])
  const [uploading, setUploading] = React.useState(false)
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
          Đội ngũ 360dep sẽ xem trong 24 giờ làm việc và liên hệ nếu cần thêm thông tin. Việc bạn báo cáo không hiển thị với phía bên kia.
        </p>
        <Link href="/bao-cao" className="mt-2 inline-block font-semibold text-accent underline underline-offset-2">
          Theo dõi và bổ sung trong Báo cáo của tôi
        </Link>
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
        {reasons.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <textarea
        aria-label="Mô tả"
        rows={3}
        className={cn(inputClass, "resize-none text-sm")}
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="Kể lại chuyện gì đã xảy ra: lúc nào, ở đâu, ai liên quan. Càng cụ thể càng dễ xử lý."
      />
      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-soft">Ảnh, clip làm bằng chứng (nếu có)</p>
        <EvidencePicker onChange={setEvidence} onBusyChange={setUploading} />
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Files picked for a report that is not sent go with it.
            void removeEvidence(evidence)
            setOpen(false)
            onClose?.()
          }}
        >
          Huỷ
        </Button>
        <Button
          size="sm"
          disabled={busy || uploading}
          onClick={async () => {
            if (detail.trim().length < 10 && !evidence.length) return setError("Mô tả ngắn gọn chuyện đã xảy ra (ít nhất 10 ký tự) hoặc gửi kèm ảnh, clip.")
            setBusy(true)
            setError(null)
            const result = await fileReport({ reason, detail, bookingId, targetAccountId, evidencePaths: evidence })
            setBusy(false)
            if (!result.ok) return setError(result.error)
            setState("sent")
            onSent?.(result.data)
          }}
        >
          {uploading ? "Đang tải tệp…" : busy ? "Đang gửi…" : "Gửi báo cáo"}
        </Button>
      </div>
    </Card>
  )
}
