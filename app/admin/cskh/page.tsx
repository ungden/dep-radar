import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseServer } from "@/lib/supabase/server"
import { AssistedBooking } from "./assisted-booking"
import { CustomerNote } from "./customer-note"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Bàn CSKH", robots: { index: false, follow: false } }

type Desk = {
  person: { id: string; name: string | null; phone: string | null } | null
  notes: { id: string; body: string; author: string | null; createdAt: string }[]
  counts: { waiting: number; live: number; stalled: number; failed: number }
  bookings: { id: string; customerId: string; customer: string; provider: string; kind: string; status: string; service: string; startsAt: string; reason: string | null; events: { id: number; event: string; at: string }[] }[]
}

const statusLabel: Record<string, string> = {
  pending: "Chờ nhận", confirmed: "Đã nhận", departed: "Đang đến", in_progress: "Đang làm",
  rescheduled: "Đã đổi giờ", completed: "Hoàn thành", cancelled: "Đã huỷ", declined: "Từ chối",
  expired: "Hết hạn", no_show: "Vắng mặt",
}
const fmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" })
const filters = [{ id: "stalled", label: "Cần xử lý" }, { id: "live", label: "Đang mở" }, { id: "failed", label: "Không hoàn thành" }, { id: "recent", label: "Gần đây" }]

export default async function SupportDesk({ searchParams }: { searchParams: Promise<{ customer?: string; filter?: string }> }) {
  const { customer, filter } = await searchParams
  const active = filters.find((f) => f.id === filter)?.id ?? "stalled"
  if (customer && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(customer)) notFound()
  const client = await supabaseServer()
  const { data, error } = await client.rpc("support_desk" as never, { p_customer: customer ?? null, p_filter: active } as never)
  if (error?.code === "42501" || (!error && !data)) notFound()
  const desk = data as unknown as Desk | null
  const signals = desk && !customer ? await client.rpc("support_marketplace_signals" as never) : null
  const stages = (signals?.data ?? {}) as Record<string, number>

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
    <header>
      <Link href={customer ? "/admin/cskh" : "/admin"} className="inline-flex min-h-11 items-center text-meta font-semibold text-accent-dark">← {customer ? "Bàn CSKH" : "Vận hành"}</Link>
      <h1 className="text-[30px] font-bold">{desk?.person?.name || "Bàn CSKH"}</h1>
      <p className="text-ink-soft">{desk?.person ? desk.person.phone || "Chưa có số điện thoại" : "Lịch cần xử lý và diễn biến từng lượt đặt."}</p>
    </header>
    {error && <p role="alert" className="text-danger">Chưa tải được dữ liệu. Hãy tải lại trang.</p>}
    {desk?.person ? <section className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <h2 className="text-lead font-bold">Lịch sử hỗ trợ</h2>
      <CustomerNote key={desk.person.id} customerId={desk.person.id} />
      {desk.notes.length ? <ul className="divide-y divide-line">{desk.notes.map((n) => <li key={n.id} className="py-3">
        <p className="whitespace-pre-wrap break-words">{n.body}</p>
        <p className="mt-1 text-meta text-muted">{n.author || "Nhân viên"} · {fmt.format(new Date(n.createdAt))}</p>
      </li>)}</ul> : <p className="text-meta text-muted">Chưa có ghi chú.</p>}
    </section> : desk && <>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([["Chờ nhận", desk.counts.waiting], ["Đang làm", desk.counts.live], ["Cần xử lý", desk.counts.stalled], ["Không hoàn thành (30 ngày)", desk.counts.failed]] as const)
          .map(([label, n]) => <div key={label} className="rounded-xl border border-line bg-surface p-4"><dt className="text-meta text-ink-soft">{label}</dt><dd className="text-[26px] font-bold">{n}</dd></div>)}
      </dl>
      {signals && !signals.error ? <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="font-bold">Tín hiệu đặt lịch trong 7 ngày</h2>
        <p className="mt-1 text-meta text-ink-soft">Đếm theo lượt mở màn đặt. Một lượt có thể có cả lỗi và gửi thành công.</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([["opened","Mở đặt lịch"],["slot_chosen","Chọn giờ"],["confirmation","Xem xác nhận"],["failed","Gặp lỗi gửi"],["created","Gửi thành công"]] as const)
            .map(([key,label]) => <div key={key}><dt className="text-meta text-ink-soft">{label}</dt><dd className="text-lead font-bold">{stages[key] ?? 0}</dd></div>)}
        </dl>
      </section> : null}
      <nav aria-label="Lọc lịch hẹn" className="flex flex-wrap gap-2">
        {filters.map((f) => <Link key={f.id} href={`/admin/cskh?filter=${f.id}`} aria-current={f.id === active ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-full border border-line px-4 font-semibold aria-[current=page]:bg-accent-soft">{f.label}</Link>)}
    </nav>
    </>}
    {desk?.person && <AssistedBooking customerId={desk.person.id} />}
    {desk && <section className="space-y-3">
      <h2 className="text-lead font-bold">Lịch hẹn</h2>
      {desk.bookings.length ? <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {desk.bookings.map((b) => <li key={b.id} className="space-y-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-semibold">{b.service || "Dịch vụ"} · {b.provider}</p>
              <p className="text-meta text-ink-soft">{b.kind === "spa" ? "Spa" : "Artist"} · {fmt.format(new Date(b.startsAt))}</p></div>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-meta font-semibold text-accent-dark">{statusLabel[b.status] || b.status}</span>
          </div>
          {!customer && <Link href={`/admin/cskh?customer=${b.customerId}`} className="inline-flex min-h-11 items-center font-semibold text-accent-dark">{b.customer || "Khách hàng"}</Link>}
          {b.reason && <p className="break-words text-meta text-ink-soft">{b.reason}</p>}
          {b.events.length > 0 && <details className="text-meta"><summary className="cursor-pointer py-2 font-semibold">Diễn biến ({b.events.length})</summary>
            <ol className="space-y-1 border-l border-line pl-4">{b.events.map((e) => <li key={e.id}>{fmt.format(new Date(e.at))} · {statusLabel[e.event] || e.event}</li>)}</ol>
          </details>}
        </li>)}
      </ul> : <p className="text-ink-soft">Không có lịch trong nhóm này.</p>}
    </section>}
  </main>
}
