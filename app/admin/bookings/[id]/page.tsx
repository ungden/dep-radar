import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { adminBookingDetail, isAdmin } from "@/lib/api/admin"
import { BookingDesk } from "./booking-desk"

export const metadata: Metadata = {
  title: "Lịch hẹn",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function AdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) notFound()
  const { id } = await params
  const booking = await adminBookingDetail(id)
  if (!booking) notFound()
  return <BookingDesk booking={booking} />
}
