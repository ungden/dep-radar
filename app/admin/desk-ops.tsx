"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, BadgeCheck, CalendarClock, CircleAlert, Flag as FlagIcon, Lock, MessageCircleQuestion, Star, Unlock, UserCheck, Wallet } from "lucide-react"
import { Button, Card, EmptyState, StatusBadge, inputClass } from "@/components/ui"
import {
  adminRequests,
  adminReviews,
  setReviewHidden,
  setSuspended,
  type AdminBooking,
  type AdminCasting,
  type AdminJob,
  type AdminOverview,
  type AdminPro,
  type AdminReview,
} from "@/lib/api/admin"
import type { BookingStatus } from "@/lib/types"
import { cn, formatPrice, localDate, localTime, timeAgo } from "@/lib/utils"
import { ActButton, FilterChips, Flag, ListSkeleton, PanelError, SearchBox, fold, useShowMore } from "./desk-shared"
import type { Go, Tab } from "./tabs"

type Run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done?: string) => Promise<boolean>

// Overview ----------------------------------------------------------------------------

/**
 * The desk's front page: the queues that need a person, each a link to its
 * panel with the right filter on; then how today and the last 7 days went.
 */
export function OverviewPanel({
  overview: o,
  approvals,
  checks,
  openReports,
  claims,
  aiLast24h,
  pros,
  walletFloor,
  go,
}: {
  overview: AdminOverview
  approvals: number
  checks: number
  openReports: number
  claims: number
  aiLast24h: number
  pros: AdminPro[]
  walletFloor: number
  go: Go
}) {
  const blocked = pros.filter((p) => p.wallet < walletFloor).length
  const owing = pros.filter((p) => p.wallet < 0).length

  const queues: { n: number; label: string; hint: string; tab: Tab; filter?: string; tone: "danger" | "warning"; icon: React.ComponentType<{ className?: string }> }[] = [
    { n: openReports, label: "Báo cáo chưa xử lý", hint: "Khách và đối tác đang chờ phản hồi", tab: "reports", filter: "open", tone: "danger", icon: FlagIcon },
    { n: claims, label: "Bù phí vắng mặt chờ quyết", hint: "Tranh chấp khách vắng mặt", tab: "reports", filter: "open", tone: "danger", icon: CircleAlert },
    { n: o.overdueConfirm, label: "Lịch quá hạn nhận", hint: "Đối tác chưa bấm nhận, đã qua hạn", tab: "bookings", filter: "overdue", tone: "danger", icon: CalendarClock },
    { n: approvals, label: "Hồ sơ chờ duyệt", hint: "Chỉ hiện với khách khi bạn bấm Duyệt", tab: "approvals", tone: "danger", icon: UserCheck },
    { n: checks, label: "Xác minh danh tính chờ", hint: "AI chưa chắc, cần người xem", tab: "checks", tone: "warning", icon: BadgeCheck },
    { n: blocked, label: "Đối tác bị chặn vì nợ phí", hint: `Ví dưới ${formatPrice(walletFloor)}`, tab: "pros", filter: "blocked", tone: "warning", icon: Wallet },
    { n: o.lowReviews7d, label: "Đánh giá 1–2 sao (7 ngày)", hint: "Xem có vi phạm hay cần hỗ trợ", tab: "reviews", filter: "low", tone: "warning", icon: Star },
    { n: o.uncoveredHelp7d, label: "Câu hỏi trợ lý chưa có trả lời", hint: "Bổ sung vào trang Trợ giúp", tab: "help", tone: "warning", icon: MessageCircleQuestion },
  ]
  const todo = queues.filter((q) => q.n > 0)

  return (
    <div className="space-y-6">
      <section aria-labelledby="todo-title">
        <h2 id="todo-title" className="text-title font-bold">
          Việc cần xử lý
        </h2>
        {todo.length === 0 ? (
          <p className="mt-2 rounded-xl bg-success-soft px-3.5 py-3 text-body font-semibold text-success">Không có việc tồn đọng. Mọi hàng chờ đều trống.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {todo.map((q) => {
              const Icon = q.icon
              return (
                <li key={q.label}>
                  <button
                    type="button"
                    onClick={() => go(q.tab, q.filter)}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-3.5 text-left hover:border-ink"
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                        q.tone === "danger" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-bold">{q.label}</span>
                      <span className="block truncate text-label text-muted">{q.hint}</span>
                    </span>
                    <span className="text-[22px] font-extrabold tabular-nums">{q.n}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="pulse-title">
        <h2 id="pulse-title" className="text-title font-bold">
          Hôm nay và 7 ngày qua
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Lịch hẹn hôm nay" value={o.bookingsToday} onClick={() => go("bookings", "today")} />
          <Stat label="Chờ đối tác nhận" value={o.pendingConfirm} onClick={() => go("bookings", "pending")} />
          <Stat label="Lịch mới (7 ngày)" value={o.created7d} onClick={() => go("bookings")} />
          <Stat label="Hoàn thành (7 ngày)" value={o.completed7d} hint={o.cancelled7d ? `${o.cancelled7d} bị huỷ` : undefined} onClick={() => go("bookings", "completed")} />
          <Stat label="Tài khoản mới (7 ngày)" value={o.newAccounts7d} onClick={() => go("customers")} />
          <Stat label="Đối tác mới (7 ngày)" value={o.newPros7d} hint={o.unpublishedPros ? `${o.unpublishedPros} chưa công khai` : undefined} onClick={() => go("pros", o.unpublishedPros ? "hidden" : undefined)} />
          <Stat label="Yêu cầu đang mở" value={o.openJobs} hint={o.openCastings ? `${o.openCastings} tuyển mẫu đang mở` : undefined} onClick={() => go("requests")} />
          <Stat label="Quyết định AI (24 giờ)" value={aiLast24h} onClick={() => go("ai")} />
        </div>
        {owing > 0 && (
          <p className="mt-2 text-meta text-muted">
            {owing} đối tác đang âm ví (nợ phí).{" "}
            <button type="button" className="font-semibold text-ink underline underline-offset-2" onClick={() => go("pros", "owing")}>
              Xem danh sách
            </button>
          </p>
        )}
      </section>

      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="text-title font-bold">
          Thao tác nhanh
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => go("topup")}>
            Ghi nhận nạp ví
          </Button>
          <Button size="sm" variant="outline" onClick={() => go("finance")}>
            Báo cáo tiền & xuất file kế toán
          </Button>
          <Button size="sm" variant="outline" onClick={() => go("customers")}>
            Tìm tài khoản, đặt lại mật khẩu
          </Button>
          <Button size="sm" variant="outline" onClick={() => go("settings")}>
            Cấu hình & nhật ký quản trị
          </Button>
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value, hint, onClick }: { label: string; value: number; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-[var(--radius-lg)] border border-line bg-surface p-3.5 text-left hover:border-ink">
      <span className="block text-label text-muted">{label}</span>
      <span className="mt-0.5 block text-[24px] font-extrabold tabular-nums">{value}</span>
      {hint && <span className="block text-label text-ink-soft">{hint}</span>}
    </button>
  )
}

// Partners ----------------------------------------------------------------------------

type ProFilter = "all" | "hidden" | "suspended" | "owing" | "blocked" | "verified" | "paused"

/** The roster: find anyone, see who is hidden, locked or owes fees; lock with a reason. */
export function ProsPanel({ pros, walletFloor, initialFilter, run }: { pros: AdminPro[]; walletFloor: number; initialFilter?: string; run: Run }) {
  const [filter, setFilter] = React.useState<ProFilter>(isProFilter(initialFilter) ? initialFilter : "all")
  const [query, setQuery] = React.useState("")
  const [locking, setLocking] = React.useState<string | null>(null)
  const [reason, setReason] = React.useState("")

  const test: Record<ProFilter, (p: AdminPro) => boolean> = {
    all: () => true,
    hidden: (p) => !p.published && !p.suspended,
    suspended: (p) => p.suspended,
    owing: (p) => p.wallet < 0,
    blocked: (p) => p.wallet < walletFloor,
    verified: (p) => p.identity === "verified",
    paused: (p) => !p.acceptingJobs,
  }
  const q = fold(query.trim())
  const rows = pros
    .filter(test[filter])
    .filter((p) => !q || fold(`${p.name} ${p.slug} ${p.payCode ?? ""} ${p.district} ${p.city}`).includes(q))
  const sorted = filter === "owing" || filter === "blocked" ? [...rows].sort((a, b) => a.wallet - b.wallet) : rows
  const { shown, more } = useShowMore(sorted)
  const count = (f: ProFilter) => pros.filter(test[f]).length

  return (
    <div className="space-y-3">
      <SearchBox value={query} onChange={setQuery} placeholder="Tìm theo tên, slug, mã nạp, quận" />
      <FilterChips
        label="Lọc đối tác"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "all", label: "Tất cả", count: pros.length },
          { value: "hidden", label: "Chưa công khai", count: count("hidden") },
          { value: "owing", label: "Nợ phí", count: count("owing") },
          { value: "blocked", label: "Bị chặn nhận việc", count: count("blocked") },
          { value: "suspended", label: "Tạm khoá", count: count("suspended") },
          { value: "paused", label: "Tạm nghỉ", count: count("paused") },
          { value: "verified", label: "Đã xác minh", count: count("verified") },
        ]}
      />
      {sorted.length === 0 ? (
        <EmptyState title="Không có đối tác nào" text={query ? "Thử tìm bằng tên khác hoặc bỏ bộ lọc." : undefined} />
      ) : (
        <ul className="space-y-2">
          {shown.map((pro) => (
            <li key={pro.id}>
              <Card className={cn("p-3.5", pro.suspended && "ring-1 ring-danger/40")}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      <Link href={`/pros/${pro.slug}`} target="_blank" className="hover:underline">
                        {pro.name}
                      </Link>
                      <Flag on={pro.identity === "verified"} label="Đã xác minh" />
                      <Flag on={!pro.published} label="Chưa công khai" tone="muted" />
                      <Flag on={!pro.acceptingJobs} label="Tạm nghỉ" tone="muted" />
                      <Flag on={pro.wallet < walletFloor} label="Bị chặn vì nợ phí" tone="warning" />
                      <Flag on={pro.suspended} label="Tạm khoá" tone="danger" />
                    </p>
                    <p className="text-label text-muted">
                      {[pro.district, pro.city].filter(Boolean).join(", ")} · {pro.completedJobs} job · ★ {pro.rating.toFixed(2)} ({pro.ratingCount}) · ví{" "}
                      <span className={pro.wallet < 0 ? "font-semibold text-danger" : undefined}>{formatPrice(pro.wallet)}</span>
                      {pro.payCode && <> · mã nạp {pro.payCode}</>}
                    </p>
                  </div>
                  {pro.suspended ? (
                    <ActButton size="sm" variant="soft" onClick={() => run(() => setSuspended(pro.id, false), `Đã mở khoá ${pro.name}.`)}>
                      <Unlock className="size-4" /> Mở khoá
                    </ActButton>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setLocking(pro.id)
                        setReason("")
                      }}
                    >
                      <Lock className="size-4" /> Tạm khoá
                    </Button>
                  )}
                </div>
                {locking === pro.id && (
                  <div className="mt-3 space-y-2 rounded-xl bg-danger-soft/60 p-3">
                    <p className="text-meta text-ink-soft">
                      Tạm khoá thì hồ sơ bị ẩn và {pro.name} không nhận được lịch mới. Lịch đã nhận vẫn giữ. Lý do được ghi vào nhật ký.
                    </p>
                    <input
                      className={cn(inputClass, "text-body")}
                      placeholder="Lý do (VD: khách báo không đến nhiều lần)"
                      aria-label="Lý do tạm khoá"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <ActButton
                        size="sm"
                        variant="danger"
                        disabled={reason.trim().length < 5}
                        onClick={async () => {
                          if (await run(() => setSuspended(pro.id, true, reason.trim()), `Đã tạm khoá ${pro.name}.`)) setLocking(null)
                        }}
                      >
                        Tạm khoá đối tác
                      </ActButton>
                      <Button size="sm" variant="ghost" onClick={() => setLocking(null)}>
                        Thôi
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
      {more}
    </div>
  )
}

const isProFilter = (v: unknown): v is ProFilter =>
  typeof v === "string" && ["all", "hidden", "suspended", "owing", "blocked", "verified", "paused"].includes(v)

// Bookings ----------------------------------------------------------------------------

type BookingFilter = "all" | "today" | "pending" | "overdue" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show" | "closed"
const BOOKING_FILTERS: BookingFilter[] = ["all", "today", "pending", "overdue", "confirmed", "in_progress", "completed", "cancelled", "no_show", "closed"]
const KNOWN_STATUS = new Set(["pending", "confirmed", "in_progress", "completed", "declined", "cancelled", "expired", "no_show"])

/** The latest bookings: by status, by name, with the ones nobody accepted in time on top of their filter. */
export function BookingsPanel({ bookings, initialFilter }: { bookings: AdminBooking[]; initialFilter?: string }) {
  const [filter, setFilter] = React.useState<BookingFilter>(
    BOOKING_FILTERS.includes(initialFilter as BookingFilter) ? (initialFilter as BookingFilter) : "all",
  )
  const [query, setQuery] = React.useState("")
  // Fixed for this render pass, so the filters agree with each other.
  const [now] = React.useState(() => Date.now())
  const today = localDate(new Date(now).toISOString())
  const overdue = (b: AdminBooking) => b.status === "pending" && b.confirmBy !== null && new Date(b.confirmBy).getTime() < now

  const test: Record<BookingFilter, (b: AdminBooking) => boolean> = {
    all: () => true,
    today: (b) => b.date === today && !["cancelled", "declined", "expired"].includes(b.status),
    pending: (b) => b.status === "pending",
    overdue,
    confirmed: (b) => b.status === "confirmed",
    in_progress: (b) => b.status === "in_progress",
    completed: (b) => b.status === "completed",
    cancelled: (b) => b.status === "cancelled",
    no_show: (b) => b.status === "no_show",
    closed: (b) => b.status === "declined" || b.status === "expired",
  }
  const LABEL: Record<BookingFilter, string> = {
    all: "Tất cả",
    today: "Hôm nay",
    pending: "Chờ nhận",
    overdue: "Quá hạn nhận",
    confirmed: "Đã xác nhận",
    in_progress: "Đang làm",
    completed: "Hoàn thành",
    cancelled: "Đã huỷ",
    no_show: "Vắng mặt",
    closed: "Từ chối / hết hạn",
  }
  const q = fold(query.trim())
  const rows = bookings
    .filter(test[filter])
    .filter((b) => !q || fold(`${b.customerName} ${b.proName} ${b.serviceLabel} ${b.district} ${b.id}`).includes(q))
  const { shown, more } = useShowMore(rows)

  return (
    <div className="space-y-3">
      <SearchBox value={query} onChange={setQuery} placeholder="Tìm theo khách, đối tác, dịch vụ, mã lịch" />
      <FilterChips
        label="Lọc lịch hẹn"
        value={filter}
        onChange={setFilter}
        items={BOOKING_FILTERS.map((f) => ({ value: f, label: LABEL[f], count: bookings.filter(test[f]).length }))}
      />
      <p className="text-label text-muted">{bookings.length} lịch mới tạo gần nhất. Bấm một lịch để mở chi tiết (tab mới).</p>
      {rows.length === 0 ? (
        <EmptyState title="Không có lịch hẹn nào" text={filter === "overdue" ? "Không có lịch nào quá hạn nhận." : undefined} />
      ) : (
        <ul className="space-y-2">
          {shown.map((b) => (
            <li key={b.id}>
              <Link href={`/bookings/${b.id}`} target="_blank" className="block">
                <Card className={cn("flex flex-wrap items-center gap-3 p-3.5 text-body hover:border-ink", overdue(b) && "ring-1 ring-danger/40")}>
                  {KNOWN_STATUS.has(b.status) ? (
                    <StatusBadge status={b.status as BookingStatus} />
                  ) : (
                    <span className="rounded-full bg-subtle px-2.5 py-1 text-label font-semibold">{b.status}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {b.customerName} → {b.proName}
                    </span>
                    <span className="block truncate text-label text-muted">
                      {b.date} {b.time} · {b.serviceLabel}
                      {b.atHome ? " · tại nhà" : ""}
                      {b.district ? ` · ${b.district}` : ""}
                    </span>
                    {b.status === "pending" && b.confirmBy && (
                      <span className={cn("block text-label", overdue(b) ? "font-semibold text-danger" : "text-warning")}>
                        {overdue(b) ? `Quá hạn nhận từ ${localTime(b.confirmBy)} ${localDate(b.confirmBy)}` : `Đối tác cần nhận trước ${localTime(b.confirmBy)} ${localDate(b.confirmBy)}`}
                      </span>
                    )}
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold tabular-nums">{formatPrice(b.total)}</span>
                    <span className="block text-label text-muted">tạo {timeAgo(b.createdAt)}</span>
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {more}
    </div>
  )
}

// Reviews -----------------------------------------------------------------------------

type ReviewFilter = "all" | "low" | "hidden"

/** Customer reviews, newest first. Hiding one takes it off the profile and out of the rating (set_review_hidden). */
export function ReviewsPanel({ initialFilter, run }: { initialFilter?: string; run: Run }) {
  const [filter, setFilter] = React.useState<ReviewFilter>(initialFilter === "low" || initialFilter === "hidden" ? initialFilter : "all")
  const [rows, setRows] = React.useState<AdminReview[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Bumped to read the list again (after hiding one, or "Thử lại").
  const [tick, setTick] = React.useState(0)
  const load = () => setTick((t) => t + 1)
  React.useEffect(() => {
    let live = true
    void adminReviews().then((r) => {
      if (!live) return
      if (r.ok) {
        setRows(r.data)
        setError(null)
      } else setError(r.error)
    })
    return () => {
      live = false
    }
  }, [tick])

  const test: Record<ReviewFilter, (r: AdminReview) => boolean> = {
    all: () => true,
    low: (r) => r.rating <= 2 && !r.hidden,
    hidden: (r) => r.hidden,
  }
  const shownRows = (rows ?? []).filter(test[filter])

  return (
    <div className="space-y-3">
      <p className="text-meta text-muted">
        Ẩn đánh giá khi nội dung vi phạm (xúc phạm, lộ thông tin cá nhân, quảng cáo, không liên quan). Đánh giá bị ẩn không hiện trên hồ sơ và
        không tính vào điểm sao; bật lại được bất cứ lúc nào.
      </p>
      <FilterChips
        label="Lọc đánh giá"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "all", label: "Tất cả", count: rows?.length },
          { value: "low", label: "1–2 sao", count: rows?.filter(test.low).length },
          { value: "hidden", label: "Đã ẩn", count: rows?.filter(test.hidden).length },
        ]}
      />
      {error && <PanelError text={error} onRetry={load} />}
      {rows === null ? (
        !error && <ListSkeleton />
      ) : shownRows.length === 0 ? (
        <EmptyState title="Không có đánh giá nào" />
      ) : (
        <ul className="space-y-2">
          {shownRows.map((r) => (
            <li key={r.bookingId}>
              <Card className={cn("p-3.5", r.hidden && "opacity-70")}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-label font-bold tabular-nums",
                      r.rating <= 2 ? "bg-danger-soft text-danger" : r.rating === 3 ? "bg-warning-soft text-warning" : "bg-success-soft text-success",
                    )}
                  >
                    ★ {r.rating}
                  </span>
                  <span className="text-body font-semibold">{r.author}</span>
                  <span className="text-meta text-muted">→</span>
                  <Link href={`/pros/${r.proSlug}`} target="_blank" className="text-body font-semibold hover:underline">
                    {r.proName}
                  </Link>
                  <Flag on={r.hidden} label="Đã ẩn" tone="muted" />
                  <span className="ml-auto text-label text-muted">{timeAgo(r.createdAt)}</span>
                </div>
                {r.serviceLabel && <p className="mt-0.5 text-label text-muted">{r.serviceLabel}</p>}
                {r.body && <p className="mt-2 whitespace-pre-wrap text-body">{r.body}</p>}
                {(r.tags.length > 0 || r.photos > 0) && (
                  <p className="mt-1 text-label text-ink-soft">
                    {r.tags.join(" · ")}
                    {r.photos > 0 ? `${r.tags.length ? " · " : ""}${r.photos} ảnh` : ""}
                  </p>
                )}
                {r.reply && <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-meta text-ink-soft">Đối tác trả lời: {r.reply}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActButton
                    size="sm"
                    variant={r.hidden ? "soft" : "ghost"}
                    onClick={async () => {
                      if (await run(() => setReviewHidden(r.bookingId, !r.hidden), r.hidden ? "Đã hiện lại đánh giá." : "Đã ẩn đánh giá.")) load()
                    }}
                  >
                    {r.hidden ? "Hiện lại" : "Ẩn đánh giá"}
                  </ActButton>
                  <Link href={`/bookings/${r.bookingId}`} target="_blank" className="inline-flex min-h-11 items-center px-2 text-meta font-semibold text-ink-soft underline underline-offset-2">
                    Mở lịch hẹn
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Requests and castings ---------------------------------------------------------------

const JOB_STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: "Đang mở", tone: "bg-accent-soft text-accent-dark" },
  booked: { label: "Đã chốt", tone: "bg-success-soft text-success" },
  expired: { label: "Hết hạn", tone: "bg-subtle text-muted" },
  closed: { label: "Đã đóng", tone: "bg-subtle text-muted" },
}
const COMPENSATION: Record<string, string> = { free: "Miễn phí dịch vụ", discount: "Giảm giá", paid: "Có thù lao" }

/**
 * What customers asked for and what partners are casting for. Read-only: the
 * point is to see demand nobody answered (an open request with no offers) and
 * to look up a case when someone writes to support.
 */
export function RequestsPanel() {
  const [view, setView] = React.useState<"jobs" | "castings">("jobs")
  const [jobFilter, setJobFilter] = React.useState<"open" | "unanswered" | "all">("open")
  const [data, setData] = React.useState<{ jobs: AdminJob[]; castings: AdminCasting[] } | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const [tick, setTick] = React.useState(0)
  const load = () => setTick((t) => t + 1)
  React.useEffect(() => {
    let live = true
    void adminRequests().then((r) => {
      if (!live) return
      if (r.ok) {
        setData(r.data)
        setError(null)
      } else setError(r.error)
    })
    return () => {
      live = false
    }
  }, [tick])

  const jobs = data?.jobs ?? []
  const castings = data?.castings ?? []
  const jobTest = {
    open: (j: AdminJob) => j.status === "open",
    unanswered: (j: AdminJob) => j.status === "open" && j.offers === 0,
    all: () => true,
  }
  const shownJobs = jobs.filter(jobTest[jobFilter])

  return (
    <div className="space-y-3">
      <FilterChips
        label="Loại"
        value={view}
        onChange={setView}
        items={[
          { value: "jobs", label: "Yêu cầu của khách", count: data ? jobs.length : undefined },
          { value: "castings", label: "Tuyển mẫu", count: data ? castings.length : undefined },
        ]}
      />
      {error && <PanelError text={error} onRetry={load} />}
      {!data ? (
        !error && <ListSkeleton />
      ) : view === "jobs" ? (
        <>
          <FilterChips
            label="Lọc yêu cầu"
            value={jobFilter}
            onChange={setJobFilter}
            items={[
              { value: "open", label: "Đang mở", count: jobs.filter(jobTest.open).length },
              { value: "unanswered", label: "Chưa ai báo giá", count: jobs.filter(jobTest.unanswered).length },
              { value: "all", label: "Tất cả", count: jobs.length },
            ]}
          />
          {shownJobs.length === 0 ? (
            <EmptyState title="Không có yêu cầu nào" />
          ) : (
            <ul className="space-y-2">
              {shownJobs.map((j) => (
                <li key={j.id}>
                  <Card className={cn("p-3.5", j.status === "open" && j.offers === 0 && "ring-1 ring-warning/40")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-label font-semibold", JOB_STATUS[j.status]?.tone ?? "bg-subtle")}>
                        {JOB_STATUS[j.status]?.label ?? j.status}
                      </span>
                      <span className="text-body font-semibold">{j.service}</span>
                      <span className="ml-auto text-label text-muted">{timeAgo(j.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-label text-muted">
                      {j.customer} · hẹn {localTime(j.startsAt)} {localDate(j.startsAt)} · {j.atHome ? "tại nhà" : "tại tiệm"}
                      {j.place ? ` · ${j.place}` : ""}
                    </p>
                    {j.description && <p className="mt-1.5 line-clamp-3 text-meta text-ink-soft">{j.description}</p>}
                    <p className={cn("mt-1.5 text-label font-semibold", j.offers === 0 ? "text-warning" : "text-ink-soft")}>
                      {j.offers === 0 ? "Chưa có đối tác nào báo giá" : `${j.offers} báo giá`}
                      {j.bookingId && (
                        <>
                          {" · "}
                          <Link href={`/bookings/${j.bookingId}`} target="_blank" className="text-ink underline underline-offset-2">
                            Mở lịch hẹn
                          </Link>
                        </>
                      )}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : castings.length === 0 ? (
        <EmptyState title="Chưa có tin tuyển mẫu nào" />
      ) : (
        <ul className="space-y-2">
          {castings.map((c) => (
            <li key={c.id}>
              <Card className="p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-label font-semibold", c.status === "open" ? "bg-accent-soft text-accent-dark" : "bg-subtle text-muted")}>
                    {c.status === "open" ? "Đang tuyển" : "Đã đóng"}
                  </span>
                  <Link href={`/tuyen-mau/${c.id}`} target="_blank" className="text-body font-semibold hover:underline">
                    {c.title}
                  </Link>
                  <span className="ml-auto text-label text-muted">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-label text-muted">
                  <Link href={`/pros/${c.proSlug}`} target="_blank" className="hover:underline">
                    {c.proName}
                  </Link>{" "}
                  · {COMPENSATION[c.compensation] ?? c.compensation} · {localTime(c.startsAt)} {localDate(c.startsAt)}
                  {c.place ? ` · ${c.place}` : ""}
                </p>
                <p className="mt-1.5 text-label font-semibold text-ink-soft">
                  {c.applications} người ứng tuyển · {c.pending} chờ duyệt · nhận {c.accepted}/{c.slots}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
