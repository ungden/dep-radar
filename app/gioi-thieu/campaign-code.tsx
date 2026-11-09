"use client"

import * as React from "react"
import { claimCampaignVoucher } from "@/lib/api/voucher-campaign"
import { useRefresh } from "@/lib/store"
import { Button, Card, inputClass } from "@/components/ui"

export function CampaignCode() {
  const refresh = useRefresh()
  const [message, setMessage] = React.useState("")
  const [pending, start] = React.useTransition()
  return <Card className="p-4">
    <h2 className="font-bold">Có mã ưu đãi?</h2>
    <form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={(e) => {
      e.preventDefault()
      const code = String(new FormData(e.currentTarget).get("code") ?? "")
      start(async () => {
        try {
          const r = await claimCampaignVoucher(code)
          setMessage(r.ok ? "Voucher đã có trong tài khoản." : r.error)
          if (r.ok) refresh()
        } catch { setMessage("Mất kết nối. Vui lòng thử lại.") }
      })
    }}>
      <input className={inputClass + " min-w-36 flex-1"} name="code" aria-label="Mã ưu đãi" placeholder="Nhập mã ưu đãi" required minLength={5} maxLength={20} autoCapitalize="characters" />
      <Button type="submit" disabled={pending}>Nhận voucher</Button>
    </form>
    {message && <p role="status" className="mt-2 text-meta">{message}</p>}
  </Card>
}
