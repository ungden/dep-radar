"use client"

import { useState } from "react"
import { Banknote, CheckCircle2, Clock3, ReceiptText } from "lucide-react"
import { Button, Card, EmptyState } from "@/components/ui"
import type { McnCommission, McnPayout } from "@/lib/mcn-types"
import { cn, formatPrice } from "@/lib/utils"
import { mcnDate } from "./common"

export function McnLedger({ commissions, payouts, onReverse }: { commissions: McnCommission[]; payouts: McnPayout[]; onReverse?: (commission: McnCommission) => void }) {
  const [filter, setFilter] = useState("all")
  const entries = commissions.filter((c) => filter === "all" || (filter === "eligible" ? c.eligible : filter === "held" ? c.status === "held" && !c.eligible : filter === "adjusted" ? c.status === "void" || c.status === "reversed" : c.status === filter))
  const held = commissions.filter((c) => c.status === "held" && !c.eligible).reduce((sum, c) => sum + c.amount, 0)
  const eligible = commissions.filter((c) => c.eligible).reduce((sum, c) => sum + c.amount, 0)
  const debt = commissions.filter((c) => c.status === "reversed" && !c.recoveredAt).reduce((sum, c) => sum + c.amount, 0)
  return <section aria-labelledby="mcn-ledger" className="space-y-4">
    <div><h2 id="mcn-ledger" className="text-xl font-bold">Sổ chia phí & đối soát</h2><p className="mt-2 text-meta leading-relaxed text-ink-soft">Chỉ ghi nhận từ lịch hoàn thành thuộc network tại thời điểm đặt. Giữ ít nhất 7 ngày, chờ thu đủ phí KTV và xử lý xong tranh chấp. Các khoản chưa đủ điều kiện chưa được chuyển.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">{[
      { label: "Đang chờ đủ điều kiện", value: held, icon: Clock3 },
      { label: "Đủ điều kiện trước thu hồi", value: eligible, icon: CheckCircle2 },
      { label: "Cần thu hồi kỳ trước", value: debt, icon: Banknote },
    ].map(({ label, value, icon: Icon }) => <Card key={label} className="p-4"><p className="flex items-center gap-2 text-label text-muted"><Icon className="size-4" aria-hidden />{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{formatPrice(value)}</p></Card>)}</div>
    <label className="block"><span className="sr-only">Lọc khoản chia phí</span><select className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-meta sm:w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Tất cả khoản chia phí</option><option value="eligible">Đủ điều kiện</option><option value="held">Đang chờ</option><option value="paid">Đã thanh toán</option><option value="adjusted">Đã điều chỉnh</option></select></label>
    {entries.length ? <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">{entries.map((entry) => <li key={entry.id} className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{entry.proName}</p><p className="mt-1 text-label text-muted">Mã lịch {entry.bookingCode} · Hoàn thành {mcnDate(entry.completedAt)}</p></div><div className="text-right"><p className="text-lg font-bold tabular-nums">{formatPrice(entry.amount)}</p><CommissionBadge entry={entry} /></div></div><dl className="mt-3 grid grid-cols-2 gap-3 text-meta sm:grid-cols-3"><div><dt className="text-muted">Giá dịch vụ</dt><dd className="mt-0.5">{formatPrice(entry.servicePrice)}</dd></div><div><dt className="text-muted">Tổng phí đã ghi nhận</dt><dd className="mt-0.5">{formatPrice(entry.commission)}</dd></div><div><dt className="text-muted">Sàn giữ lại</dt><dd className="mt-0.5">{formatPrice(entry.platformAmount)}</dd></div></dl>
      {entry.status === "held" && <p className={cn("mt-3 text-meta", entry.eligible ? "text-success" : "text-ink-soft")}>{entry.eligible ? "Đủ điều kiện đối soát; chờ tổng số tiền từ 100.000đ sau thu hồi." : entry.holdReason ?? `Giữ đối soát đến ${mcnDate(entry.availableAt)}.`}</p>}
      {entry.paidAt && <p className="mt-2 text-label text-muted">Ghi nhận chuyển khoản {mcnDate(entry.paidAt)}</p>}
      {entry.adjustmentReason && <p className="mt-2 rounded-lg bg-warning-soft p-3 text-meta leading-relaxed">Điều chỉnh: {entry.adjustmentReason}{entry.status === "reversed" && (entry.recoveredAt ? ` · Đã thu hồi ${mcnDate(entry.recoveredAt)}` : " · Chờ trừ vào kỳ đối soát tiếp theo")}</p>}
      {onReverse && ["held", "paid"].includes(entry.status) && <Button className="mt-3" size="sm" variant="ghost" onClick={() => onReverse(entry)}>Điều chỉnh khoản này</Button>}
    </li>)}</ul> : <Card><EmptyState icon={<ReceiptText className="size-6" />} title="Chưa có khoản chia phí ở mục này" text="Lịch hoàn thành đủ điều kiện ghi nhận sẽ xuất hiện tại đây. Không tính các lịch có trước khi KTV gia nhập." /></Card>}
    <div className="pt-2"><h3 className="text-body font-bold">Lịch sử chuyển khoản</h3>{payouts.length ? <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">{payouts.map((payout) => <li key={payout.id} className="p-4"><div className="flex flex-wrap justify-between gap-2"><p className="text-meta font-semibold">{mcnDate(payout.paidAt)}</p><p className="text-body font-bold text-success">{formatPrice(payout.amount)}</p></div><p className="mt-1 break-all text-label text-muted">Mã giao dịch: {payout.bankReference}</p>{payout.recoveryAmount > 0 && <p className="mt-2 text-meta text-ink-soft">Tổng chia phí {formatPrice(payout.grossAmount)} − thu hồi {formatPrice(payout.recoveryAmount)} = thực chuyển {formatPrice(payout.amount)}</p>}{payout.note && <p className="mt-2 whitespace-pre-wrap text-meta text-ink-soft">{payout.note}</p>}</li>)}</ul> : <p className="mt-2 text-meta text-muted">Chưa có lần chuyển khoản nào được ghi nhận.</p>}</div>
  </section>
}

function CommissionBadge({ entry }: { entry: McnCommission }) {
  const text = entry.status === "paid" ? "Đã thanh toán" : entry.status === "void" ? "Đã huỷ ghi nhận" : entry.status === "reversed" ? "Đã điều chỉnh" : entry.eligible ? "Đủ điều kiện" : "Đang chờ"
  return <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-label", entry.status === "paid" || entry.eligible ? "bg-success-soft text-success" : entry.status === "held" ? "bg-warning-soft text-warning" : "bg-subtle text-muted")}>{text}</span>
}
