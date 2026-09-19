import type { Metadata } from "next"
import { WifiOff } from "lucide-react"
import { ButtonLink } from "@/components/ui"

export const metadata: Metadata = {
  title: "Không có kết nối",
  robots: { index: false, follow: false },
}

/**
 * Shown when a page is requested with no network. It deliberately does not show
 * stale prices, slots or booking statuses from a cache: being told there is no
 * connection is more useful than being shown a slot that was free an hour ago.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-blush text-rose">
        <WifiOff className="size-8" />
      </span>
      <h1 className="mt-4 text-xl font-semibold">Không có kết nối</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">
        360dep cần mạng để hiện giá, khung giờ trống và trạng thái lịch hẹn đúng lúc, nên chúng tôi không hiện bản lưu
        tạm — một khung giờ trống từ một tiếng trước có thể đã có người đặt.
      </p>
      <ButtonLink href="/" className="mt-6">
        Thử lại
      </ButtonLink>
    </div>
  )
}
