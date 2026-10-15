"use client"

import * as React from "react"
import { RotateCcw, TriangleAlert } from "lucide-react"
import { Button, ButtonLink } from "@/components/ui"

/**
 * Staff see what broke, not only "có lỗi": the message (client errors) or the
 * digest to look up in the Vercel logs (server errors), and a way back to the
 * overview, which reads the least.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error("admin error:", error.message, error.digest ?? "")
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-8" />
      </span>
      <h1 className="mt-4 text-title font-bold">Trang vận hành gặp lỗi</h1>
      <p className="mt-1 text-body text-ink-soft">Thử lại. Nếu vẫn lỗi, mở Tổng quan rồi vào lại mục vừa dùng, và gửi mã lỗi bên dưới cho đội kỹ thuật.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" /> Thử lại
        </Button>
        <ButtonLink href="/admin?tab=overview" variant="outline">
          Về Tổng quan
        </ButtonLink>
      </div>
      <p className="mt-6 break-all rounded-xl bg-subtle px-3 py-2 text-left font-mono text-label text-ink-soft">
        {error.digest ? `Mã lỗi: ${error.digest}` : error.message || "Không rõ lỗi"}
      </p>
    </div>
  )
}
