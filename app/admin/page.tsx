import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { adminBookings, adminPros, adminReports, aiDecisions, isAdmin, pendingChecks } from "@/lib/api/admin"
import { AdminDesk } from "./admin-desk"

export const metadata: Metadata = {
  title: "Vận hành",
  robots: { index: false, follow: false },
}

// Whose desk this is depends on the request, so it is never prerendered.
export const dynamic = "force-dynamic"

export default async function AdminPage() {
  // The middleware already turned away non-admins; this is the second lock, and
  // 404 rather than 403 so the page does not advertise that it exists.
  if (!(await isAdmin())) notFound()

  const [checks, pros, bookings, reports, aiLog] = await Promise.all([
    pendingChecks(),
    adminPros(),
    adminBookings(),
    adminReports(),
    aiDecisions(),
  ])

  return <AdminDesk checks={checks} pros={pros} bookings={bookings} reports={reports} aiLog={aiLog} />
}
