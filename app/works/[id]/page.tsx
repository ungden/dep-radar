import type { Metadata } from "next"
import { openGraph } from "@/lib/seo"
import { notFound } from "next/navigation"
import { getWorkBySlug } from "@/lib/api/pros"
import { WorkDetail } from "./work-detail"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const work = await getWorkBySlug((await params).id)
  if (!work) return {}
  return {
    title: `${work.title} · ${work.proName}`,
    description: work.description,
    alternates: { canonical: `/works/${work.slug}` },
    openGraph: openGraph({ url: `/works/${work.slug}` }),
  }
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const work = await getWorkBySlug((await params).id)
  if (!work) notFound()
  return <WorkDetail workId={work.slug} />
}
