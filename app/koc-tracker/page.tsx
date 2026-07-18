import type { Metadata } from "next"

import { CreatorDirectory } from "@/components/creator-directory"
import { getKols } from "@/lib/data"

export const metadata: Metadata = {
  title: "Danh bạ creator beauty | 360dep.vn",
  description: "Tra cứu creator theo kênh, chuyên môn và độ đầy đủ hồ sơ public.",
}

export default async function KocTrackerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawFilters = await searchParams
  const initialFilters = Object.fromEntries(
    Object.entries(rawFilters).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : [])
  )
  const kols = await getKols()
  return <CreatorDirectory initialKols={kols} initialFilters={initialFilters} />
}
