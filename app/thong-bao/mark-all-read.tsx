"use client"

import * as React from "react"
import { useRefresh } from "@/lib/store"

/** Marks everything read on the server, then re-reads the page. */
export function MarkAllRead({ count, action }: { count: number; action: () => Promise<{ ok: boolean }> }) {
  const refresh = useRefresh()
  const [busy, setBusy] = React.useState(false)

  return (
    <div className="mb-3 flex items-center justify-between rounded-xl bg-subtle px-3.5 py-2.5 text-[13px] text-accent-dark">
      <span>{count} thông báo mới</span>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          await action()
          setBusy(false)
          refresh()
        }}
        className="font-medium underline underline-offset-2"
      >
        {busy ? "Đang lưu…" : "Đánh dấu đã đọc"}
      </button>
    </div>
  )
}
