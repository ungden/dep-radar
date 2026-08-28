import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin/admin-shell"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const metadata: Metadata = {
  title: "Admin | 360dep.vn",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/admin")
  const { data: isAdmin, error } = await supabase.rpc("is_admin")
  if (error || !isAdmin) redirect("/")
  return <AdminShell>{children}</AdminShell>
}
