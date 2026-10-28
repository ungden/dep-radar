import type { Metadata } from "next"
import { getMcnWorkspace } from "@/lib/api/mcn"
import { KtvNetwork } from "./network"

export const metadata: Metadata = { title: "Network của tôi", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function NetworkPage() {
  return <KtvNetwork workspace={await getMcnWorkspace()} />
}
