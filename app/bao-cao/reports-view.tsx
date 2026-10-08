"use client"

import * as React from "react"
import Link from "next/link"
import { Flag } from "lucide-react"
import { EvidenceGrid, EvidencePicker } from "@/components/evidence-picker"
import { ReportButton } from "@/components/report-button"
import { Button, Card, EmptyState, inputClass } from "@/components/ui"
import { addReportEvidence, type MyReport } from "@/lib/api/me"
import { removeEvidence } from "@/lib/uploads"
import { useApp, useRefresh } from "@/lib/store"
import { cn, timeAgo } from "@/lib/utils"

/** Reasons offered here, where a report may be about the app as much as about a person. */
const GENERAL_REASONS = [
  "Sự cố trong buổi làm",
  "Chất lượng không như cam kết",
  "Hành vi không phù hợp",
  "Không đến / không liên lạc được",
  "Giá khác với báo giá",
  "Lỗi ứng dụng",
  "Thanh toán, ví, phí",
  "Tài khoản, đăng nhập",
  "Góp ý khác",
] as const

const STATUS: Record<MyReport["status"], { label: string; tone: string }> = {
  open: { label: "Đã gửi, chờ xem", tone: "bg-subtle text-ink-soft" },
  reviewing: { label: "Đang xử lý", tone: "bg-warning-soft text-warning" },
  resolved: { label: "Đã xử lý", tone: "bg-success-soft text-success" },
  rejected: { label: "Đã xem, không vi phạm", tone: "bg-subtle text-muted" },
}

export function ReportsView({ reports, error }: { reports: MyReport[]; error: string | null }) {
  const state = useApp()
  const refresh = useRefresh()
  const [writing, setWriting] = React.useState(reports.length === 0)
  const [bookingId, setBookingId] = React.useState("")

  const isPro = state.session?.role === "pro"
  const recent = [...state.bookings].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).slice(0, 20)
  const booking = recent.find((b) => b.id === bookingId)

  return (
    <div className="space-y-4">
      <Card className="p-4 text-[13px] text-ink-soft">
        <p>
          Gặp vấn đề trong lúc dùng 360dep hoặc sau buổi làm? Gửi cho đội ngũ kèm ảnh, clip làm bằng chứng. Đội ngũ xem trong 24 giờ làm
          việc, có thể hỏi thêm thông tin, và báo kết quả cho bạn tại đây.
        </p>
        <p className="mt-1.5">Báo cáo chỉ bạn và đội ngũ 360dep thấy, phía bên kia không biết ai báo.</p>
      </Card>

      {writing ? (
        <Card className="space-y-3 p-4">
          {recent.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-soft">Liên quan lịch hẹn nào? (không bắt buộc)</span>
              <select className={cn(inputClass, "text-sm")} value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
                <option value="">Không liên quan lịch hẹn cụ thể</option>
                {recent.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.date.split("-").reverse().join("/")} {b.time} · {b.serviceName} · {isPro ? b.customerName : b.proName}
                  </option>
                ))}
              </select>
            </label>
          )}
          <ReportButton
            key={bookingId}
            startOpen
            reasons={GENERAL_REASONS}
            bookingId={booking?.id ?? null}
            targetAccountId={booking && isPro ? booking.customerId : null}
            onClose={() => setWriting(false)}
            onSent={() => refresh()}
          />
        </Card>
      ) : (
        <Button onClick={() => setWriting(true)}>
          <Flag className="size-4" /> Gửi báo cáo mới
        </Button>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <h2 className="pt-2 text-sm font-semibold">Báo cáo của bạn</h2>
      {reports.length === 0 ? (
        <EmptyState title="Bạn chưa gửi báo cáo nào" text="Khi gửi, báo cáo và kết quả xử lý hiện ở đây." />
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} id={r.id} className="scroll-mt-20">
              <ReportItem report={r} onChanged={refresh} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReportItem({ report: r, onChanged }: { report: MyReport; onChanged: () => void }) {
  const [adding, setAdding] = React.useState(false)
  const open = r.status === "open" || r.status === "reviewing"
  const status = STATUS[r.status]
  return (
    <Card className={cn("p-4", r.staffQuestion && open && "ring-2 ring-warning/40")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", status.tone)}>{status.label}</span>
        <span className="text-sm font-semibold">{r.reason}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        Gửi {timeAgo(r.createdAt)}
        {r.bookingId && (
          <>
            {" · "}
            <Link href={`/bookings/${r.bookingId}`} className="underline underline-offset-2">
              Xem lịch hẹn
            </Link>
          </>
        )}
      </p>
      {r.detail && <p className="mt-2 whitespace-pre-wrap text-[13px]">{r.detail}</p>}
      {r.evidence.length > 0 && <EvidenceGrid items={r.evidence} />}
      {r.staffQuestion && open && (
        <p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-[13px]">
          <b>360dep cần thêm thông tin:</b> {r.staffQuestion}
        </p>
      )}
      {r.resolution && !open && (
        <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-[13px]">
          <b>Kết quả:</b> {r.resolution}
        </p>
      )}
      {open &&
        (adding ? (
          <AddEvidence report={r} onDone={() => {
              setAdding(false)
              onChanged()
            }} onCancel={() => setAdding(false)} />
        ) : (
          <Button size="sm" variant={r.staffQuestion ? "primary" : "ghost"} className="mt-3" onClick={() => setAdding(true)}>
            {r.staffQuestion ? "Trả lời & gửi thêm bằng chứng" : "Bổ sung thông tin, ảnh, clip"}
          </Button>
        ))}
    </Card>
  )
}


function AddEvidence({ report, onDone, onCancel }: { report: MyReport; onDone: () => void; onCancel: () => void }) {
  const [note, setNote] = React.useState("")
  const [paths, setPaths] = React.useState<string[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const room = 8 - report.evidence.length

  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      <textarea
        aria-label="Thông tin bổ sung"
        rows={3}
        maxLength={1000}
        className={cn(inputClass, "resize-none text-sm")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={report.staffQuestion ? "Trả lời câu hỏi của 360dep" : "Thêm chi tiết bạn nhớ ra, hoặc diễn biến mới"}
      />
      {room > 0 ? (
        <EvidencePicker max={room} onChange={setPaths} onBusyChange={setUploading} />
      ) : (
        <p className="text-[11px] text-muted">Báo cáo đã đủ 8 ảnh, clip.</p>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void removeEvidence(paths)
            onCancel()
          }}
        >
          Huỷ
        </Button>
        <Button
          size="sm"
          disabled={busy || uploading || (!note.trim() && !paths.length)}
          onClick={async () => {
            setBusy(true)
            setError(null)
            const result = await addReportEvidence(report.id, paths, note)
            setBusy(false)
            if (!result.ok) return setError(result.error)
            onDone()
          }}
        >
          {uploading ? "Đang tải tệp…" : busy ? "Đang gửi…" : "Gửi bổ sung"}
        </Button>
      </div>
    </div>
  )
}
