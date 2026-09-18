"use client"

import * as React from "react"
import { RotateCcw, TriangleAlert } from "lucide-react"
import { Button, ButtonLink } from "@/components/ui"

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error("route error:", error.message, error.digest ?? "")
  }, [error])

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-8" />
      </span>
      <h1 className="mt-4 text-xl font-semibold">Có lỗi xảy ra</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">
        Trang này gặp sự cố. Bạn thử tải lại xem sao. Nếu vẫn lỗi, quay về trang chủ rồi thao tác lại.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" /> Thử lại
        </Button>
        <ButtonLink href="/" variant="outline">
          Về trang chủ
        </ButtonLink>
      </div>
      {error.digest && <p className="mt-6 text-xs text-muted">Mã lỗi: {error.digest}</p>}
    </div>
  )
}
