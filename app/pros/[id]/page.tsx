import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { PROS, getPro } from "@/lib/data"
import { ProProfile } from "./pro-profile"

export function generateStaticParams() {
  return PROS.map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const pro = getPro((await params).id)
  if (!pro) return {}
  return {
    title: `${pro.name} · ${pro.title} tại ${pro.city}`,
    description: pro.bio,
  }
}

export default async function ProPage({ params }: { params: Promise<{ id: string }> }) {
  const pro = getPro((await params).id)
  if (!pro) notFound()
  return (
    <Suspense>
      <ProProfile proId={pro.id} />
    </Suspense>
  )
}
