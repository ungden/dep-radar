import type { Metadata } from "next"

import { ProductsExplorer } from "@/components/products-explorer"
import { getCreatorProductEvents, getProductOffers, getProducts } from "@/lib/data"

export const metadata: Metadata = {
  title: "Khám phá sản phẩm theo nhu cầu | 360dep.vn",
  description: "Bắt đầu từ vấn đề, lọc sản phẩm và chỉ mở offer đã được xác minh.",
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawFilters = await searchParams
  const initialFilters = Object.fromEntries(
    Object.entries(rawFilters).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : [])
  )
  const [products, events, offers] = await Promise.all([
    getProducts(),
    getCreatorProductEvents(),
    getProductOffers(),
  ])

  return <ProductsExplorer initialProducts={products} initialEvents={events} initialOffers={offers} initialFilters={initialFilters} />
}
