"use client"

import * as React from "react"
import Image from "next/image"
import { bookingCheckout, requestCashout } from "@/lib/api/marketplace-money"
import { bookingQrPath, type BookingCheckout } from "@/lib/payments/vietqr"
import { formatPrice } from "@/lib/utils"
import { Button, Card, inputClass } from "./ui"

export function BookingPayment({ id, customer }: { id: string; customer: boolean }) {
  const [data, setData] = React.useState<BookingCheckout | null>(null)
  const [error, setError] = React.useState("")
  const [pending, start] = React.useTransition()
  const [bank, setBank] = React.useState("")
  const [account, setAccount] = React.useState("")
  const [holder, setHolder] = React.useState("")
  const read = React.useCallback(() => bookingCheckout(id), [id])
  React.useEffect(() => {
    let current = true
    void read().then((r) => { if (current && r.ok) setData(r.data) }).catch(() => {})
    return () => { current = false }
  }, [read])
  const invoice = data?.invoice
  React.useEffect(() => {
    if (!invoice?.payable) return
    let current = true
    const timer = window.setInterval(() => {
      if (!document.hidden) void read().then((r) => { if (current && r.ok) setData(r.data) }).catch(() => {})
    }, 8000)
    return () => { current = false; clearInterval(timer) }
  }, [invoice?.payable, read])
  if (!data || (!data.canIssue && !invoice && !data.cashout)) return null
  const action = (name: "issue" | "cancel" | "read" | "cashout") => start(async () => {
    setError("")
    try {
      if (name === "cashout") {
        const r = await requestCashout(id, bank, account, holder)
        if (!r.ok) return setError(r.error)
        const refreshed = await read()
        if (refreshed.ok) setData(refreshed.data)
        else setError(refreshed.error)
      } else {
        const r = await bookingCheckout(id, name)
        if (!r.ok) return setError(r.error)
        setData(r.data)
      }
    } catch { setError("Mất kết nối. Vui lòng thử lại.") }
  })
  return <Card className="my-4 space-y-3 p-4">
    <h2 className="font-bold">Thanh toán QR</h2>
    {invoice ? (
      invoice.paidAt ? <p className="font-semibold text-success">Đã nhận {formatPrice(invoice.amount)} qua ngân hàng. Không thu thêm cho lịch này.</p>
      : invoice.payable ? <>
        {customer ? <>
          <Image src={bookingQrPath(invoice)} alt="QR thanh toán lịch hẹn" width={224} height={224} unoptimized className="mx-auto rounded-lg border border-line" />
          <p className="text-center font-bold">{formatPrice(invoice.amount)}</p>
          <p className="text-meta text-ink-soft">Tài khoản <strong>{invoice.account}</strong> · {invoice.holder}</p>
          <p className="text-meta text-ink-soft">Nội dung <strong>{invoice.memo}</strong>. Chuyển đúng số tiền một lần trước {new Date(invoice.expiresAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })}.</p>
        </> : <p className="text-meta text-ink-soft">Khách đang chọn QR. Chờ hệ thống báo đã nhận hoặc khách huỷ QR trước khi thu trực tiếp.</p>}
      </> : <p className="text-meta text-ink-soft">QR không còn hiệu lực. Nếu đã chuyển, liên hệ hỗ trợ để đối soát trước khi trả thêm.</p>
    ) : <Button onClick={() => action("issue")} disabled={pending}>Tạo QR {customer ? "thanh toán" : ""}</Button>}
    {customer && invoice && !invoice.paidAt && <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={pending} onClick={() => action("read")}>Kiểm tra giao dịch</Button>
      <Button variant="outline" disabled={pending} onClick={() => { if (window.confirm("Chỉ huỷ nếu bạn chưa chuyển tiền. Huỷ QR này?")) action("cancel") }}>Huỷ QR chưa trả</Button>
    </div>}
    {data.cashout ? <p className="text-meta">Khoản {data.cashout.kind === "refund" ? "hoàn" : "chi"} {formatPrice(data.cashout.amount)}: <strong>{data.cashout.state === "sent" ? "Đã ghi nhận chuyển" : data.cashout.state === "processing" ? "Đang xử lý" : "Đã gửi yêu cầu"}</strong></p>
      : data.refundDue ? <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); action("cashout") }}>
        <input className={inputClass} required aria-label="Ngân hàng" placeholder="Ngân hàng nhận hoàn" value={bank} onChange={(e) => setBank(e.target.value)} />
        <input className={inputClass} required inputMode="numeric" pattern="[0-9]{6,20}" aria-label="Số tài khoản" placeholder="Số tài khoản" value={account} onChange={(e) => setAccount(e.target.value)} />
        <input className={inputClass} required aria-label="Chủ tài khoản" placeholder="Chủ tài khoản" value={holder} onChange={(e) => setHolder(e.target.value)} />
        <Button type="submit" disabled={pending}>Yêu cầu hoàn tiền</Button>
      </form> : data.artistDue ? <Button variant="outline" onClick={() => action("cashout")} disabled={pending}>Yêu cầu chi về tài khoản đã lưu</Button> : null}
    {error && <p role="alert" className="text-meta text-danger">{error}</p>}
  </Card>
}
