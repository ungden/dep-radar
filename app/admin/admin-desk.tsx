"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  ExternalLink,
  Flag,
  Landmark,
  LayoutDashboard,
  Menu,
  MessageCircleQuestion,
  Settings,
  Sparkles,
  Star,
  Tags,
  UserCheck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react"
import { Avatar, LogoMark } from "@/components/ui"
import { Button, Card, EmptyState, inputClass } from "./ui"
import { askReportInfo, decideCheck, decideNoShowCompensation, overrideAiDecision, recordTopup, reportChat, resolveReport } from "@/lib/api/admin"
import { EvidenceGrid } from "@/components/evidence-picker"
import type { AdminAction, AdminBooking, AdminOverview, AdminPro, AdminReport, AiDecisionItem, FeePolicyView, PendingCheck, PlatformSettings, ProfileQueueItem, ReportChatMessage } from "@/lib/api/admin"
import { ApprovalsPanel } from "./desk-approvals"
import { CatalogPanel, CustomersPanel, FinancePanel, HelpQuestionsPanel, SettingsPanel } from "./desk-panels"
import { BookingsPanel, OverviewPanel, ProsPanel, RequestsPanel, ReviewsPanel } from "./desk-ops"
import { ActButton, FilterChips } from "./desk-shared"
import type { Go, Tab } from "./tabs"
import { useApp, useRefresh } from "@/lib/store"
import { cn, formatPrice, timeAgo } from "@/lib/utils"

type Result = { ok: true } | { ok: false; error: string }

/**
 * The operations desk: an overview of what needs a person, the partner profiles
 * waiting for approval, the verifications a vision model was unsure about, the
 * partner roster and the AI reviewer's log, bookings, customers, requests and
 * reviews, the report inbox, the money and the settings. It has its own frame
 * (sidebar, top bar) rather than the shop's header and footer. Every button calls an RPC that checks `is_admin()` again in the
 * database. The open panel is in the address (?tab=), so a reload or a shared
 * link lands in the same place.
 */
export function AdminDesk({
  queue,
  checks,
  pros,
  bookings,
  reports,
  aiLog,
  admin,
  overview,
  initialTab,
  initialFilter,
}: {
  queue: ProfileQueueItem[]
  checks: PendingCheck[]
  pros: AdminPro[]
  bookings: AdminBooking[]
  reports: AdminReport[]
  aiLog: { items: AiDecisionItem[]; last24h: number }
  admin: { settings: PlatformSettings; fees: FeePolicyView; log: AdminAction[] }
  overview: AdminOverview
  initialTab: Tab
  initialFilter?: string
}) {
  const [view, setView] = React.useState<{ tab: Tab; filter?: string }>({ tab: initialTab, filter: initialFilter })
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const refresh = useRefresh()
  const app = useApp()
  const tab = view.tab

  React.useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const go: Go = (next, filter) => {
    setView({ tab: next, filter })
    setError(null)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", next)
    if (filter) url.searchParams.set("filter", filter)
    else url.searchParams.delete("filter")
    window.history.replaceState(null, "", url)
    window.scrollTo({ top: 0 })
  }

  /** Runs one admin call, says how it went, and re-reads the desk. True when it worked. */
  const run = async (fn: () => Promise<Result>, done = "Đã lưu.") => {
    const result = await fn()
    setError(result.ok ? null : result.error)
    setNotice(result.ok ? done : null)
    refresh()
    return result.ok
  }

  const openReports = reports.filter((r) => r.status === "open" || r.status === "reviewing")
  const claims = openReports.filter((r) => r.claim).length

  const groups: NavGroup[] = [
    { title: null, items: [{ value: "overview", label: "Tổng quan", icon: LayoutDashboard }] },
    {
      title: "Đối tác",
      items: [
        { value: "approvals", label: "Duyệt hồ sơ", icon: UserCheck, count: queue.length, alert: queue.length > 0 },
        { value: "checks", label: "Xác minh", icon: BadgeCheck, count: checks.length, alert: checks.length > 0 },
        { value: "pros", label: "Đối tác", icon: Users, count: pros.length },
        { value: "ai", label: "Nhật ký AI", icon: Sparkles, count: aiLog.last24h },
      ],
    },
    {
      title: "Khách & lịch",
      items: [
        { value: "bookings", label: "Lịch hẹn", icon: CalendarDays, count: overview.overdueConfirm || undefined, alert: overview.overdueConfirm > 0 },
        { value: "customers", label: "Tài khoản", icon: UserRound },
        { value: "requests", label: "Yêu cầu & tuyển mẫu", icon: ClipboardList },
        { value: "reviews", label: "Đánh giá", icon: Star, count: overview.lowReviews7d || undefined, alert: overview.lowReviews7d > 0 },
      ],
    },
    { title: "An toàn", items: [{ value: "reports", label: "Báo cáo", icon: Flag, count: openReports.length, alert: openReports.length > 0 }] },
    {
      title: "Tiền",
      items: [
        { value: "finance", label: "Tài chính", icon: Landmark },
        { value: "topup", label: "Nạp ví", icon: Wallet },
      ],
    },
    {
      title: "Hệ thống",
      items: [
        { value: "help", label: "Câu hỏi trợ giúp", icon: MessageCircleQuestion, count: overview.uncoveredHelp7d || undefined },
        { value: "catalog", label: "Danh mục & giá", icon: Tags },
        { value: "settings", label: "Cấu hình & nhật ký", icon: Settings },
      ],
    },
  ]
  const all = groups.flatMap((g) => g.items)
  const current = all.find((i) => i.value === tab)
  const groupTitle = groups.find((g) => g.items.some((i) => i.value === tab))?.title
  // "Đối tác › Đối tác" says nothing twice.
  const group = groupTitle && groupTitle !== current?.label ? groupTitle : null
  const [menu, setMenu] = React.useState(false)
  const pick = (next: Tab) => {
    setMenu(false)
    go(next)
  }

  return (
    <div className="min-h-dvh">
      {/* A desk gets the sidebar; a phone opens it as a drawer from the top bar. */}
      <aside aria-label="Các mục quản trị" className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-line bg-surface md:block">
        <Sidebar groups={groups} tab={tab} onPick={pick} />
      </aside>
      {menu && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Các mục quản trị">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-ink/40" onClick={() => setMenu(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-xl">
            <Sidebar groups={groups} tab={tab} onPick={pick} onClose={() => setMenu(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-dvh min-w-0 flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur md:px-6">
          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setMenu(true)}
            className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-subtle md:hidden"
          >
            <Menu className="size-5" />
          </button>
          <nav aria-label="Vị trí" className="flex min-w-0 flex-1 items-center gap-1.5 text-meta">
            <button type="button" onClick={() => go("overview")} className="hidden text-muted hover:text-ink sm:inline">
              Vận hành
            </button>
            {group && (
              <>
                <ChevronRight className="hidden size-3.5 text-muted sm:inline" aria-hidden />
                <span className="hidden text-muted sm:inline">{group}</span>
              </>
            )}
            {tab !== "overview" && <ChevronRight className="hidden size-3.5 text-muted sm:inline" aria-hidden />}
            <span className={cn("truncate font-medium text-ink", tab === "overview" && "sm:hidden")}>{current?.label}</span>
          </nav>
          <ShopLink href="/" className="hidden h-8 items-center gap-1.5 rounded-md px-2.5 text-meta text-ink-soft hover:bg-subtle hover:text-ink sm:inline-flex">
            <ExternalLink className="size-4" aria-hidden /> Trang khách
          </ShopLink>
          <ShopLink href="/thong-bao" aria-label="Thông báo" className="relative inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-subtle hover:text-ink">
            <Bell className="size-[18px]" />
            {app.unreadNotifications > 0 && (
              <span className="absolute right-1 top-1 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-semibold leading-4 text-white">
                {app.unreadNotifications > 9 ? "9+" : app.unreadNotifications}
              </span>
            )}
          </ShopLink>
          {app.session && (
            <ShopLink href="/me" aria-label="Tài khoản" className="ml-1 flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-subtle">
              <Avatar name={app.session.name} size={28} />
              <span className="hidden max-w-32 truncate text-meta font-medium lg:inline">{app.session.name}</span>
            </ShopLink>
          )}
        </header>

        <main id="main" className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="mb-5">
              <h1 className="text-xl font-semibold tracking-tight text-ink">{tab === "overview" ? "Tổng quan" : current?.label}</h1>
              {DESCRIPTION[tab] && <p className="mt-0.5 text-meta text-muted">{DESCRIPTION[tab]}</p>}
            </div>

            {error && (
              <p role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-body text-danger">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">{error}</span>
                <button type="button" className="text-meta font-medium underline" onClick={() => setError(null)}>
                  Đóng
                </button>
              </p>
            )}
            {notice && (
              <p role="status" className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-2 rounded-lg bg-ink px-4 py-3 text-body text-white shadow-lg">
                <CircleCheck className="size-4 shrink-0 text-[#6CE9A6]" aria-hidden />
                {notice}
              </p>
            )}

          {tab === "overview" && (
            <OverviewPanel
              overview={overview}
              approvals={queue.length}
              checks={checks.length}
              openReports={openReports.length}
              claims={claims}
              aiLast24h={aiLog.last24h}
              pros={pros}
              walletFloor={admin.fees.walletFloor}
              go={go}
            />
          )}

          {tab === "approvals" && <ApprovalsPanel queue={queue} run={run} />}

          {tab === "checks" && (
            <div className="space-y-3">
              {checks.length === 0 && (
                <EmptyState title="Không có xác minh danh tính nào chờ" text="Ca xác minh CCCD mà AI chưa chắc sẽ hiện ở đây. Duyệt hồ sơ đối tác ở mục Duyệt hồ sơ." />
              )}
              {checks.map((check) => (
                <CheckCard
                  key={check.id}
                  check={check}
                  onDecide={(ok, reason) => run(() => decideCheck(check.id, ok, reason), ok ? `Đã duyệt xác minh của ${check.proName}.` : "Đã từ chối và báo cho đối tác.")}
                />
              ))}
            </div>
          )}

          {tab === "pros" && <ProsPanel key={view.filter} pros={pros} walletFloor={admin.fees.walletFloor} initialFilter={view.filter} run={run} />}

          {tab === "topup" && <TopupForm pros={pros} onDone={refresh} />}

          {tab === "customers" && <CustomersPanel />}

          {tab === "finance" && <FinancePanel pros={pros} />}

          {tab === "help" && <HelpQuestionsPanel />}

          {tab === "catalog" && <CatalogPanel />}

          {tab === "settings" && <SettingsPanel settings={admin.settings} fees={admin.fees} log={admin.log} />}

          {tab === "ai" && (
            <AiLog
              log={aiLog}
              onOverride={async (id, decision, note) => {
                await run(() => overrideAiDecision(id, decision, note), "Đã đảo quyết định và báo cho đối tác.")
              }}
            />
          )}

          {tab === "bookings" && <BookingsPanel key={view.filter} bookings={bookings} initialFilter={view.filter} />}

          {tab === "requests" && <RequestsPanel />}

          {tab === "reviews" && <ReviewsPanel key={view.filter} initialFilter={view.filter} run={run} />}

          {tab === "reports" && <ReportsPanel key={view.filter} reports={reports} initialFilter={view.filter} run={run} />}
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * A way out of the desk into the shop. A full page load, not a client
 * navigation: the desk's layout carries only the desk snapshot
 * (loadDeskSnapshot), and the shop needs the whole one.
 */
function ShopLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} />
}

/** One line under each panel's title: what it is for. */
const DESCRIPTION: Partial<Record<Tab, string>> = {
  overview: "Việc cần người xử lý và tình hình hôm nay.",
  approvals: "Hồ sơ đối tác chỉ hiện với khách sau khi được duyệt ở đây. AI xem trước và gợi ý, bạn quyết định.",
  checks: "Ca xác minh CCCD mà AI chưa chắc chắn.",
  pros: "Toàn bộ đối tác: trạng thái, ví phí, khoá và mở khoá.",
  ai: "Quyết định và gợi ý của AI, kèm lý do.",
  bookings: "Lịch hẹn mới tạo gần nhất.",
  customers: "Tài khoản, lịch sử đặt lịch, khoá và đặt lại mật khẩu.",
  requests: "Yêu cầu khách đăng và tin tuyển mẫu.",
  reviews: "Đánh giá của khách; ẩn những đánh giá vi phạm.",
  reports: "Báo cáo từ khách và đối tác.",
  finance: "Doanh thu, phí và công nợ theo kỳ.",
  topup: "Ghi nhận tiền đối tác chuyển vào ví.",
  help: "Câu hỏi người dùng hỏi trợ lý.",
  catalog: "Danh mục dịch vụ và các mức giá.",
  settings: "Thông tin công ty, chính sách phí và nhật ký thao tác.",
}

type NavItem = { value: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number; alert?: boolean }
type NavGroup = { title: string | null; items: NavItem[] }

function Sidebar({ groups, tab, onPick, onClose }: { groups: NavGroup[]; tab: Tab; onPick: (t: Tab) => void; onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
        <LogoMark size={26} />
        <span className="text-[15px] font-semibold tracking-tight">360đẹp</span>
        <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Admin</span>
        {onClose && (
          <button type="button" aria-label="Đóng menu" onClick={onClose} className="ml-auto inline-flex size-8 items-center justify-center rounded-md hover:bg-subtle">
            <X className="size-4" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3">
        {groups.map((g) => (
          <div key={g.title ?? "top"}>
            {g.title && <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const on = tab === item.value
                const Icon = item.icon
                return (
                  <li key={item.value}>
                    <button
                      type="button"
                      onClick={() => onPick(item.value)}
                      aria-current={on ? "page" : undefined}
                      className={cn(
                        "flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-medium transition-colors",
                        on ? "bg-subtle text-ink" : "text-ink-soft hover:bg-subtle/70 hover:text-ink",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", on ? "text-ink" : "text-muted")} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.count !== undefined && <Count n={item.count} alert={item.alert} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-line p-2.5">
        <Link href="/admin/mcn" className="flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-ink-soft hover:bg-subtle hover:text-ink">
          <Users className="size-4 text-muted" aria-hidden /> Network MCN
        </Link>
        <ShopLink href="/" className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] text-ink-soft hover:bg-subtle hover:text-ink">
          <ArrowLeft className="size-4 text-muted" /> Về trang khách
        </ShopLink>
      </div>
    </div>
  )
}

function Count({ n, alert }: { n: number; alert?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-5 justify-center rounded-full px-1.5 text-[11px] font-semibold leading-5 tabular-nums",
        alert && n > 0 ? "bg-danger text-white" : "bg-subtle-strong/70 text-ink-soft",
      )}
    >
      {n}
    </span>
  )
}

type ReportFilter = "open" | "closed" | "all"

/** The inbox, open cases first; closed ones are one tap away for a follow-up. */
function ReportsPanel({ reports, initialFilter, run }: { reports: AdminReport[]; initialFilter?: string; run: Run }) {
  const [filter, setFilter] = React.useState<ReportFilter>(initialFilter === "closed" || initialFilter === "all" ? initialFilter : "open")
  const isOpen = (r: AdminReport) => r.status === "open" || r.status === "reviewing"
  const test: Record<ReportFilter, (r: AdminReport) => boolean> = { open: isOpen, closed: (r) => !isOpen(r), all: () => true }
  const shown = reports.filter(test[filter])
  return (
    <div className="space-y-3">
      <FilterChips
        label="Lọc báo cáo"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "open", label: "Đang mở", count: reports.filter(test.open).length },
          { value: "closed", label: "Đã đóng", count: reports.filter(test.closed).length },
          { value: "all", label: "Tất cả", count: reports.length },
        ]}
      />
      {shown.length === 0 && <EmptyState title={filter === "open" ? "Không có báo cáo nào đang mở" : "Chưa có báo cáo nào"} />}
      {shown.map((r) => (
        <ReportCard key={r.id} report={r} run={run} />
      ))}
      {reports.length >= 50 && <p className="text-label text-muted">Hiện 50 báo cáo mới nhất.</p>}
    </div>
  )
}

type Run = (fn: () => Promise<Result>, done?: string) => Promise<boolean>

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
    <Card className="max-w-2xl space-y-4 p-5">
      <div>
        <p className="font-semibold">Ghi nhận nạp ví</p>
        <p className="text-meta text-muted">
          Dùng khi thấy tiền chuyển vào tài khoản 360dep mà ví chưa tự cộng. Nhập mã giao dịch của ngân hàng để cùng một khoản không
          bị cộng hai lần.
        </p>
      </div>

      {current ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2.5 text-body">
          <span className="min-w-0">
            <span className="block font-semibold">{current.name}</span>
            <span className="block text-label text-muted">
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
            className={cn(inputClass, "text-body")}
            placeholder="Mã nạp (VD: AB23CD), slug hoặc tên"
            aria-label="Tìm người làm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {q && (
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {matches.length === 0 && <li className="px-3 py-2.5 text-body text-muted">Không tìm thấy ai.</li>}
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(p)
                      setResult(null)
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-body hover:bg-subtle"
                  >
                    <span className="min-w-0 truncate">
                      <b>{p.name}</b> <span className="text-muted">· {p.slug}</span>
                    </span>
                    <span className="shrink-0 text-label text-muted">{p.payCode ?? "—"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={cn(inputClass, "text-body")}
          inputMode="numeric"
          placeholder="Số tiền (đ)"
          aria-label="Số tiền"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className={cn(inputClass, "text-body")}
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
          className={cn("rounded-lg px-3.5 py-2.5 text-body", result.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}
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

/**
 * What reversing a decision means: a profile flips approve ↔ reject, a post hide ↔ show. Null for reminders, and
 * for a profile suggestion nobody has decided yet: that is decided in "Duyệt hồ sơ".
 */
function reversal(item: AiDecisionItem): { decision: string; label: string } | null {
  const current = item.overrideDecision ?? item.decision
  if (item.subject === "pro_profile") {
    if (item.suggestion && !item.overriddenAt) return null
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
    <div className="space-y-3">
      <p className="text-meta text-muted">
        {log.last24h} quyết định trong 24 giờ qua. Với hồ sơ đối tác, AI chỉ gợi ý: nhân viên duyệt ở mục Duyệt hồ sơ. Bài đăng mới do AI
        kiểm tra; nhân viên xem lại ở đây và đảo quyết định khi cần. Đối tác được báo mỗi lần đảo.
      </p>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {AI_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "h-7 shrink-0 rounded-md border px-2.5 text-[13px] font-medium",
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
  // A profile suggestion (or an old one superseded by a new request) that nobody decided from this row.
  const pendingSuggestion = item.suggestion && !item.overriddenAt && item.decision !== "skipped"
  const photos = item.photos.filter(storagePhoto).slice(0, 4)

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-md px-1.5 py-0.5 text-label font-medium", DECISION_TONE[current] ?? "bg-canvas text-muted")}>
          {pendingSuggestion ? "AI gợi ý: " : ""}
          {DECISION_LABEL[current] ?? current}
        </span>
        <span className="text-label font-semibold text-ink-soft">{SUBJECT_LABEL[item.subject] ?? item.subject}</span>
        {item.proSlug ? (
          <Link href={`/pros/${item.proSlug}`} className="text-body font-semibold hover:underline">
            {item.proName}
          </Link>
        ) : (
          <span className="text-body font-semibold">{item.proName}</span>
        )}
        <span className="ml-auto text-label text-muted" title={new Date(item.createdAt).toLocaleString("vi-VN")}>
          {timeAgo(item.createdAt)}
        </span>
      </div>
      {item.workTitle && <p className="mt-1 text-meta text-ink-soft">Bài: {item.workTitle}</p>}
      {item.summary && <p className="mt-2 text-body">{item.summary}</p>}
      {item.reasons.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-meta text-ink-soft">
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
      <p className="mt-2 text-label text-muted">
        {item.model === "rules" ? "Theo quy tắc (không có AI)" : `Model: ${item.model}`}
        {item.overriddenAt && (
          <>
            {" "}
            · AI {item.suggestion ? "gợi ý" : "quyết"} “{DECISION_LABEL[item.decision] ?? item.decision}”, {item.overriddenBy ?? "nhân viên"}{" "}
            {item.suggestion ? "quyết" : "đổi thành"} “
            {DECISION_LABEL[item.overrideDecision ?? ""] ?? item.overrideDecision}” {timeAgo(item.overriddenAt)}
            {item.overrideNote ? `: ${item.overrideNote}` : ""}
          </>
        )}
      </p>

      {flip &&
        (open ? (
          <div className="mt-3 space-y-2">
            <input
              className={cn(inputClass, "text-body")}
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

function CheckCard({ check, onDecide }: { check: PendingCheck; onDecide: (approve: boolean, reason: string) => Promise<unknown> }) {
  const [reason, setReason] = React.useState("")
  return (
    <Card className="p-4">
      <p className="font-semibold">
        <Link href={`/pros/${check.proSlug}`} className="hover:underline">
          {check.proName}
        </Link>
      </p>
      <p className="mt-0.5 text-label text-muted">Gửi {timeAgo(check.createdAt)}</p>

      {/* What the model actually said, so the decision is made on evidence. */}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-meta sm:grid-cols-4">
        <Fact label="Tên trên thẻ" value={check.nameOnCard || "—"} />
        <Fact label="Khớp tên hồ sơ" value={check.nameMatches === null ? "—" : check.nameMatches ? "Có" : "Không"} />
        <Fact label="Cùng một người" value={check.samePerson ?? "—"} />
        <Fact label="Độ chắc chắn" value={check.confidence === null ? "—" : `${Math.round(check.confidence * 100)}%`} />
      </dl>
      {check.reason && <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-meta text-ink-soft">{check.reason}</p>}
      {check.photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {check.photos.map((p) => (
            <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="block">
              {/* Short-lived signed links from a private bucket: a plain img, not next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.label} className="aspect-[4/3] w-full rounded-lg bg-subtle object-cover" />
              <span className="mt-1 block text-center text-label text-muted">{p.label}</span>
            </a>
          ))}
        </div>
      )}

      <input
        className={cn(inputClass, "mt-3 text-body")}
        placeholder="Lý do (gửi cho chuyên viên nếu từ chối)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <ActButton variant="ghost" size="sm" onClick={() => onDecide(false, reason.trim())}>
          Từ chối
        </ActButton>
        <ActButton size="sm" onClick={() => onDecide(true, reason.trim())}>
          Duyệt xác minh
        </ActButton>
      </div>
      <p className="mt-2 text-label text-muted">
        Ảnh chỉ lưu kín cho lần duyệt này (link hết hạn sau 15 phút, tải lại trang để xem tiếp) và bị xoá ngay khi bạn duyệt hoặc từ chối.
        Kiểm tra: ảnh thẻ thật, người trong ảnh chân dung đang cầm đúng thẻ đó, khuôn mặt khớp ảnh trên thẻ.
      </p>
    </Card>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

const REPORT_REASON: Record<string, string> = {
  pro_no_show: "Khách báo người làm không đến",
  no_show_dispute: "Khách khiếu nại bị báo vắng mặt",
}

/**
 * One report. The note is what the person who reported reads when it is
 * closed (resolve_report notifies them). A disputed no-show decides the held
 * travel-fee compensation instead; both sides are told.
 */
function ReportCard({ report: r, run }: { report: AdminReport; run: Run }) {
  const [note, setNote] = React.useState("")
  const open = r.status === "open" || r.status === "reviewing"
  const claim = r.claim
  return (
    <Card className="p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-md px-1.5 py-0.5 text-label font-medium", REPORT_STATUS[r.status]?.tone ?? "bg-subtle")}>
          {REPORT_STATUS[r.status]?.label ?? r.status}
        </span>
        <p className="text-body font-semibold">{REPORT_REASON[r.reason] ?? r.reason}</p>
      </div>
      <p className="mt-0.5 text-label text-muted">
        {r.reporter}
        {r.target && ` → ${r.target}`} · {timeAgo(r.createdAt)}
        {r.updatedAt !== r.createdAt && ` · cập nhật ${timeAgo(r.updatedAt)}`}
        {r.bookingId && (
          <>
            {" · "}
            <a href={`/bookings/${r.bookingId}`} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
              Mở lịch hẹn
            </a>
          </>
        )}
      </p>
      {r.detail && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-canvas px-3 py-2 text-meta">{r.detail}</p>}
      {r.evidence.length > 0 && <EvidenceGrid items={r.evidence} />}
      {r.staffQuestion && open && <p className="mt-2 text-label text-warning">Đã hỏi người báo: {r.staffQuestion} (chờ trả lời)</p>}
      {!open && r.resolution && <p className="mt-2 text-label text-ink-soft">Kết quả: {r.resolution}</p>}
      <ReportChat reportId={r.id} />
      {open && (
        <div className="mt-3 space-y-2">
          <input
            className={cn(inputClass, "h-10 text-body")}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Câu hỏi cho người báo, hoặc ghi chú kết quả gửi họ"
          />
          <div className="flex flex-wrap gap-2">
            {r.status === "open" && (
              <ActButton size="sm" variant="ghost" onClick={() => run(() => resolveReport(r.id, "reviewing"), "Đã nhận xử lý báo cáo.")}>
                Nhận xử lý
              </ActButton>
            )}
            <ActButton
              size="sm"
              variant="ghost"
              disabled={note.trim().length < 5}
              onClick={async () => {
                if (await run(() => askReportInfo(r.id, note), "Đã gửi câu hỏi cho người báo.")) setNote("")
              }}
            >
              Hỏi thêm thông tin
            </ActButton>
          </div>
          {claim ? (
            <div className="flex flex-wrap gap-2">
              <ActButton size="sm" variant="ghost" onClick={() => run(() => decideNoShowCompensation(claim.id, false, note), "Đã quyết: không bù phí. Hai bên được báo.")}>
                Khách đúng: không bù phí
              </ActButton>
              <ActButton size="sm" onClick={() => run(() => decideNoShowCompensation(claim.id, true, note), "Đã bù phí cho người làm. Hai bên được báo.")}>
                Giữ vắng mặt: bù {formatPrice(claim.amount)} cho người làm
              </ActButton>
            </div>
          ) : (
            <div className="flex gap-2">
              <ActButton size="sm" variant="ghost" onClick={() => run(() => resolveReport(r.id, "rejected", note), "Đã đóng: không vi phạm. Người báo được báo kết quả.")}>
                Không vi phạm
              </ActButton>
              <ActButton size="sm" onClick={() => run(() => resolveReport(r.id, "resolved", note), "Đã đóng báo cáo. Người báo được báo kết quả.")}>
                Đã xử lý
              </ActButton>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

const REPORT_STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: "Mới", tone: "bg-accent-soft text-accent" },
  reviewing: { label: "Đang xử lý", tone: "bg-warning-soft text-warning" },
  resolved: { label: "Đã xử lý", tone: "bg-success-soft text-success" },
  rejected: { label: "Không vi phạm", tone: "bg-subtle text-muted" },
}

/**
 * The chat between the two people a report is about. Closed until the staff
 * ask for it, and every opening is written to the admin log (Cấu hình › Nhật ký).
 */
function ReportChat({ reportId }: { reportId: string }) {
  const [messages, setMessages] = React.useState<ReportChatMessage[] | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = async () => {
    setBusy(true)
    const result = await reportChat(reportId)
    setBusy(false)
    if (result.ok) setMessages(result.data)
    else setError(result.error)
  }

  if (!messages) {
    return (
      <div className="mt-2">
        <Button size="sm" variant="ghost" disabled={busy} onClick={load}>
          {busy ? "Đang tải…" : "Xem tin nhắn hai bên"}
        </Button>
        <span className="ml-2 text-label text-muted">Mỗi lần xem được ghi vào nhật ký quản trị.</span>
        {error && <p className="mt-1 text-label text-danger">{error}</p>}
      </div>
    )
  }
  return (
    <div className="mt-3 rounded-lg border border-line p-3">
      <p className="mb-2 text-label font-semibold text-ink-soft">Tin nhắn giữa khách và người làm ({messages.length})</p>
      {messages.length === 0 ? (
        <p className="text-label text-muted">Hai bên chưa nhắn tin trong ứng dụng.</p>
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto">
          {messages.map((m) => (
            <li key={m.id} className={cn("flex", m.sender === "pro" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-meta", m.sender === "pro" ? "bg-accent-soft" : "bg-canvas")}>
                <span className="block text-label font-semibold text-muted">
                  {m.sender === "pro" ? "Người làm" : "Khách"} · {new Date(m.sentAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                </span>
                {m.body && <span className="whitespace-pre-wrap">{m.body}</span>}
                {m.photos.length > 0 && (
                  <span className="mt-1 grid grid-cols-3 gap-1">
                    {m.photos.map((u) => (
                      <a key={u} href={u} target="_blank" rel="noreferrer">
                        {/* Short-lived signed links from a private bucket: a plain img, not next/image. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="Ảnh trong tin nhắn" className="aspect-square w-full rounded-md bg-subtle object-cover" />
                      </a>
                    ))}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
