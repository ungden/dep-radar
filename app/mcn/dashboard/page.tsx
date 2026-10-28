import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { authUser } from "@/lib/supabase/server"
import { backendEnabled } from "@/lib/supabase/env"
import { getMcnWorkspace } from "@/lib/api/mcn"
import { McnDashboard } from "./workspace"

export const metadata: Metadata = { title: "Quản lý network MCN", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function McnDashboardPage() {
  if (backendEnabled && !(await authUser())) redirect("/login?next=%2Fmcn%2Fdashboard")
  return <McnDashboard workspace={await getMcnWorkspace()} />
}
