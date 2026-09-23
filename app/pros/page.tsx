import type { Metadata } from "next"
import { ProsPageView } from "./pros-view"

export const metadata: Metadata = {
  title: "Người làm gần bạn",
  description: "Thợ làm đẹp, người chụp ảnh, người mẫu gần bạn: xem giá, đánh giá thật và tác phẩm trước khi đặt.",
  alternates: { canonical: "/pros" },
}

export default function Page() {
  return <ProsPageView />
}
