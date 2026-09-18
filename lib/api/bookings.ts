import { supabaseServer } from "@/lib/supabase/server"
import { toBookingItem } from "./map"
import type { BookingItem } from "./types"

/**
 * A customer sees the freelancer's phone number only once someone has committed:
 * the freelancer accepted, or the job is under way or done. Before that, calling
 * is the freelancer's move.
 */
const CONTACT_VISIBLE: BookingItem["status"][] = ["confirmed", "in_progress", "completed", "no_show"]

const BOOKING_SELECT = `
  id, customer_id, pro_id, template_id, variant_id, quantity, source, status,
  starts_at, ends_at, duration_min, at_home, city, district, address, address_note, note,
  service_price, distance_km, travel_fee, urgent_fee, total, commission_rate, commission, payout,
  payment_method, confirm_by, cancel_reason, cancelled_by, reschedule_to, reschedule_by, created_at,
  customer:accounts!bookings_customer_id_fkey (full_name, phone),
  pro:pros!bookings_pro_id_fkey!inner (slug, display_name, avatar_path, accounts!pros_id_fkey (phone)),
  reviews (booking_id)
`

function hideContacts(booking: BookingItem, viewer: "customer" | "pro"): BookingItem {
  if (CONTACT_VISIBLE.includes(booking.status)) return booking
  return viewer === "customer"
    ? { ...booking, pro: { ...booking.pro, phone: null } }
    : booking
}

export async function listMyBookings(): Promise<BookingItem[]> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("customer_id", auth.user.id)
    .order("starts_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => hideContacts(toBookingItem(row as never), "customer"))
}

export async function listProBookings(): Promise<BookingItem[]> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("pro_id", auth.user.id)
    .order("starts_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => toBookingItem(row as never))
}

export async function getBooking(id: string): Promise<BookingItem | null> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase.from("bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const booking = toBookingItem(data as never)
  return hideContacts(booking, booking.pro.id === auth.user?.id ? "pro" : "customer")
}
