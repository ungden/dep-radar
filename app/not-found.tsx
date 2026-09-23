import type { Metadata } from "next"
import { ButtonLink } from "@/components/ui"

export const metadata: Metadata = { title: "Không tìm thấy trang" }

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-5xl font-bold text-ink">
        4<span className="text-accent">0</span>4
      </p>
      <h1 className="mt-4 text-xl font-semibold">Không tìm thấy trang</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">Trang bạn tìm có thể đã bị xoá hoặc đổi địa chỉ.</p>
      <div className="mt-6 flex gap-2">
        <ButtonLink href="/">Về trang khám phá</ButtonLink>
        <ButtonLink href="/pros" variant="outline">
          Xem người làm
        </ButtonLink>
      </div>
    </div>
  )
}
