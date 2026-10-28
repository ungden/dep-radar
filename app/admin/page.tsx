import { McnOverview } from "./mcn/overview"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { adminBookings, adminOverview, adminPros, adminReports, adminSettings, aiDecisions, isAdmin, pendingChecks, profileQueue } from "@/lib/api/admin"
import { AdminDesk } from "./admin-desk"
import { isTab } from "./tabs"

export const metadata: Metadata = {
  title: "Vận hành",
  robots: { index: false, follow: false },
}

// Whose desk this is depends on the request, so it is never prerendered.
export const dynamic = "force-dynamic"

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; filter?: string }> }) {
  // The middleware already turned away non-admins; this is the second lock, and
  // 404 rather than 403 so the page does not advertise that it exists.
  // Checked alongside the reads rather than before them: every read is under row
  // level security or checks is_admin() itself, so nothing leaks while it runs.
  const [allowed, { tab, filter }, queue, checks, pros, bookings, reports, aiLog, admin, overview] = await Promise.all([
    isAdmin(),
    searchParams,
    profileQueue(),
    pendingChecks(),
    adminPros(),
    adminBookings(),
    adminReports(),
    aiDecisions(),
    adminSettings(),
    adminOverview(),
  ])
  if (!allowed) notFound()

  return (
    <AdminDesk
      mcnOverview={<McnOverview />}
      queue={queue}
      checks={checks}
      pros={pros}
      bookings={bookings}
      reports={reports}
      aiLog={aiLog}
      admin={admin}
      overview={overview}
      initialTab={isTab(tab) ? tab : "overview"}
      initialFilter={typeof filter === "string" ? filter : undefined}
    />
  )
}
