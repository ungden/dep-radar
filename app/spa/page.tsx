import type { Metadata } from "next"
import { SpaPageView } from "./spa-view"

export const metadata: Metadata = {
  title: "Spa gần bạn",
  description: "Gội đầu dưỡng sinh, chăm sóc da, massage tại spa gần bạn: giờ mở cửa, giá rõ, chỗ trống hôm nay.",
  alternates: { canonical: "/spa" },
}

export default function Page() {
  return <SpaPageView />
}
