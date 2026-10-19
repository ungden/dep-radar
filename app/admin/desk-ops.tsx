"use client"

import * as React from "react"
import Link from "next/link"
import { BadgeCheck, CalendarCheck, CalendarClock, ChevronRight, CircleAlert, CircleCheck, Download, Flag as FlagIcon, KeyRound, Lock, MessageCircleQuestion, Settings, Star, Unlock, UserCheck, UserPlus, Wallet } from "lucide-react"
import { Badge, Button, Card, EmptyState, Panel, StatusBadge, Table, TableFoot, Td, Th, Tr, inputClass } from "./ui"
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
      <section aria-labelledby="kpi-title">
        <h2 id="kpi-title" className="sr-only">
          Số liệu
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={CalendarClock} label="Lịch hẹn hôm nay" value={o.bookingsToday} hint={`${o.pendingConfirm} chờ đối tác nhận`} onClick={() => go("bookings", "today")} />
          <Stat icon={CalendarCheck} label="Hoàn thành (7 ngày)" value={o.completed7d} hint={`${o.created7d} lịch mới · ${o.cancelled7d} huỷ`} onClick={() => go("bookings", "completed")} />
          <Stat icon={UserPlus} label="Tài khoản mới (7 ngày)" value={o.newAccounts7d} hint={`${o.newPros7d} đối tác mới`} onClick={() => go("customers")} />
          <Stat icon={Wallet} label="Đối tác nợ phí" value={owing} hint={blocked ? `${blocked} bị chặn nhận việc` : "Không ai bị chặn"} tone={owing ? "warning" : undefined} onClick={() => go("pros", "owing")} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          title="Việc cần xử lý"
          description={todo.length ? `${todo.reduce((n, q) => n + q.n, 0)} việc đang chờ người xem` : undefined}
          bodyClassName="p-0"
        >
          {todo.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-6 text-body text-success">
              <CircleCheck className="size-4" aria-hidden /> Không có việc tồn đọng. Mọi hàng chờ đều trống.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {todo.map((q) => {
                const Icon = q.icon
                return (
                  <li key={q.label}>
                    <button type="button" onClick={() => go(q.tab, q.filter)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle/60">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md",
                          q.tone === "danger" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body font-medium">{q.label}</span>
                        <span className="block truncate text-label text-muted">{q.hint}</span>
                      </span>
                      <Badge tone={q.tone}>{q.n}</Badge>
                      <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Đang mở" bodyClassName="p-0">
            <ul className="divide-y divide-line text-body">
              <Row label="Yêu cầu đang mở" value={o.openJobs} onClick={() => go("requests")} />
              <Row label="Tuyển mẫu đang mở" value={o.openCastings} onClick={() => go("requests")} />
              <Row label="Đối tác chưa công khai" value={o.unpublishedPros} onClick={() => go("pros", "hidden")} />
              <Row label="Quyết định AI (24 giờ)" value={aiLast24h} onClick={() => go("ai")} />
            </ul>
          </Panel>
          <Panel title="Thao tác nhanh" bodyClassName="grid gap-1 p-2">
            <Quick icon={Wallet} label="Ghi nhận nạp ví" onClick={() => go("topup")} />
            <Quick icon={Download} label="Báo cáo tiền & xuất file kế toán" onClick={() => go("finance")} />
            <Quick icon={KeyRound} label="Tìm tài khoản, đặt lại mật khẩu" onClick={() => go("customers")} />
            <Quick icon={Settings} label="Cấu hình & nhật ký quản trị" onClick={() => go("settings")} />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  hint?: string
  tone?: "warning"
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-line bg-surface p-4 text-left shadow-[0_1px_2px_rgb(16_24_40/0.04)] hover:border-line-strong">
      <span className="flex items-center justify-between gap-2 text-meta text-muted">
        {label}
        <Icon className={cn("size-4", tone === "warning" ? "text-warning" : "text-muted")} />
      </span>
      <span className="mt-2 block text-[26px] font-semibold leading-none tracking-tight tabular-nums">{value}</span>
      {hint && <span className="mt-1.5 block truncate text-label text-muted">{hint}</span>}
    </button>
  )
}

function Row({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-subtle/60">
        <span className="text-ink-soft">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </button>
    </li>
  )
}

function Quick({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-left text-body text-ink-soft hover:bg-subtle hover:text-ink">
      <Icon className="size-4 text-muted" /> {label}
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
        <Table>
          <thead>
            <tr>
              <Th>Đối tác</Th>
              <Th>Khu vực</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Job</Th>
              <Th className="text-right">Đánh giá</Th>
              <Th className="text-right">Ví</Th>
              <Th className="text-right">
                <span className="sr-only">Thao tác</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((pro) => (
              <React.Fragment key={pro.id}>
                <Tr className={cn(pro.suspended && "bg-danger-soft/30")}>
                  <Td>
                    <Link href={`/pros/${pro.slug}`} target="_blank" className="font-medium text-ink hover:underline">
                      {pro.name}
                    </Link>
                    <span className="block text-label text-muted">
                      {pro.slug}
                      {pro.payCode ? ` · ${pro.payCode}` : ""}
                    </span>
                  </Td>
                  <Td className="text-ink-soft">{[pro.district, pro.city].filter(Boolean).join(", ")}</Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {pro.suspended ? (
                        <Badge tone="danger">Tạm khoá</Badge>
                      ) : pro.published ? (
                        <Badge tone="success">Công khai</Badge>
                      ) : (
                        <Badge>Chưa công khai</Badge>
                      )}
                      <Flag on={pro.identity === "verified"} label="Đã xác minh" />
                      <Flag on={!pro.acceptingJobs} label="Tạm nghỉ" tone="muted" />
                      <Flag on={pro.wallet < walletFloor} label="Chặn vì nợ phí" tone="warning" />
                    </span>
                  </Td>
                  <Td className="text-right tabular-nums">{pro.completedJobs}</Td>
                  <Td className="whitespace-nowrap text-right tabular-nums text-ink-soft">
                    {pro.ratingCount ? `★ ${pro.rating.toFixed(1)} (${pro.ratingCount})` : "—"}
                  </Td>
                  <Td className={cn("text-right font-medium tabular-nums", pro.wallet < 0 && "text-danger")}>{formatPrice(pro.wallet)}</Td>
                  <Td className="text-right">
                    {pro.suspended ? (
                      <ActButton size="sm" variant="outline" onClick={() => run(() => setSuspended(pro.id, false), `Đã mở khoá ${pro.name}.`)}>
                        <Unlock /> Mở khoá
                      </ActButton>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setLocking(locking === pro.id ? null : pro.id)
                          setReason("")
                        }}
                      >
                        <Lock /> Khoá
                      </Button>
                    )}
                  </Td>
                </Tr>
                {locking === pro.id && (
                  <tr>
                    <td colSpan={7} className="border-b border-line bg-danger-soft/40 px-4 py-3">
                      <p className="text-meta text-ink-soft">
                        Tạm khoá thì hồ sơ bị ẩn và {pro.name} không nhận được lịch mới. Lịch đã nhận vẫn giữ. Lý do được ghi vào nhật ký.
                      </p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input
                          className={cn(inputClass, "sm:max-w-md")}
                          placeholder="Lý do (VD: khách báo không đến nhiều lần)"
                          aria-label="Lý do tạm khoá"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          autoFocus
                        />
                        <ActButton
                          variant="danger"
                          disabled={reason.trim().length < 5}
                          onClick={async () => {
                            if (await run(() => setSuspended(pro.id, true, reason.trim()), `Đã tạm khoá ${pro.name}.`)) setLocking(null)
                          }}
                        >
                          Tạm khoá đối tác
                        </ActButton>
                        <Button variant="ghost" onClick={() => setLocking(null)}>
                          Thôi
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      )}
      <TableFoot>
        <span>
          {sorted.length} / {pros.length} đối tác
        </span>
      </TableFoot>
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
      {rows.length === 0 ? (
        <EmptyState title="Không có lịch hẹn nào" text={filter === "overdue" ? "Không có lịch nào quá hạn nhận." : undefined} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Trạng thái</Th>
              <Th>Khách → Đối tác</Th>
              <Th>Dịch vụ</Th>
              <Th>Thời gian</Th>
              <Th className="text-right">Tổng</Th>
              <Th className="text-right">Tạo</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((b) => (
              <Tr key={b.id} className={cn("cursor-pointer", overdue(b) && "bg-danger-soft/30")} onClick={() => window.open(`/bookings/${b.id}`, "_blank")}>
                <Td>
                  {KNOWN_STATUS.has(b.status) ? <StatusBadge status={b.status as BookingStatus} /> : <Badge>{b.status}</Badge>}
                  {b.status === "pending" && b.confirmBy && (
                    <span className={cn("mt-1 block whitespace-nowrap text-label", overdue(b) ? "font-medium text-danger" : "text-warning")}>
                      {overdue(b) ? "Quá hạn" : "Hạn"} {localTime(b.confirmBy)} {localDate(b.confirmBy)}
                    </span>
                  )}
                </Td>
                <Td>
                  <Link href={`/bookings/${b.id}`} target="_blank" onClick={(e) => e.stopPropagation()} className="font-medium text-ink hover:underline">
                    {b.customerName} → {b.proName}
                  </Link>
                  <span className="block text-label text-muted">#{b.id.slice(0, 8)}</span>
                </Td>
                <Td className="max-w-64">
                  <span className="block truncate">{b.serviceLabel}</span>
                  <span className="block text-label text-muted">
                    {b.atHome ? "Tại nhà" : "Tại tiệm"}
                    {b.district ? ` · ${b.district}` : ""}
                  </span>
                </Td>
                <Td className="whitespace-nowrap tabular-nums">
                  {b.date.split("-").reverse().join("/")} <span className="text-muted">{b.time}</span>
                </Td>
                <Td className="text-right font-medium tabular-nums">{formatPrice(b.total)}</Td>
                <Td className="whitespace-nowrap text-right text-label text-muted">{timeAgo(b.createdAt)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      <TableFoot>
        <span>
          {rows.length} / {bookings.length} lịch mới tạo gần nhất · bấm một dòng để mở chi tiết
        </span>
      </TableFoot>
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
                      "rounded-md px-1.5 py-0.5 text-label font-semibold tabular-nums",
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
                {r.reply && <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-meta text-ink-soft">Đối tác trả lời: {r.reply}</p>}
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
                      <span className={cn("rounded-md px-1.5 py-0.5 text-label font-medium", JOB_STATUS[j.status]?.tone ?? "bg-subtle")}>
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
                  <span className={cn("rounded-md px-1.5 py-0.5 text-label font-medium", c.status === "open" ? "bg-accent-soft text-accent-dark" : "bg-subtle text-muted")}>
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
