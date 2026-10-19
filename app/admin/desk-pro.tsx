"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ExternalLink, Lock, Pause, Play, Unlock, X } from "lucide-react"
import { Avatar } from "@/components/ui"
import {
  adminProDetail,
  decideProfile,
  setAcceptingJobs,
  setSuspended,
  type AdminPro,
  type AdminProDetail,
} from "@/lib/api/admin"
import { cn, formatPrice, localDate, timeAgo } from "@/lib/utils"
import { ActButton, PanelError } from "./desk-shared"
import { Badge, Button, Skeleton, inputClass } from "./ui"

type Run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done?: string) => Promise<boolean>
type Tone = "neutral" | "success" | "warning" | "danger" | "info"

/**
 * One word for where a profile stands, instead of a row of flags: what the
 * staff need to know first. Locked beats everything; then live or not, and if
 * not, why not.
 */
export function proStatus(p: Pick<AdminPro, "suspended" | "published" | "reviewStatus">): { label: string; tone: Tone } {
  if (p.suspended) return { label: "Tạm khoá", tone: "danger" }
  if (p.published) return { label: "Đang hiện", tone: "success" }
  switch (p.reviewStatus) {
    case "pending":
      return { label: "Chờ duyệt", tone: "warning" }
    case "changes_requested":
      return { label: "Cần sửa", tone: "warning" }
    case "rejected":
      return { label: "Từ chối", tone: "danger" }
    case "approved":
      return { label: "Đang ẩn", tone: "neutral" }
    default:
      return { label: "Chưa gửi duyệt", tone: "neutral" }
  }
}

const storagePhoto = (url: string | null): url is string => !!url && /^https?:\/\/[^/]+\/storage\/v1\/object\/public\//.test(url)

const LEDGER_KIND: Record<string, string> = {
  topup: "Nạp ví",
  commission: "Phí hoa hồng",
  adjustment: "Điều chỉnh",
  refund: "Hoàn",
  no_show_comp: "Bù vắng mặt",
}

/**
 * Everything about one partner, and what the staff can do with the profile:
 * approve (live at once, taking jobs), ask for changes or reject with a reason
 * the partner reads, switch new jobs off and on, lock. A panel over the list,
 * so the list keeps its place.
 */
export function ProDrawer({ proId, onClose, run }: { proId: string; onClose: () => void; run: Run }) {
  const [detail, setDetail] = React.useState<AdminProDetail | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [mode, setMode] = React.useState<null | "changes_requested" | "rejected" | "lock">(null)
  const [note, setNote] = React.useState("")

  const show = React.useCallback((r: Awaited<ReturnType<typeof adminProDetail>>) => {
    if (r.ok) {
      setDetail(r.data)
      setError(null)
    } else setError(r.error)
  }, [])
  const load = React.useCallback(async () => show(await adminProDetail(proId)), [proId, show])

  // Keyed by the partner (ProsPanel), so a new partner starts from an empty panel.
  React.useEffect(() => {
    let live = true
    void adminProDetail(proId).then((r) => live && show(r))
    return () => {
      live = false
    }
  }, [proId, show])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  /** Runs an action, then reads the partner again so the panel shows what changed. */
  const act = async (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string) => {
    const ok = await run(fn, done)
    if (ok) {
      setMode(null)
      setNote("")
    }
    await load()
  }

  const status = detail ? proStatus(detail) : null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={detail ? `Hồ sơ ${detail.name}` : "Hồ sơ đối tác"}>
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col bg-canvas shadow-2xl">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
          {detail ? (
            <>
              <Avatar name={detail.name} src={detail.avatar ?? undefined} size={40} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[15px] font-semibold">{detail.name}</span>
                  {status && <Badge tone={status.tone}>{status.label}</Badge>}
                  {detail.published && !detail.acceptingJobs && <Badge>Không nhận lịch mới</Badge>}
                </p>
                <p className="truncate text-label text-muted">
                  {[detail.title, detail.categories.join(", "), detail.area].filter(Boolean).join(" · ")}
                </p>
              </div>
            </>
          ) : (
            <Skeleton className="h-10 flex-1" />
          )}
          <button type="button" aria-label="Đóng" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-subtle">
            <X className="size-4" />
          </button>
        </header>

        {error && (
          <div className="p-4">
            <PanelError text={error} onRetry={() => void load()} />
          </div>
        )}

        {!detail && !error && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-40" />
            <Skeleton className="h-32" />
          </div>
        )}

        {detail && (
          <>
            {/* What the staff can do, always in view. */}
            <div className="border-b border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {!detail.suspended && !detail.published && (
                  <ActButton onClick={() => act(() => decideProfile(detail.id, "approved"), `Đã duyệt ${detail.name}: hồ sơ đang hiện và nhận lịch.`)}>
                    <Check /> Duyệt & hiện hồ sơ
                  </ActButton>
                )}
                {!detail.suspended && (
                  <Button variant="outline" onClick={() => setMode(mode === "changes_requested" ? null : "changes_requested")}>
                    {detail.published ? "Gỡ & yêu cầu sửa" : "Yêu cầu sửa"}
                  </Button>
                )}
                {!detail.suspended && detail.reviewStatus !== "rejected" && (
                  <Button variant="outline" onClick={() => setMode(mode === "rejected" ? null : "rejected")}>
                    Từ chối
                  </Button>
                )}
                {!detail.suspended && detail.published && (
                  <ActButton
                    variant="outline"
                    onClick={() =>
                      act(
                        () => setAcceptingJobs(detail.id, !detail.acceptingJobs),
                        detail.acceptingJobs ? `Đã tắt nhận lịch mới của ${detail.name}.` : `Đã bật nhận lịch mới cho ${detail.name}.`,
                      )
                    }
                  >
                    {detail.acceptingJobs ? <Pause /> : <Play />} {detail.acceptingJobs ? "Tắt nhận lịch" : "Bật nhận lịch"}
                  </ActButton>
                )}
                <span className="flex-1" />
                {detail.suspended ? (
                  <ActButton variant="outline" onClick={() => act(() => setSuspended(detail.id, false), `Đã mở khoá ${detail.name}.`)}>
                    <Unlock /> Mở khoá
                  </ActButton>
                ) : (
                  <Button variant="danger" onClick={() => setMode(mode === "lock" ? null : "lock")}>
                    <Lock /> Khoá
                  </Button>
                )}
              </div>

              {mode && (
                <div className={cn("mt-3 space-y-2 rounded-md border p-3", mode === "lock" ? "border-danger/25 bg-danger-soft/50" : "border-line bg-subtle/60")}>
                  <p className="text-meta text-ink-soft">
                    {mode === "lock"
                      ? "Khoá thì hồ sơ bị ẩn và đối tác không nhận được lịch mới; lịch đã nhận vẫn giữ. Lý do ghi vào nhật ký và gửi cho đối tác."
                      : mode === "rejected"
                        ? "Hồ sơ bị ẩn. Đối tác đọc đúng lý do bạn ghi, mỗi dòng một ý."
                        : detail.published
                          ? "Hồ sơ bị gỡ khỏi trang khách tới khi đối tác sửa và gửi lại. Đối tác đọc đúng lý do bạn ghi, mỗi dòng một ý."
                          : "Đối tác đọc đúng lý do bạn ghi, mỗi dòng một ý."}
                  </p>
                  <textarea
                    className={cn(inputClass, "h-auto min-h-20 py-2")}
                    placeholder={mode === "lock" ? "Lý do khoá (VD: khách báo không đến nhiều lần)" : "VD: Ảnh 2 là ảnh chụp màn hình, hãy đăng ảnh gốc"}
                    aria-label="Lý do"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <ActButton
                      variant={mode === "changes_requested" ? "primary" : "danger"}
                      disabled={note.trim().length < (mode === "lock" ? 5 : 3)}
                      onClick={() =>
                        mode === "lock"
                          ? act(() => setSuspended(detail.id, true, note.trim()), `Đã khoá ${detail.name}.`)
                          : act(() => decideProfile(detail.id, mode, note.trim()), `Đã gửi lý do cho ${detail.name}.`)
                      }
                    >
                      {mode === "lock" ? "Khoá đối tác" : mode === "rejected" ? "Từ chối hồ sơ" : "Gửi yêu cầu sửa"}
                    </ActButton>
                    <Button variant="ghost" onClick={() => setMode(null)}>
                      Thôi
                    </Button>
                  </div>
                </div>
              )}
              {!detail.published && detail.reviewNote && (
                <p className="mt-3 rounded-md border border-warning/20 bg-warning-soft px-3 py-2 text-meta text-warning">
                  Đã yêu cầu: {detail.reviewNote}
                </p>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <Section title="Thông tin">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-meta sm:grid-cols-3">
                  <Fact label="Điện thoại" value={detail.phone || "—"} />
                  <Fact label="Xác minh CCCD" value={detail.identity === "verified" ? "Đã xác minh" : detail.identity === "pending" ? "Đang chờ" : "Chưa"} />
                  <Fact label="Đồng ý chính sách" value={detail.termsAcceptedAt ? localDate(detail.termsAcceptedAt) : "Chưa"} />
                  <Fact label="Tham gia" value={localDate(detail.createdAt)} />
                  <Fact label="Gửi duyệt" value={detail.requestedAt ? timeAgo(detail.requestedAt) : "Chưa"} />
                  <Fact label="Job xong" value={`${detail.completedJobs}${detail.ratingCount ? ` · ★ ${detail.rating.toFixed(1)} (${detail.ratingCount})` : ""}`} />
                  <Fact label="Phục vụ" value={[detail.homeService ? "Tại nhà" : null, detail.studioAddress ? "Tại tiệm" : null].filter(Boolean).join(", ") || "—"} />
                  <Fact label="Kinh nghiệm" value={detail.yearsExp ? `${detail.yearsExp} năm` : "—"} />
                  <Fact label="Mã nạp" value={detail.payCode ?? "—"} />
                </dl>
                {(detail.bio || detail.highlights.length > 0) && (
                  <div className="mt-3 border-t border-line pt-3">
                    {detail.bio && <p className="whitespace-pre-line text-body">{detail.bio}</p>}
                    {detail.highlights.length > 0 && (
                      <ul className="mt-1 list-disc pl-5 text-meta text-ink-soft">
                        {detail.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <Link href={`/pros/${detail.slug}`} target="_blank" className="mt-3 inline-flex items-center gap-1.5 text-meta font-medium text-ink hover:underline">
                  <ExternalLink className="size-3.5" /> Xem trang hồ sơ như khách thấy
                </Link>
              </Section>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Section title={`Dịch vụ và giá (${detail.services.length})`}>
                  {detail.services.length === 0 ? (
                    <p className="text-meta text-muted">Chưa có dịch vụ nào đang bật.</p>
                  ) : (
                    <ul className="divide-y divide-line text-meta">
                      {detail.services.map((s) => (
                        <li key={s.name} className="flex justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                          <span className="min-w-0 truncate">{s.name}</span>
                          <span className="shrink-0 font-medium tabular-nums">{formatPrice(s.price)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
                <Section title="Giờ làm">
                  <p className="whitespace-pre-line text-meta text-ink-soft">{detail.hours ? detail.hours.split("; ").join("\n") : "Chưa có"}</p>
                </Section>
              </div>

              <Section title={`Tác phẩm (${detail.works.length})`}>
                {detail.works.length === 0 ? (
                  <p className="text-meta text-muted">Chưa đăng tác phẩm nào.</p>
                ) : (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {detail.works.map((w) => (
                      <li key={w.id} className="min-w-0">
                        <div className="relative aspect-square overflow-hidden rounded-md bg-subtle ring-1 ring-line">
                          {storagePhoto(w.photo) && <Image src={w.photo} alt="" fill sizes="140px" className={cn("object-cover", w.hiddenReason && "opacity-40")} />}
                          {w.video && <span className="absolute left-1 top-1 rounded bg-ink/70 px-1 text-[10px] font-medium text-white">Clip</span>}
                          {w.hiddenReason && <span className="absolute inset-x-1 bottom-1 rounded bg-danger px-1 text-center text-[10px] font-medium text-white">Đã ẩn</span>}
                        </div>
                        <p className="mt-1 truncate text-label text-ink-soft" title={w.hiddenReason ?? w.title}>
                          {w.title}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Section title="Ví phí">
                  <p className={cn("text-xl font-semibold tabular-nums", detail.wallet < 0 && "text-danger")}>{formatPrice(detail.wallet)}</p>
                  {detail.ledger.length > 0 && (
                    <ul className="mt-2 divide-y divide-line text-label">
                      {detail.ledger.map((e, i) => (
                        <li key={i} className="flex justify-between gap-2 py-1">
                          <span className="min-w-0 truncate text-ink-soft">
                            {LEDGER_KIND[e.kind] ?? e.kind} · {localDate(e.createdAt)}
                          </span>
                          <span className={cn("shrink-0 tabular-nums", e.amount < 0 ? "text-danger" : "text-success")}>
                            {e.amount > 0 ? "+" : ""}
                            {formatPrice(e.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
                <Section title="Lịch hẹn gần đây">
                  {detail.bookings.length === 0 ? (
                    <p className="text-meta text-muted">Chưa có lịch hẹn.</p>
                  ) : (
                    <ul className="divide-y divide-line text-label">
                      {detail.bookings.map((b) => (
                        <li key={b.id}>
                          <Link href={`/bookings/${b.id}`} target="_blank" className="flex justify-between gap-2 py-1 hover:underline">
                            <span className="min-w-0 truncate text-ink-soft">
                              {b.date.split("-").reverse().join("/")} · {b.customer}
                            </span>
                            <span className="shrink-0 tabular-nums">{formatPrice(b.total)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </div>

              <Section title="Lịch sử duyệt và thao tác">
                {detail.history.length === 0 ? (
                  <p className="text-meta text-muted">Chưa có.</p>
                ) : (
                  <ol className="space-y-2 text-meta">
                    {detail.history.map((h, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-20 shrink-0 text-label text-muted" title={new Date(h.at).toLocaleString("vi-VN")}>
                          {timeAgo(h.at)}
                        </span>
                        <span className="min-w-0">
                          <span className="font-medium">{h.who}</span> <span className="text-ink-soft">{h.text}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Section>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-line bg-surface p-3.5">
      <h4 className="mb-2 text-label font-medium uppercase tracking-wide text-muted">{title}</h4>
      {children}
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-label text-muted">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}
