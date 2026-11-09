"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { manageBookingMoney, type BookingMoneyDesk } from "@/lib/api/marketplace-money"
import { Button, Card, inputClass } from "@/components/ui"
import { formatPrice } from "@/lib/utils"

type Action = "configure" | "reserve" | "sent" | "release"

export function MoneyDesk({ initial }: { initial: BookingMoneyDesk }) {
  const { settings, cashouts } = initial
  const router = useRouter()
  const [error, setError] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [pending, start] = React.useTransition()
  const run = (action: Action, id: string | null, fields: Record<string, unknown> = {}) => start(async () => {
    setError(""); setNotice("")
    try {
      const r = await manageBookingMoney(action, id, fields)
      if (!r.ok) { setError(r.error); return }
      setNotice("Đã lưu thay đổi.")
      router.refresh()
    } catch { setError("Mất kết nối. Vui lòng thử lại.") }
  })
  return <>
    {error && <p role="alert" className="rounded-lg border border-danger p-3 text-danger">{error}</p>}
    {notice && <p role="status" className="text-success">{notice}</p>}
    <Card className="space-y-3 p-4">
      <h2 className="text-lead font-bold">Tài khoản nhận QR</h2>
      <form className="grid gap-3" onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        if (fd.get("enabled") === "on" && !window.confirm("Mở chuyển khoản QR cho khách với tài khoản này?")) return
        run("configure", null, { enabled: fd.get("enabled") === "on", bin: fd.get("bin"), account: fd.get("account"), holder: fd.get("holder") })
      }}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1">Mã BIN (6 số)<input className={inputClass} name="bin" defaultValue={settings.bin ?? ""} pattern="[0-9]{6}" inputMode="numeric" /></label>
          <label className="grid gap-1">Số tài khoản<input className={inputClass} name="account" defaultValue={settings.account ?? ""} pattern="[0-9]{4,20}" inputMode="numeric" /></label>
          <label className="grid gap-1">Chủ tài khoản<input className={inputClass} name="holder" defaultValue={settings.holder ?? ""} maxLength={80} /></label>
        </div>
        <label className="inline-flex min-h-10 items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={settings.enabled} /> Bật QR cho lịch đã được nhận</label>
        <p className="text-meta text-ink-soft">Kết nối tài khoản này vào webhook SePay và đối soát thử trước khi bật.</p>
        <div><Button type="submit" disabled={pending}>Lưu cấu hình</Button></div>
      </form>
    </Card>
    <section className="space-y-3">
      <h2 className="text-lead font-bold">Hoàn khách và chi đối tác</h2>
      {!cashouts.length && <p className="text-ink-soft">Chưa có yêu cầu.</p>}
      {cashouts.map((row) => <Card key={row.booking_id} className="space-y-2 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-bold">{row.kind === "refund" ? "Hoàn cho khách" : "Chi cho đối tác"} · {formatPrice(row.amount)}</h3>
          <span className="text-meta font-semibold text-ink-soft">{row.state === "sent" ? "Đã ghi nhận chuyển" : row.state === "processing" ? "Đang xử lý" : "Chờ xử lý"}</span>
        </div>
        <p className="break-all text-meta text-ink-soft">Lịch {row.booking_id}</p>
        {row.state === "queued" ? <Button variant="outline" disabled={pending} onClick={() => run("reserve", row.booking_id)}>Giữ khoản chi để xử lý</Button>
        : row.state === "processing" && row.mine ? <>
          <p className="break-words">Nhận tại {row.bank} · <strong>{row.account}</strong> · {row.holder}</p>
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
            e.preventDefault()
            const reference = new FormData(e.currentTarget).get("reference")
            if (window.confirm(`Xác nhận đã chuyển ${formatPrice(row.amount)} và đã đối chiếu mã với sao kê?`)) run("sent", row.booking_id, { reference })
          }}>
            <label className="grid flex-1 gap-1">Mã giao dịch ngân hàng<input className={inputClass} required name="reference" minLength={5} maxLength={80} /></label>
            <Button type="submit" disabled={pending}>Ghi nhận đã chuyển</Button>
          </form>
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
            e.preventDefault()
            const reason = new FormData(e.currentTarget).get("reason")
            if (window.confirm("Trả khoản chi về hàng chờ sau khi đã kiểm tra chưa chuyển?")) run("release", row.booking_id, { reason })
          }}>
            <label className="grid flex-1 gap-1">Lý do trả hàng chờ<input className={inputClass} required name="reason" minLength={8} maxLength={200} /></label>
            <Button type="submit" variant="outline" disabled={pending}>Trả hàng chờ</Button>
          </form>
        </> : row.state === "processing" ? <p className="text-meta">Một nhân viên khác đang xử lý.</p>
        : <p className="break-all text-meta">Mã đối soát: {row.bank_ref}</p>}
      </Card>)}
    </section>
  </>
}
