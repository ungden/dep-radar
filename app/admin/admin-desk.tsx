"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button, Card, EmptyState, PageHeader, StatusBadge, Tabs, inputClass } from "@/components/ui"
import { decideCheck, overrideAiDecision, recordTopup, resolveReport, setSuspended } from "@/lib/api/admin"
import type { AdminBooking, AdminPro, AdminReport, AiDecisionItem, OwnClientRank, PendingCheck } from "@/lib/api/admin"
import { useRefresh } from "@/lib/store"
import type { BookingStatus } from "@/lib/types"
import { cn, formatPrice, timeAgo } from "@/lib/utils"

type Tab = "checks" | "pros" | "topup" | "bookings" | "reports" | "ai" | "own"

/**
 * The operations desk: the queue of verifications a vision model was unsure
 * about, the freelancer roster, recent bookings, the report inbox, the log of
 * what the AI reviewer decided, and who brings their own clients. Every button calls an RPC that checks
 * `is_admin()` again in the database.
 */
export function AdminDesk({
  checks,
  pros,
  bookings,
  reports,
  aiLog,
  ranking,
}: {
  checks: PendingCheck[]
  pros: AdminPro[]
  bookings: AdminBooking[]
  reports: AdminReport[]
  aiLog: { items: AiDecisionItem[]; last24h: number }
  ranking: OwnClientRank[]
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
          { value: "topup", label: "Nạp ví" },
          { value: "bookings", label: "Lịch hẹn" },
          { value: "reports", label: `Báo cáo (${openReports.length})` },
          { value: "ai", label: `Nhật ký AI (${aiLog.last24h})` },
          { value: "own", label: "Kéo khách" },
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
                    ví <span className={pro.wallet < 0 ? "font-semibold text-danger" : undefined}>{formatPrice(pro.wallet)}</span>
                    {pro.payCode && <> · mã nạp {pro.payCode}</>}
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

      {tab === "topup" && <TopupForm pros={pros} onDone={refresh} />}

      {tab === "own" && <OwnClientTable ranking={ranking} />}

      {tab === "ai" && (
        <AiLog
          log={aiLog}
          onOverride={(id, decision, note) => run(() => overrideAiDecision(id, decision, note))}
        />
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

/**
 * Staff record a transfer they saw on the bank statement: find the freelancer
 * by the code in the memo ("DEPAB23CD"), their slug or name, then the amount
 * and the bank's reference. record_topup checks is_admin() again.
 */
function TopupForm({ pros, onDone }: { pros: AdminPro[]; onDone: () => void }) {
  const [query, setQuery] = React.useState("")
  const [picked, setPicked] = React.useState<AdminPro | null>(null)
  const [amount, setAmount] = React.useState("")
  const [reference, setReference] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null)

  // The memo pasted whole ("DEPAB23CD") works too.
  const q = query.trim().replace(/^dep\s*(?=[a-z0-9]{6}$)/i, "").toLowerCase()
  const matches = q
    ? pros
        .filter(
          (p) =>
            p.payCode?.toLowerCase() === q ||
            p.slug.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            (q.length >= 3 && p.payCode?.toLowerCase().includes(q)),
        )
        .slice(0, 8)
    : []
  const value = Number(amount.replace(/\D/g, ""))
  // Fresh numbers after a refresh: the roster is re-read on the server.
  const current = picked ? (pros.find((p) => p.id === picked.id) ?? picked) : null

  return (
    <Card className="mt-4 space-y-4 p-4">
      <div>
        <p className="font-semibold">Ghi nhận nạp ví</p>
        <p className="text-[13px] text-muted">
          Dùng khi thấy tiền chuyển vào tài khoản 360dep mà ví chưa tự cộng. Nhập mã giao dịch của ngân hàng để cùng một khoản không
          bị cộng hai lần.
        </p>
      </div>

      {current ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2.5 text-sm">
          <span className="min-w-0">
            <span className="block font-semibold">{current.name}</span>
            <span className="block text-xs text-muted">
              {current.slug}
              {current.payCode ? ` · mã nạp ${current.payCode}` : ""} · ví {formatPrice(current.wallet)}
            </span>
          </span>
          <Button size="sm" variant="ghost" onClick={() => setPicked(null)}>
            Đổi
          </Button>
        </div>
      ) : (
        <div>
          <input
            className={cn(inputClass, "text-sm")}
            placeholder="Mã nạp (VD: AB23CD), slug hoặc tên"
            aria-label="Tìm người làm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {q && (
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
              {matches.length === 0 && <li className="px-3 py-2.5 text-sm text-muted">Không tìm thấy ai.</li>}
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(p)
                      setResult(null)
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-subtle"
                  >
                    <span className="min-w-0 truncate">
                      <b>{p.name}</b> <span className="text-muted">· {p.slug}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">{p.payCode ?? "—"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={cn(inputClass, "text-sm")}
          inputMode="numeric"
          placeholder="Số tiền (đ)"
          aria-label="Số tiền"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className={cn(inputClass, "text-sm")}
          placeholder="Mã giao dịch ngân hàng"
          aria-label="Mã giao dịch ngân hàng"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>

      <Button
        disabled={!current || !value || busy}
        onClick={async () => {
          if (!current) return
          setBusy(true)
          const outcome = await recordTopup(current.id, value, reference)
          setBusy(false)
          if (!outcome.ok) return setResult({ ok: false, text: outcome.error })
          setResult({ ok: true, text: `Đã cộng ${formatPrice(value)} vào ví của ${current.name}. Người làm được báo trong app.` })
          setAmount("")
          setReference("")
          onDone()
        }}
      >
        {busy ? "Đang ghi…" : value ? `Cộng ${formatPrice(value)} vào ví` : "Cộng vào ví"}
      </Button>

      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={cn("rounded-xl px-3.5 py-2.5 text-sm", result.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}
        >
          {result.text}
        </p>
      )}
    </Card>
  )
}

const DECISION_LABEL: Record<string, string> = {
  approved: "Duyệt",
  changes_requested: "Cần sửa",
  rejected: "Từ chối",
  hidden: "Ẩn bài",
  kept: "Giữ bài",
  nudged: "Nhắc nhở",
  skipped: "Chưa quyết",
}
const DECISION_TONE: Record<string, string> = {
  approved: "bg-success-soft text-success",
  kept: "bg-success-soft text-success",
  changes_requested: "bg-warning-soft text-warning",
  rejected: "bg-danger-soft text-danger",
  hidden: "bg-danger-soft text-danger",
  nudged: "bg-canvas text-ink-soft",
  skipped: "bg-canvas text-muted",
}
const SUBJECT_LABEL: Record<string, string> = { pro_profile: "Hồ sơ", work: "Bài đăng", follow_up: "Nhắc nhở" }

type AiFilter = "all" | "approved" | "changes_requested" | "rejected" | "hidden" | "nudged" | "overridden"
const AI_FILTERS: { value: AiFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "approved", label: "Duyệt" },
  { value: "changes_requested", label: "Cần sửa" },
  { value: "rejected", label: "Từ chối" },
  { value: "hidden", label: "Ẩn ảnh" },
  { value: "nudged", label: "Nhắc nhở" },
  { value: "overridden", label: "Đã đảo" },
]

/** What reversing a decision means: a profile flips approve ↔ reject, a post hide ↔ show. Null for reminders. */
function reversal(item: AiDecisionItem): { decision: string; label: string } | null {
  const current = item.overrideDecision ?? item.decision
  if (item.subject === "pro_profile") {
    return current === "approved" ? { decision: "rejected", label: "Từ chối hồ sơ" } : { decision: "approved", label: "Duyệt hồ sơ" }
  }
  if (item.subject === "work") {
    return current === "hidden" ? { decision: "kept", label: "Hiện lại bài" } : { decision: "hidden", label: "Ẩn bài" }
  }
  return null
}

/** Only photos from our storage: next/image serves nothing else, and the log may hold a foreign link. */
const storagePhoto = (url: string) => /^https?:\/\/[^/]+\/storage\/v1\/object\/public\//.test(url)

/**
 * The AI reviewer's log (ai_decisions), newest first. Each row is what the AI
 * (or the rules, model "rules") decided and why; "Đảo quyết định" applies the
 * opposite, records who did it next to the AI's answer, and tells the partner.
 */
function AiLog({
  log,
  onOverride,
}: {
  log: { items: AiDecisionItem[]; last24h: number }
  onOverride: (id: string, decision: string, note: string) => Promise<void>
}) {
  const [filter, setFilter] = React.useState<AiFilter>("all")
  const shown = log.items.filter((item) => {
    const current = item.overrideDecision ?? item.decision
    if (filter === "all") return true
    if (filter === "overridden") return Boolean(item.overriddenAt)
    return current === filter
  })

  return (
    <div className="mt-4 space-y-3">
      <p className="text-[13px] text-muted">
        {log.last24h} quyết định trong 24 giờ qua. Hồ sơ đối tác mới do AI duyệt, bài đăng mới do AI kiểm tra; nhân viên xem lại ở đây và
        đảo quyết định khi cần. Đối tác được báo mỗi lần đảo.
      </p>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {AI_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-semibold",
              filter === f.value ? "border-ink bg-ink text-canvas" : "border-line text-ink-soft hover:bg-subtle",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 && <EmptyState title="Chưa có quyết định nào" />}
      {shown.map((item) => (
        <AiDecisionCard key={item.id} item={item} onOverride={onOverride} />
      ))}
    </div>
  )
}

function AiDecisionCard({
  item,
  onOverride,
}: {
  item: AiDecisionItem
  onOverride: (id: string, decision: string, note: string) => Promise<void>
}) {
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const flip = reversal(item)
  const current = item.overrideDecision ?? item.decision
  const photos = item.photos.filter(storagePhoto).slice(0, 4)

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", DECISION_TONE[current] ?? "bg-canvas text-muted")}>
          {DECISION_LABEL[current] ?? current}
        </span>
        <span className="text-xs font-semibold text-ink-soft">{SUBJECT_LABEL[item.subject] ?? item.subject}</span>
        {item.proSlug ? (
          <Link href={`/pros/${item.proSlug}`} className="text-sm font-semibold hover:underline">
            {item.proName}
          </Link>
        ) : (
          <span className="text-sm font-semibold">{item.proName}</span>
        )}
        <span className="ml-auto text-xs text-muted" title={new Date(item.createdAt).toLocaleString("vi-VN")}>
          {timeAgo(item.createdAt)}
        </span>
      </div>
      {item.workTitle && <p className="mt-1 text-[13px] text-ink-soft">Bài: {item.workTitle}</p>}
      {item.summary && <p className="mt-2 text-sm">{item.summary}</p>}
      {item.reasons.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[13px] text-ink-soft">
          {item.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      {photos.length > 0 && (
        <div className="mt-3 flex gap-2">
          {photos.map((src) => (
            <a key={src} href={src} target="_blank" rel="noreferrer" className="relative size-16 overflow-hidden rounded-lg bg-subtle">
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </a>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-muted">
        {item.model === "rules" ? "Theo quy tắc (không có AI)" : `Model: ${item.model}`}
        {item.overriddenAt && (
          <>
            {" "}
            · AI quyết “{DECISION_LABEL[item.decision] ?? item.decision}”, {item.overriddenBy ?? "nhân viên"} đổi thành “
            {DECISION_LABEL[item.overrideDecision ?? ""] ?? item.overrideDecision}” {timeAgo(item.overriddenAt)}
            {item.overrideNote ? `: ${item.overrideNote}` : ""}
          </>
        )}
      </p>

      {flip &&
        (open ? (
          <div className="mt-3 space-y-2">
            <input
              className={cn(inputClass, "text-sm")}
              placeholder="Ghi chú (gửi cho đối tác, không bắt buộc)"
              aria-label="Ghi chú khi đảo quyết định"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Thôi
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  await onOverride(item.id, flip.decision, note.trim())
                  setBusy(false)
                  setOpen(false)
                  setNote("")
                }}
              >
                {busy ? "Đang lưu…" : flip.label}
              </Button>
            </div>
          </div>
        ) : (
          <Button className="mt-3" size="sm" variant="ghost" onClick={() => setOpen(true)}>
            Đảo quyết định
          </Button>
        ))}
    </Card>
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

/** Partners ranked by the clients their own QR code and booking link bring in. */
function OwnClientTable({ ranking }: { ranking: OwnClientRank[] }) {
  if (!ranking.length)
    return <EmptyState title="Chưa có đối tác nào kéo khách" text="Khi khách mở trang đối tác từ mã QR hoặc link riêng của họ, số liệu hiện ở đây." />
  return (
    <div className="mt-4 overflow-x-auto">
      <p className="mb-3 text-[13px] text-muted">
        Khách tự mang về: khách mới vào từ QR hoặc link riêng của đối tác. Lịch của họ với đối tác đó tính hoa hồng thấp.
      </p>
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="text-xs text-muted">
          <tr>
            <th className="py-2 pr-2 font-medium">#</th>
            <th className="py-2 pr-2 font-medium">Đối tác</th>
            <th className="py-2 pr-2 text-right font-medium">Lượt mở 30 ngày</th>
            <th className="py-2 pr-2 text-right font-medium">Khách mang về</th>
            <th className="py-2 pr-2 text-right font-medium">Lịch đã xong</th>
            <th className="py-2 text-right font-medium">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.proId} className="border-t border-line">
              <td className="py-2.5 pr-2 text-muted">{i + 1}</td>
              <td className="py-2.5 pr-2 font-semibold">
                <Link href={`/pros/${r.slug}`} className="hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{r.visits30d}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{r.clients}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{r.completed}</td>
              <td className="py-2.5 text-right tabular-nums">{formatPrice(r.gmv)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
