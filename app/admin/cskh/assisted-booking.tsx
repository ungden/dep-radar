"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, inputClass } from "@/components/ui"
import { formatPrice } from "@/lib/utils"
import { supportBooking } from "./booking-action"

type Options = {
  addresses: { id: string; label: string; city: string; district: string }[]
  pro: { id: string; name: string; kind: string; home: boolean } | null
  services: { template: string; variant: string; label: string }[]
}
type Selection = { pro: string; template: string; variant: string; home: boolean; address: string; startsAt: string }

export function AssistedBooking({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [options, setOptions] = React.useState<Options | null>(null)
  const [home, setHome] = React.useState(false)
  const [draft, setDraft] = React.useState<{ selection: Selection; total: number; operation: string } | null>(null)
  const [error, setError] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [busy, start] = React.useTransition()
  const run = (work: () => Promise<void>) => start(async () => {
    setError(""); setNotice("")
    try { await work() } catch { setError("Chưa kết nối được. Vui lòng thử lại.") }
  })
  return <details className="rounded-xl border border-line bg-surface p-4">
    <summary className="cursor-pointer font-bold">Đặt lịch hộ khách</summary>
    <p className="mt-2 text-meta text-ink-soft">Chọn đối tác và một buổi, báo khách tổng tiền, rồi gửi lịch chờ đối tác nhận.</p>
    {error && <p role="alert" className="mt-2 text-meta text-danger">{error}</p>}
    {notice && <p role="status" className="mt-2 text-meta text-success">{notice}</p>}
    <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => {
      e.preventDefault()
      const raw = String(new FormData(e.currentTarget).get("pro") ?? "").trim()
      const slug = raw.replace(/\/$/, "").split("/").pop()?.split(/[?#]/)[0] ?? ""
      setOptions(null); setDraft(null)
      run(async () => {
        const r = await supportBooking<Options>("options", customerId, { slug })
        if (!r.ok) return setError(r.error)
        if (!r.data.pro) return setError("Không tìm thấy đối tác đang nhận lịch. Kiểm tra liên kết hồ sơ.")
        setOptions(r.data)
        setHome(r.data.pro.home && r.data.pro.kind === "artist")
      })
    }}>
      <label className="grid min-w-52 flex-1 gap-1">Link hoặc mã hồ sơ đối tác<input name="pro" required maxLength={200} className={inputClass} placeholder="VD: linh-pham" /></label>
      <Button type="submit" variant="outline" disabled={busy}>Tải dịch vụ</Button>
    </form>
    {options?.pro && <form key={options.pro.id} className="mt-4 grid gap-3 border-t border-line pt-4" onChange={() => setDraft(null)} onSubmit={(e) => {
      e.preventDefault()
      const pro = options.pro
      if (!pro) return
      const form = new FormData(e.currentTarget)
      const service = options.services[Number(form.get("service"))]
      if (!service || !form.get("startsAt") || (home && !form.get("address"))) return
      const selection = {
        pro: pro.id, template: service.template, variant: service.variant, home,
        address: home ? String(form.get("address")) : "", startsAt: String(form.get("startsAt")) + ":00+07:00",
      }
      setDraft(null)
      run(async () => {
        const r = await supportBooking<{ total: number }>("quote", customerId, selection)
        if (!r.ok) return setError(r.error)
        setDraft({ selection, total: r.data.total, operation: crypto.randomUUID() })
      })
    }}>
      <p className="font-semibold">{options.pro.name}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1">Gói dịch vụ<select name="service" className={inputClass} required defaultValue=""><option value="" disabled>Chọn gói</option>{options.services.map((s,i) => <option key={s.template+":"+s.variant} value={i}>{s.label}</option>)}</select></label>
        <label className="grid gap-1">Ngày giờ Việt Nam<input type="datetime-local" step={60} name="startsAt" className={inputClass} required /></label>
      </div>
      {options.pro.home && options.pro.kind === "artist" && <label className="flex items-center gap-2"><input type="checkbox" checked={home} onChange={(e) => setHome(e.target.checked)} /> Làm tại địa chỉ khách</label>}
      {home && <label className="grid gap-1">Địa chỉ đã lưu<select name="address" className={inputClass} required defaultValue=""><option value="" disabled>{options.addresses.length ? "Chọn địa chỉ" : "Khách chưa lưu địa chỉ có vị trí"}</option>{options.addresses.map((a) => <option key={a.id} value={a.id}>{a.label} · {a.district}, {a.city}</option>)}</select></label>}
      <div><Button type="submit" variant="outline" disabled={busy || !options.services.length}>Kiểm tra lịch và báo giá</Button></div>
    </form>}
    {draft && <form key={draft.operation} className="mt-4 grid gap-3 rounded-lg bg-subtle p-4" onSubmit={(e) => {
      e.preventDefault()
      const form = new FormData(e.currentTarget)
      run(async () => {
        const r = await supportBooking<{ id: string }>("place", customerId, { ...draft.selection, total: draft.total, operation: draft.operation, consent: form.get("consent"), approved: form.get("approved") === "on" })
        if (!r.ok) return setError(r.error)
        setDraft(null)
        setNotice("Đã gửi lịch. Lịch sẽ hiện sau khi tải lại danh sách.")
        router.refresh()
      })
    }}>
      <p className="font-bold">Tổng khách trả trực tiếp: {formatPrice(draft.total)}</p>
      <label className="grid gap-1">Ghi nhận khách đồng ý<input name="consent" required className={inputClass} minLength={12} maxLength={240} placeholder="VD: Khách xác nhận qua cuộc gọi lúc 15:10" /></label>
      <label className="flex items-start gap-2"><input type="checkbox" name="approved" required className="mt-1" /> Khách đã đồng ý đối tác, gói, giờ, địa điểm và tổng tiền trên.</label>
      <div><Button type="submit" disabled={busy}>Gửi lịch hộ khách</Button></div>
    </form>}
  </details>
}
