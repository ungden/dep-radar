import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { PageSkeleton } from "@/components/ui"
import { getProBySlug } from "@/lib/api/pros"
import { ProProfile } from "./pro-profile"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const pro = await getProBySlug((await params).id)
  if (!pro) return {}
  return {
    title: `${pro.name} · ${pro.title} tại ${pro.city}`,
    description: pro.bio,
  }
}

export default async function ProPage({ params }: { params: Promise<{ id: string }> }) {
  const pro = await getProBySlug((await params).id)
  if (!pro) notFound()
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProProfile proId={pro.slug} />
    </Suspense>
  )
}
