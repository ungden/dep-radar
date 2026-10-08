import type { Metadata } from "next"
import { RequireSession } from "@/components/require-session"
import { PageHeader } from "@/components/ui"
import { myReports } from "@/lib/api/me"
import { ReportsView } from "./reports-view"

export const metadata: Metadata = {
  title: "Báo cáo vấn đề",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/**
 * Somebody who ran into a problem, during a job or after it, or with the app
 * itself, tells 360dep with photos and clips, then follows it here: whether the
 * staff picked it up, what they asked, how it ended.
 */
export default async function ReportsPage() {
  const reports = await myReports()
  return (
    <div className="mx-auto max-w-xl md:pt-4">
      <PageHeader title="Báo cáo vấn đề" back="/me" />
      <RequireSession>
        <ReportsView reports={reports.ok ? reports.data : []} error={reports.ok ? null : reports.error} />
      </RequireSession>
    </div>
  )
}
