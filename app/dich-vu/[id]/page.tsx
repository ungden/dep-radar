import type { Metadata } from "next"
import { openGraph } from "@/lib/seo"
import { notFound } from "next/navigation"
import { categoryLabel, getTemplate } from "@/lib/catalog"
import { priceBand } from "@/lib/trade"
import { formatPrice } from "@/lib/utils"
import { ServiceView } from "./service-view"

type Params = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const template = getTemplate((await params).id)
  if (!template) return {}
  const band = priceBand(template)
  const title = `${template.name}: xem giá & đặt lịch`
  return {
    title,
    description: `${template.description} ${band ? `Giá ${formatPrice(band[0])} – ${formatPrice(band[1])}. ` : ""}Chọn ${categoryLabel(template.category).toLowerCase()} gần bạn trên 360dep, xem tác phẩm thật, đặt lịch không mất phí.`,
    alternates: { canonical: `/dich-vu/${template.id}` },
    openGraph: openGraph({ title, url: `/dich-vu/${template.id}` }),
  }
}

export default async function ServicePage({ params }: { params: Params }) {
  const template = getTemplate((await params).id)
  if (!template) notFound()
  return <ServiceView templateId={template.id} />
}
