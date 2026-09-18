import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { adminBookings, adminPros, adminReports, isAdmin, pendingChecks } from "@/lib/api/admin"
import { AdminDesk } from "./admin-desk"

export const metadata: Metadata = {
  title: "Vận hành",
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  // The middleware already turned away non-admins; this is the second lock, and
  // 404 rather than 403 so the page does not advertise that it exists.
  if (!(await isAdmin())) notFound()

  const [checks, pros, bookings, reports] = await Promise.all([
    pendingChecks(),
    adminPros(),
    adminBookings(),
    adminReports(),
  ])

  return <AdminDesk checks={checks} pros={pros} bookings={bookings} reports={reports} />
}
