import type { Metadata } from "next"
import { CastingsView } from "./castings-view"

export const metadata: Metadata = {
  title: "Tuyển mẫu",
  description: "Làm mẫu cho thợ làm đẹp, người chụp ảnh: được làm đẹp miễn phí, giảm giá hoặc có thù lao. Người tuyển không bao giờ được thu tiền của mẫu.",
  alternates: { canonical: "/tuyen-mau" },
}

export default function Page() {
  return <CastingsView />
}
