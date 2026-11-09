import Link from "next/link"
import { notFound } from "next/navigation"
import { adminCampaign } from "@/lib/api/voucher-campaign"
import { CampaignDesk } from "./campaign-desk"

export const dynamic = "force-dynamic"
export const metadata = { title: "Mã ưu đãi", robots: { index: false, follow: false } }

export default async function CampaignPage() {
  const result = await adminCampaign("read")
  if (!result.ok) notFound()
  return <main className="mx-auto max-w-4xl space-y-5 p-6">
    <header>
      <Link href="/admin" className="inline-flex min-h-11 items-center text-meta font-semibold text-accent-dark">← Vận hành</Link>
      <h1 className="text-[30px] font-bold">Mã ưu đãi</h1>
      <p className="text-ink-soft">Tạo mã với mức giảm, giá trị đơn tối thiểu, hạn dùng và số lượt. Khách tự nhập mã để nhận voucher.</p>
    </header>
    <CampaignDesk rows={result.data} />
  </main>
}
