import type { Metadata } from "next"
import { OrderFlowPage } from "./order-flow"

export const metadata: Metadata = {
  title: "Đặt theo dịch vụ",
}

/** For someone signed in (the middleware sends a visitor to sign in first); visitors start at /dat-lich. */
export default function Page() {
  return <OrderFlowPage />
}
