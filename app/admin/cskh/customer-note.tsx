"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { saveCustomerNote } from "./actions"

export function CustomerNote({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [body, setBody] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [pending, start] = React.useTransition()
  return <form className="space-y-2" onSubmit={(event) => {
    event.preventDefault()
    start(async () => {
      try {
        const result = await saveCustomerNote(customerId, body)
        setStatus(result.message)
        if (result.ok) { setBody(""); router.refresh() }
      } catch { setStatus("Mất kết nối. Ghi chú vẫn còn trong ô nhập.") }
    })
  }}>
    <label className="block text-meta font-semibold" htmlFor="support-note">Ghi chú nội bộ</label>
    <textarea id="support-note" rows={3} value={body} maxLength={1500} required disabled={pending} onChange={(e) => setBody(e.target.value)}
      className="w-full rounded-md border border-line p-3 text-body" placeholder="Ví dụ: Khách muốn đổi giờ, đã hẹn gọi lại." />
    <button type="submit" disabled={pending || !body.trim()} className="min-h-11 rounded-full bg-accent px-5 font-semibold text-white disabled:opacity-50">{pending ? "Đang lưu…" : "Lưu ghi chú"}</button>
    {status && <p role="status" className="text-meta">{status}</p>}
  </form>
}
