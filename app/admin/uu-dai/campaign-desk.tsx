"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { adminCampaign, type VoucherCampaign } from "@/lib/api/voucher-campaign"
import { Button, Card, inputClass } from "@/components/ui"
import { formatPrice } from "@/lib/utils"

const expiry = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" })
export function CampaignDesk({ rows }: { rows: VoucherCampaign[] }) {
  const router = useRouter()
  const [message, setMessage] = React.useState("")
  const [pending, start] = React.useTransition()
  const run = (action: "create" | "pause" | "resume", input: object) => start(async () => {
    try {
      const result = await adminCampaign(action, input)
      if (!result.ok) return setMessage(result.error)
      setMessage("Đã lưu.")
      router.refresh()
    } catch { setMessage("Mất kết nối. Vui lòng thử lại.") }
  })
  return <>
    {message && <p role="status" className="font-semibold">{message}</p>}
    <Card className="p-4">
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
        e.preventDefault()
        const fields = Object.fromEntries(new FormData(e.currentTarget))
        run("create", { ...fields, endsAt: fields.endsAt + ":00+07:00" })
      }}>
        <label className="grid gap-1">Mã<input className={inputClass} name="code" required pattern="[A-Za-z0-9][A-Za-z0-9\-]{4,19}" maxLength={20} /></label>
        <label className="grid gap-1">Tên ưu đãi<input className={inputClass} name="title" required minLength={3} maxLength={80} /></label>
        <label className="grid gap-1">Giảm (đồng)<input className={inputClass} name="amount" required type="number" min={1000} max={5000000} /></label>
        <label className="grid gap-1">Tổng đơn tối thiểu (đồng)<input className={inputClass} name="minTotal" required type="number" min={1000} /></label>
        <label className="grid gap-1">Số lượt nhận<input className={inputClass} name="limit" required type="number" min={1} max={10000} /></label>
        <label className="grid gap-1">Hạn dùng (giờ Việt Nam)<input className={inputClass} name="endsAt" required type="datetime-local" step={60} /></label>
        <div><Button type="submit" disabled={pending}>Tạo mã ở trạng thái tạm dừng</Button></div>
      </form>
    </Card>
    <section className="space-y-2">
      {rows.map((row) => <Card key={row.code} className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div><h2 className="font-bold">{row.title} · {row.code}</h2>
          <p className="text-meta">{formatPrice(row.amount)} cho đơn từ {formatPrice(row.min_total)} · {row.claimed}/{row.claim_limit} lượt</p>
          <p className="text-meta text-ink-soft">Hạn {expiry.format(new Date(row.ends_at))} · {row.paused ? "Tạm dừng" : "Đang mở"}</p></div>
        <Button variant="outline" disabled={pending} onClick={() => run(row.paused ? "resume" : "pause", { code: row.code })}>{row.paused ? "Mở nhận mã" : "Tạm dừng"}</Button>
      </Card>)}
    </section>
  </>
}
