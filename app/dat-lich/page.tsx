import type { Metadata } from "next"
import { OrderFlowPage } from "../requests/new/order-flow"

export const metadata: Metadata = {
  title: "Đặt theo nhu cầu",
  description: "Chọn dịch vụ, giờ và địa chỉ với giá niêm yết. Artist gần bạn được báo, ai nhận trước sẽ làm.",
  alternates: { canonical: "/dat-lich" },
}

/**
 * The order flow's public address. /requests is signed-in only (middleware.ts),
 * but a visitor walks through every step and is asked to sign in only at
 * the last one, like /book. Sending is still a signed-in RPC.
 */
export default function Page() {
  return <OrderFlowPage />
}
