"use client"

import { useTransition } from "react"
import { CloudOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui"
import { useRefresh } from "@/lib/store"

export function DataUnavailable() {
  const refresh = useRefresh()
  const [pending, startTransition] = useTransition()
  return (
    <div role="alert" className="my-6 rounded-2xl bg-surface px-6 py-8 text-center sm:p-10">
      <CloudOff aria-hidden className="mx-auto mb-4 size-8 text-muted" />
      <h2 className="text-[22px] font-bold">Chưa tải được dữ liệu</h2>
      <p className="mx-auto mt-2 max-w-md text-body text-ink-soft">Kết nối đang gián đoạn. Thử lại để xem dịch vụ, giá và người làm hiện có.</p>
      <Button disabled={pending} onClick={() => startTransition(refresh)} className="mt-5">
        <RefreshCw aria-hidden className={pending ? "size-4 animate-spin" : "size-4"} />
        {pending ? "Đang tải lại…" : "Thử lại"}
      </Button>
    </div>
  )
}
