"use client"

import * as React from "react"
import Link from "next/link"
import { Download, KeyRound, Lock, Search, Unlock } from "lucide-react"
import { Button, Card, EmptyState, Field, inputClass } from "@/components/ui"
import {
  adjustWallet,
  adminCustomers,
  adminHelpQuestions,
  adminResetPassword,
  catalogUsage,
  financeReport,
  setAccountSuspended,
  updatePlatformSettings,
  type AdminAction,
  type AdminCustomer,
  type AdminHelpQuestion,
  type AdminPro,
  type FeePolicyView,
  type FinanceByPro,
  type FinanceSummary,
  type HelpQuestionFilter,
  type PlatformSettings,
} from "@/lib/api/admin"
import { CATALOG, CATEGORIES, CATALOG_VERSION, PRICE_LEVEL_NOTE, tierLabels } from "@/lib/catalog"
import { HELP_ENTRIES } from "@/lib/help/knowledge"
import type { CategoryId } from "@/lib/types"
import { useRefresh } from "@/lib/store"
import { cn, formatPrice, localDate, timeAgo, todayISO } from "@/lib/utils"

// Customers ---------------------------------------------------------------------------

/** Everyone with an account: what they booked, spent, cancelled, and a lock for abuse. */
export function CustomersPanel() {
  const [query, setQuery] = React.useState("")
  const [rows, setRows] = React.useState<AdminCustomer[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [locking, setLocking] = React.useState<AdminCustomer | null>(null)
  const [reason, setReason] = React.useState("")
  // A password reset waiting for "Xác nhận", then the new password shown once.
  const [resetting, setResetting] = React.useState<AdminCustomer | null>(null)
  const [issued, setIssued] = React.useState<{ id: string; password: string } | null>(null)

  const reset = async (c: AdminCustomer) => {
    const r = await adminResetPassword(c.id)
    setResetting(null)
    if (!r.ok) return setError(r.error)
    setIssued({ id: c.id, password: r.data })
  }

  const load = React.useCallback(async (q: string) => {
    const r = await adminCustomers(q)
    if (r.ok) {
      setRows(r.data)
      setError(null)
    } else setError(r.error)
  }, [])

  React.useEffect(() => {
    const t = setTimeout(() => void load(query), 250)
    return () => clearTimeout(t)
  }, [query, load])

  const toggle = async (c: AdminCustomer, lock: boolean, why = "") => {
    const r = await setAccountSuspended(c.id, lock, why)
    if (!r.ok) return setError(r.error)
    setLocking(null)
    setReason("")
    void load(query)
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          className={cn(inputClass, "pl-9 text-sm")}
          placeholder="Tìm theo tên, số điện thoại hoặc email"
          aria-label="Tìm khách hàng"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="Không tìm thấy tài khoản nào" />
      ) : (
        <>
          <p className="text-[13px] text-muted">
            {rows.length} tài khoản{rows.length === 200 ? " (200 gần nhất, tìm để lọc thêm)" : ""}. Khoá một tài khoản thì người đó không đặt lịch, đăng
            yêu cầu hay nhắn tin được nữa; lịch đã đặt vẫn giữ.
          </p>
          <ul className="space-y-2">
            {rows.map((c) => (
              <li key={c.id}>
                <Card className={cn("p-3.5", c.suspendedAt && "ring-1 ring-danger/40")}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {c.name}
                        {c.isPro && <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-soft">Đối tác</span>}
                        {c.suspendedAt && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger">Đã khoá</span>}
                      </p>
                      <p className="text-xs text-muted">
                        {c.phone || "chưa có SĐT"}
                        {c.email ? ` · ${c.email}` : ""} · tham gia {localDate(c.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {c.bookings} lịch · {c.completed} xong · {c.cancelled} tự huỷ · {c.noShows} vắng mặt · đã chi {formatPrice(c.spent)}
                        {c.lastBookingAt ? ` · lịch gần nhất ${localDate(c.lastBookingAt)}` : ""}
                      </p>
                      {c.suspendedAt && c.suspendReason && <p className="mt-1 text-xs text-danger">Lý do khoá: {c.suspendReason}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setResetting(c)}>
                      <KeyRound className="size-4" /> Đặt lại mật khẩu
                    </Button>
                    {c.suspendedAt ? (
                      <Button size="sm" variant="soft" onClick={() => void toggle(c, false)}>
                        <Unlock className="size-4" /> Mở khoá
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setLocking(c)}>
                        <Lock className="size-4" /> Khoá
                      </Button>
                    )}
                  </div>
                  {resetting?.id === c.id && (
                    <div className="mt-3 space-y-2 rounded-xl bg-warning-soft px-3.5 py-3 text-[13px]">
                      <p>
                        Chỉ đặt lại khi người nhắn Zalo dùng <b>đúng số {c.phone || "của tài khoản"}</b>. Mật khẩu cũ hết hiệu lực ngay, chủ tài khoản nhận thông báo.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void reset(c)}>
                          Xác nhận đặt lại
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setResetting(null)}>
                          Thôi
                        </Button>
                      </div>
                    </div>
                  )}
                  {issued?.id === c.id && (
                    <div className="mt-3 space-y-1 rounded-xl bg-success-soft px-3.5 py-3 text-[13px]">
                      <p>
                        Mật khẩu mới (chỉ hiện một lần): <b className="select-all font-mono text-[15px]">{issued.password}</b>
                      </p>
                      <p className="text-ink-soft">Gửi qua Zalo cho đúng số {c.phone}. Nhắc khách đăng nhập rồi đổi mật khẩu trong Cài đặt tài khoản.</p>
                      <Button size="sm" variant="ghost" onClick={() => setIssued(null)}>
                        Đã gửi, ẩn đi
                      </Button>
                    </div>
                  )}
                  {locking?.id === c.id && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        className={cn(inputClass, "text-sm")}
                        placeholder="Lý do (VD: bùng lịch nhiều lần, quấy rối người làm)"
                        aria-label="Lý do khoá"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" disabled={reason.trim().length < 5} onClick={() => void toggle(c, true, reason)}>
                          Khoá tài khoản
                        </Button>
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
        </>
      )}
    </div>
  )
}

// Finance -----------------------------------------------------------------------------

const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`

/** A period's money: bookings, 360đẹp's revenue, transfers in, who owes; and the files for the accountant. */
export function FinancePanel({ pros }: { pros: AdminPro[] }) {
  const today = todayISO()
  const [from, setFrom] = React.useState(monthStart(today))
  const [to, setTo] = React.useState(today)
  const [data, setData] = React.useState<{ summary: FinanceSummary; byPro: FinanceByPro[] } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    let live = true
    void financeReport(from, to).then((r) => {
      if (!live) return
      if (r.ok) {
        setData(r.data)
        setError(null)
      } else setError(r.error)
    })
    return () => {
      live = false
    }
  }, [from, to, tick])

  const s = data?.summary
  const range = `from=${from}&to=${to}`
  const presets: { label: string; from: string; to: string }[] = (() => {
    const d = new Date(`${today}T00:00:00`)
    const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    const prevEnd = new Date(d.getFullYear(), d.getMonth(), 0)
    const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`
    const q = Math.floor(d.getMonth() / 3)
    return [
      { label: "Tháng này", from: monthStart(today), to: today },
      { label: "Tháng trước", from: iso(prev), to: iso(prevEnd) },
      { label: "Quý này", from: iso(new Date(d.getFullYear(), q * 3, 1)), to: today },
      { label: "Năm nay", from: `${d.getFullYear()}-01-01`, to: today },
    ]
  })()

  return (
    <div className="mt-4 space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <Field label="Từ ngày">
          <input type="date" className={cn(inputClass, "text-sm")} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Đến ngày">
          <input type="date" className={cn(inputClass, "text-sm")} value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.label}
              size="sm"
              variant={from === p.from && to === p.to ? "soft" : "ghost"}
              onClick={() => {
                setFrom(p.from)
                setTo(p.to)
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </Card>

      {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Figure label="Hoa hồng 360dep" value={formatPrice(s.commission)} hint="Doanh thu của công ty (chưa gồm VAT)" strong />
            <Figure label="Khách trả người làm" value={formatPrice(s.gmv)} hint={`${s.completed} lịch hoàn thành`} />
            <Figure label="Tiền nạp ví vào" value={formatPrice(s.topupsSepay + s.topupsStaff)} hint={`SePay ${formatPrice(s.topupsSepay)} · tay ${formatPrice(s.topupsStaff)}`} />
            <Figure
              label="Đối tác đang nợ phí"
              value={formatPrice(s.owed)}
              hint={`${s.owing} người · hiện tại`}
              tone={s.owed > 0 ? "danger" : undefined}
            />
          </div>
          <Card className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-4 text-sm md:grid-cols-3">
            <Line label="Lịch tạo mới" value={String(s.created)} />
            <Line label="Khách/người làm huỷ" value={String(s.cancelled)} />
            <Line label="Vắng mặt" value={String(s.noShows)} />
            <Line label="Hết hạn / bị từ chối" value={String(s.expired)} />
            <Line label="Phí đã trừ vào ví" value={formatPrice(s.feesCharged)} />
            <Line label="Voucher 360dep chi" value={formatPrice(s.voucherCredits)} />
            <Line label="Thưởng giới thiệu" value={formatPrice(s.referralPaid)} />
            <Line label="Bù khách vắng mặt" value={formatPrice(s.noShowComp)} />
            <Line label="Điều chỉnh / hoàn" value={formatPrice(s.adjustments)} />
            <Line label="Ví dư (360dep giữ hộ)" value={formatPrice(s.credit)} />
          </Card>

          <Card className="p-4">
            <p className="font-semibold">Xuất file cho kế toán</p>
            <p className="mt-0.5 text-[13px] text-muted">
              File CSV mở bằng Excel. Hoa hồng là doanh thu của công ty để xuất hoá đơn và kê khai; danh sách theo người làm có họ tên trên
              CCCD và doanh thu, dùng khi cung cấp thông tin người bán cho cơ quan thuế.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold hover:bg-subtle" href={`/admin/export?kind=bookings&${range}`}>
                <Download className="size-4" /> Lịch hẹn & hoa hồng
              </a>
              <a className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold hover:bg-subtle" href={`/admin/export?kind=pros&${range}`}>
                <Download className="size-4" /> Theo người làm
              </a>
              <a className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold hover:bg-subtle" href={`/admin/export?kind=wallet&${range}`}>
                <Download className="size-4" /> Sổ ví (đối chiếu ngân hàng)
              </a>
            </div>
          </Card>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-2 pr-2 font-medium">Người làm</th>
                  <th className="py-2 pr-2 text-right font-medium">Lịch xong</th>
                  <th className="py-2 pr-2 text-right font-medium">Khách trả</th>
                  <th className="py-2 pr-2 text-right font-medium">Hoa hồng</th>
                  <th className="py-2 pr-2 text-right font-medium">Đã nạp</th>
                  <th className="py-2 text-right font-medium">Ví hiện tại</th>
                </tr>
              </thead>
              <tbody>
                {data.byPro.map((p) => (
                  <tr key={p.proId} className="border-t border-line">
                    <td className="py-2.5 pr-2">
                      <Link href={`/pros/${p.slug}`} className="font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <span className="block text-xs text-muted">
                        {p.nameOnCard ? `CCCD: ${p.nameOnCard}` : "Chưa xác minh CCCD"} · {p.district}, {p.city}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">{p.completed}</td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">{formatPrice(p.gmv)}</td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">{formatPrice(p.commission)}</td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">{formatPrice(p.topups)}</td>
                    <td className={cn("py-2.5 text-right tabular-nums", p.balance < 0 && "font-semibold text-danger")}>{formatPrice(p.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AdjustWallet pros={pros} onDone={() => setTick((t) => t + 1)} />
    </div>
  )
}

function Figure({ label, value, hint, strong, tone }: { label: string; value: string; hint?: string; strong?: boolean; tone?: "danger" }) {
  return (
    <Card className={cn("p-3.5", strong && "ring-1 ring-accent/30")}>
      <p className="text-[12px] text-muted">{label}</p>
      <p className={cn("mt-0.5 text-[20px] font-bold tabular-nums", tone === "danger" && "text-danger")}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </Card>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-3">
      <span className="text-ink-soft">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </p>
  )
}

/** A signed correction to a freelancer's wallet, e.g. a fee charged on a job that did not happen. */
function AdjustWallet({ pros, onDone }: { pros: AdminPro[]; onDone: () => void }) {
  const refresh = useRefresh()
  const [proId, setProId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [note, setNote] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null)
  // "-27000" or "27.000": the sign is kept, the separators are not.
  const value = Number(amount.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "")) || 0

  return (
    <Card className="space-y-3 p-4">
      <div>
        <p className="font-semibold">Điều chỉnh ví đối tác</p>
        <p className="text-[13px] text-muted">
          Cho tranh chấp và nhầm lẫn: hoàn phí của lịch không diễn ra, bù thiệt hại, sửa khoản nạp sai. Số âm để trừ. Bắt buộc ghi lý do; mọi điều
          chỉnh được ghi vào nhật ký. Tiền chuyển khoản vào thì dùng tab Nạp ví.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_160px]">
        <Field label="Đối tác">
          <select className={cn(inputClass, "text-sm")} value={proId} onChange={(e) => setProId(e.target.value)}>
            <option value="">Chọn đối tác</option>
            {pros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · ví {formatPrice(p.wallet)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Số tiền (đ)" hint={value ? (value > 0 ? `Cộng ${formatPrice(value)}` : `Trừ ${formatPrice(-value)}`) : undefined}>
          <input className={cn(inputClass, "text-sm")} inputMode="numeric" placeholder="27000 hoặc -27000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
      <Field label="Lý do">
        <input className={cn(inputClass, "text-sm")} placeholder="VD: Hoàn phí lịch #… khách huỷ sau khi đã bấm hoàn thành" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          disabled={busy || !proId || !value || note.trim().length < 5}
          onClick={async () => {
            setBusy(true)
            const r = await adjustWallet(proId, value, note)
            setBusy(false)
            setResult(r.ok ? { ok: true, text: "Đã điều chỉnh và ghi nhật ký." } : { ok: false, text: r.error })
            if (r.ok) {
              setAmount("")
              setNote("")
              refresh()
              onDone()
            }
          }}
        >
          Điều chỉnh
        </Button>
        {result && <p className={cn("text-[13px]", result.ok ? "text-success" : "text-danger")}>{result.text}</p>}
      </div>
    </Card>
  )
}

// Settings ----------------------------------------------------------------------------

/** Company details, the transfer account, support contacts and the referral programme; fees read-only; the admin log. */
export function SettingsPanel({ settings, fees, log }: { settings: PlatformSettings; fees: FeePolicyView; log: AdminAction[] }) {
  const refresh = useRefresh()
  const [s, setS] = React.useState(settings)
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null)
  const set = <K extends keyof PlatformSettings>(k: K, v: PlatformSettings[K]) => setS((x) => ({ ...x, [k]: v }))
  const text = (k: keyof PlatformSettings, label: string, hint?: string, placeholder?: string) => (
    <Field label={label} hint={hint}>
      <input className={cn(inputClass, "text-sm")} value={String(s[k] ?? "")} placeholder={placeholder} onChange={(e) => set(k, e.target.value as never)} />
    </Field>
  )
  const money = (k: keyof PlatformSettings, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input
        className={cn(inputClass, "text-sm")}
        inputMode="numeric"
        value={String(s[k] ?? 0)}
        onChange={(e) => set(k, (Number(e.target.value.replace(/\D/g, "")) || 0) as never)}
      />
    </Field>
  )
  const pct = (n: number) => `${Math.round(n * 1000) / 10}%`

  return (
    <div className="mt-4 space-y-4">
      <Card className="space-y-4 p-4">
        <p className="font-semibold">Thông tin công ty</p>
        <p className="-mt-3 text-[13px] text-muted">Hiện ở chân trang, trang Quy chế hoạt động và khi khách/đối tác cần liên hệ.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {text("companyName", "Tên công ty")}
          {text("companyTaxId", "Mã số thuế")}
          {text("companyAddress", "Địa chỉ trụ sở")}
          {text("supportZalo", "Zalo hỗ trợ", "Số điện thoại hoặc link Zalo OA")}
          {text("supportEmail", "Email hỗ trợ")}
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <p className="font-semibold">Tài khoản nhận phí từ đối tác</p>
        <p className="-mt-3 text-[13px] text-muted">
          Hiện trên mã VietQR khi đối tác thanh toán phí. Đổi tài khoản ở đây thì phải đổi cả tài khoản nhận webhook trên SePay, nếu không tiền sẽ không tự
          cộng vào ví.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {text("topupBankBin", "Mã BIN ngân hàng", "MB: 970422", "970422")}
          {text("topupAccountNo", "Số tài khoản")}
          {text("topupAccountName", "Tên chủ tài khoản")}
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <p className="font-semibold">Chương trình giới thiệu</p>
        <label className="-mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.referralEnabled} onChange={(e) => set("referralEnabled", e.target.checked)} /> Đang chạy
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          {money("referralCustomerAmount", "Voucher cho khách (đ)")}
          {money("referralProAmount", "Thưởng khi giới thiệu đối tác (đ)")}
          {money("referralMinTotal", "Lịch tối thiểu để dùng voucher (đ)")}
          {money("referralMonthlyCap", "Tối đa phần thưởng / người / tháng")}
          {money("voucherDays", "Voucher dùng trong (ngày)")}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const r = await updatePlatformSettings(s)
            setBusy(false)
            setResult(r.ok ? { ok: true, text: "Đã lưu. Thay đổi được ghi vào nhật ký bên dưới." } : { ok: false, text: r.error })
            if (r.ok) refresh()
          }}
        >
          Lưu cấu hình
        </Button>
        {result && <p className={cn("text-[13px]", result.ok ? "text-success" : "text-danger")}>{result.text}</p>}
      </div>

      <Card className="p-4">
        <p className="font-semibold">Phí và quy định đặt lịch</p>
        <p className="mt-0.5 text-[13px] text-muted">
          Chỉ xem. Các con số này cũng được in trên trang Đối tác, Trợ giúp, Quy chế và trong app, nên đổi phí cần sửa cả nội dung đó cùng lúc: nhờ
          đội kỹ thuật đổi, đừng sửa riêng database.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm md:grid-cols-2">
          <Line label="Hoa hồng trên giá dịch vụ" value={pct(fees.commissionRate)} />
          <Line label="Ví âm tối đa trước khi bị chặn" value={formatPrice(fees.walletFloor)} />
          <Line label="Người làm phải nhận lịch trong" value={`${fees.confirmWithinHours} giờ`} />
          <Line label="Huỷ miễn phí trước giờ hẹn" value={`${fees.freeCancelHours} giờ`} />
          <Line label="Di chuyển miễn phí" value={`${fees.freeTravelKm} km`} />
          <Line label="Phí di chuyển" value={`${formatPrice(fees.travelFeePerKm)}/km, tối đa ${formatPrice(fees.travelFeeCap)}`} />
          <Line label="Phí đặt gấp" value={`${formatPrice(fees.urgentFee)} (trong ${fees.urgentWithinHours} giờ)`} />
        </div>
      </Card>

      <Card className="p-4">
        <p className="font-semibold">Nhật ký thao tác quản trị</p>
        <p className="mt-0.5 text-[13px] text-muted">Khoá/mở tài khoản, điều chỉnh ví, đổi cấu hình: ai làm, lúc nào, đổi gì.</p>
        {log.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Chưa có thao tác nào.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {log.map((a) => (
              <li key={a.id} className="py-2">
                <span className="font-semibold">{describe(a)}</span>
                <span className="block text-xs text-muted">
                  {a.actor} · {timeAgo(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function describe(a: AdminAction) {
  const d = a.detail
  switch (a.action) {
    case "account:lock":
      return `Khoá tài khoản${d.reason ? `: ${String(d.reason)}` : ""}`
    case "account:unlock":
      return "Mở khoá tài khoản"
    case "account:reset_password":
      return "Đặt lại mật khẩu (hỗ trợ qua Zalo)"
    case "report:view_chat":
      return "Xem tin nhắn hai bên của một báo cáo"
    case "wallet:adjust":
      return `Điều chỉnh ví ${formatPrice(Number(d.amount ?? 0))}: ${String(d.note ?? "")}`
    default:
      if (a.action.startsWith("settings:")) return `Đổi cấu hình: ${Object.keys(d).join(", ")}`
      return a.action
  }
}

// Help assistant ------------------------------------------------------------------------

const HELP_FILTERS: { value: HelpQuestionFilter; label: string }[] = [
  { value: "uncovered", label: "Chưa có câu trả lời" },
  { value: "unhelpful", label: "Bị chê" },
  { value: "all", label: "Tất cả" },
]
const entryTitle = new Map(HELP_ENTRIES.map((e) => [e.id, e.q]))

/**
 * What people asked the help assistant. "Chưa có câu trả lời" is the to-do
 * list: each one is a question lib/help/knowledge.ts should answer.
 */
export function HelpQuestionsPanel() {
  const [filter, setFilter] = React.useState<HelpQuestionFilter>("uncovered")
  const [rows, setRows] = React.useState<AdminHelpQuestion[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let live = true
    void adminHelpQuestions(filter).then((r) => {
      if (!live) return
      if (r.ok) {
        setRows(r.data)
        setError(null)
      } else setError(r.error)
    })
    return () => {
      live = false
    }
  }, [filter])

  return (
    <div className="mt-4 space-y-3">
      <p className="text-[13px] text-muted">
        Câu hỏi người dùng gửi trợ lý ở trang Trợ giúp (giữ 180 ngày, đã che số điện thoại và email). Câu chưa có câu trả lời là
        việc cần bổ sung vào FAQ.
      </p>
      <div className="flex flex-wrap gap-2">
        {HELP_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "primary" : "soft"}
            onClick={() => {
              setRows(null)
              setFilter(f.value)
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>
      {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="Chưa có câu hỏi nào" text="Câu hỏi sẽ hiện ở đây khi người dùng hỏi trợ lý." />
      ) : (
        <ul className="space-y-2">
          {rows.map((q) => (
            <li key={q.id}>
              <Card className="space-y-1.5 p-3.5 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="rounded-full bg-subtle px-2 py-0.5 font-semibold text-ink">{q.audience === "doi-tac" ? "Đối tác" : "Khách"}</span>
                  {!q.covered && <span className="rounded-full bg-warning-soft px-2 py-0.5 font-semibold text-warning">Chưa có trong FAQ</span>}
                  {q.helpful === false && <span className="rounded-full bg-danger-soft px-2 py-0.5 font-semibold text-danger">Không hữu ích</span>}
                  {q.helpful === true && <span className="rounded-full bg-success-soft px-2 py-0.5 font-semibold text-success">Hữu ích</span>}
                  <span>{timeAgo(q.createdAt)}</span>
                  <span>· {q.model}</span>
                </div>
                <p className="font-semibold">{q.question}</p>
                <p className="whitespace-pre-line text-ink-soft">{q.answer}</p>
                {q.sources.length > 0 && (
                  <p className="text-xs text-muted">Dựa trên: {q.sources.map((id) => entryTitle.get(id) ?? id).join(" · ")}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// The catalogue ----------------------------------------------------------------------------

/**
 * The services and the three prices partners choose between, read-only: the
 * catalogue lives in lib/catalog.ts and reaches the database by migration, so
 * a change goes through a code review rather than a form. Next to each price,
 * how many partners picked it.
 */
export function CatalogPanel() {
  const [category, setCategory] = React.useState<CategoryId>("nail")
  const [usage, setUsage] = React.useState<Record<string, number>>({})
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let live = true
    catalogUsage().then((r) => {
      if (!live) return
      if (r.ok) setUsage(r.data)
      else setError(r.error)
    })
    return () => {
      live = false
    }
  }, [])

  const templates = CATALOG.filter((t) => t.category === category)
  const labels = tierLabels()

  return (
    <div className="mt-4 space-y-3">
      <Card className="p-4 text-sm">
        <p className="font-semibold">Danh mục dịch vụ & bảng giá (phiên bản {CATALOG_VERSION})</p>
        <p className="mt-1 text-xs text-muted">
          {CATALOG.length} dịch vụ trong {CATEGORIES.length} ngành. Đối tác chỉ chọn dịch vụ và một trong 3 mức giá có sẵn, không tự nhập giá. {PRICE_LEVEL_NOTE}
        </p>
        <p className="mt-1 text-xs text-muted">Chỉ xem. Muốn thêm hoặc đổi giá: báo đội kỹ thuật cập nhật danh mục.</p>
        {error && <p className="mt-2 text-xs text-danger">Không tải được số đối tác đã chọn: {error}</p>}
      </Card>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              c.id === category ? "border-ink bg-ink text-canvas" : "border-line hover:bg-subtle",
            )}
          >
            {c.label} ({CATALOG.filter((t) => t.category === c.id).length})
          </button>
        ))}
      </div>
      {templates.map((t) => (
        <Card key={t.id} className="p-4">
          <p className="font-semibold">{t.name}</p>
          <p className="text-xs text-muted">
            {t.id}
            {t.studioOnly && " · chỉ tại studio"}
            {t.onLocation && " · tại địa điểm khách chọn"}
            {t.requiresVerification && " · cần xác minh danh tính"}
            {t.deliverable && ` · giao: ${t.deliverable}`}
            {t.deliveryDays ? ` trong ${t.deliveryDays} ngày` : ""}
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[13px]">
              <thead className="text-[11px] text-muted">
                <tr>
                  <th className="py-1 pr-2 font-medium">Gói</th>
                  {labels.map((l) => (
                    <th key={l} className="py-1 pr-2 font-medium">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.variants.map((v) => (
                  <tr key={v.id} className="border-t border-line">
                    <td className="py-1.5 pr-2">
                      {v.label}
                      <span className="block text-[11px] text-muted">
                        {v.durationMin} phút{v.perPerson ? " / người" : ""}
                        {v.sessions && v.sessions > 1 ? ` · ${v.sessions} buổi` : ""}
                      </span>
                    </td>
                    {v.tiers.map((price) => {
                      const n = usage[`${t.id}/${v.id}/${price}`] ?? 0
                      return (
                        <td key={price} className="py-1.5 pr-2">
                          {formatPrice(price)}
                          <span className="block text-[11px] text-muted">{n} đối tác</span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  )
}
