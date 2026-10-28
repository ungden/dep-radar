import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isAdmin } from "@/lib/api/admin"
import { getMcnWorkspace } from "@/lib/api/mcn"
import { McnAdminDesk } from "./desk"

export const metadata: Metadata = { title: "Vận hành MCN", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function McnAdminPage() {
  if (!(await isAdmin())) notFound()
  return <McnAdminDesk workspace={await getMcnWorkspace()} />
}
