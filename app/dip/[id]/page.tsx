import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getOccasion, occasionTemplates } from "@/lib/occasions"
import { OccasionView } from "./occasion-view"

type Params = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const occasion = getOccasion((await params).id)
  if (!occasion) return {}
  const services = occasionTemplates(occasion).map((t) => t.name.toLowerCase())
  const title = `${occasion.title}: ${occasion.subtitle.charAt(0).toLowerCase()}${occasion.subtitle.slice(1)}`
  return {
    title,
    description: `${occasion.subtitle}. Đặt ${services.join(", ")} với người làm gần bạn trên 360dep: xem tác phẩm thật, giá rõ trước khi đặt.`,
    alternates: { canonical: `/dip/${occasion.id}` },
    openGraph: { title, url: `/dip/${occasion.id}` },
  }
}

export default async function OccasionPage({ params }: { params: Params }) {
  const occasion = getOccasion((await params).id)
  if (!occasion) notFound()
  return <OccasionView occasionId={occasion.id} />
}
