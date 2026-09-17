import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { WORKS, getPro, getWork } from "@/lib/data"
import { WorkDetail } from "./work-detail"

export function generateStaticParams() {
  return WORKS.map((w) => ({ id: w.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const work = getWork((await params).id)
  if (!work) return {}
  const pro = getPro(work.proId)
  return {
    title: `${work.title} · ${pro?.name}`,
    description: work.description,
    openGraph: { images: [work.images[0]] },
  }
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const work = getWork((await params).id)
  if (!work) notFound()
  return <WorkDetail workId={work.id} />
}
