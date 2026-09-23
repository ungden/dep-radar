import type { Metadata } from "next"
import { SearchPageView } from "./search-view"

export const metadata: Metadata = {
  title: "Tìm dịch vụ",
  description: "Tìm thợ làm đẹp, người chụp ảnh, người mẫu và tác phẩm thật gần bạn.",
  alternates: { canonical: "/search" },
  // Result pages for a query are endless near-duplicates; index the page, not the queries.
  robots: { index: true, follow: true },
}

export default function Page() {
  return <SearchPageView />
}
