import { localDate, localTime } from "./format"
import { supabase, type Row } from "./supabase"

/** A customer's request for quotes, as a freelancer sees it on the board. */
export interface JobItem {
  id: string
  templateId: string
  variantId: string
  quantity: number
  description: string
  date: string
  time: string
  city: string
  district: string
  atHome: boolean
  customerName: string
  status: "open" | "booked" | "closed"
  mine: boolean
  /** The caller's own offer on it, if any. */
  myOffer: { id: string; price: number; status: string } | null
  offerCount: number
  createdAt: string
}

/** Same read as the web's snapshot; row level security decides which jobs a freelancer sees. */
export async function listJobs(uid: string): Promise<JobItem[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(`
      id, customer_id, template_id, variant_id, quantity, description, starts_at,
      at_home, city, district, customer_name, payment_method, status, created_at,
      offers (id, pro_id, price, status)
    `)
    .order("created_at", { ascending: false })
  if (error) throw new Error("Không tải được yêu cầu mới.")
  return ((data ?? []) as Row[]).map((row) => {
    const offers = ((row.offers ?? []) as Row[]).filter((o) => o.status !== "withdrawn")
    const mine = offers.find((o) => o.pro_id === uid)
    return {
      id: row.id,
      templateId: row.template_id,
      variantId: row.variant_id,
      quantity: row.quantity ?? 1,
      description: row.description ?? "",
      date: localDate(row.starts_at),
      time: localTime(row.starts_at),
      city: row.city,
      district: row.district,
      atHome: Boolean(row.at_home),
      customerName: row.customer_name || "Khách hàng",
      status: row.status === "expired" ? "closed" : row.status,
      mine: row.customer_id === uid,
      myOffer: mine ? { id: mine.id, price: mine.price, status: mine.status } : null,
      offerCount: offers.length,
      createdAt: row.created_at,
    }
  })
}
