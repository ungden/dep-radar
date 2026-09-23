import { getVariant } from "@/shared"
import { localDate, localTime } from "./format"
import { rpc, selectWithFallback, supabase, type Row } from "./supabase"

/**
 * A customer's request, as a freelancer sees it on the board. The price is
 * fixed when it is posted; the first freelancer to take it gets it
 * (take_job, 20260926100000_match_then_chat.sql).
 */
export interface JobItem {
  id: string
  templateId: string
  variantId: string
  quantity: number
  description: string
  startsAt: string
  date: string
  time: string
  city: string
  district: string
  atHome: boolean
  customerName: string
  /** Per person, as posted. */
  price: number
  mine: boolean
  createdAt: string
}

const COLUMNS = `id, customer_id, template_id, variant_id, quantity, description, starts_at,
  at_home, city, district, customer_name, status, created_at`

/**
 * Open requests; row level security shows a freelancer only open ones (and
 * their own as a customer). Taken ones drop out by themselves.
 */
export async function listJobs(uid: string): Promise<JobItem[]> {
  const rows = await selectWithFallback(
    "jobs",
    (c) => supabase.from("jobs").select(c).eq("status", "open").order("starts_at", { ascending: true }).limit(200),
    [`${COLUMNS}, price`, COLUMNS],
  )
  return rows
    .filter((row) => Date.parse(row.starts_at) > Date.now())
    .map((row: Row) => ({
      id: row.id,
      templateId: row.template_id,
      variantId: row.variant_id,
      quantity: row.quantity ?? 1,
      description: row.description ?? "",
      startsAt: row.starts_at,
      date: localDate(row.starts_at),
      time: localTime(row.starts_at),
      city: row.city,
      district: row.district,
      atHome: Boolean(row.at_home),
      customerName: row.customer_name || "Khách hàng",
      // Before the price column: the catalogue's suggested price, which is what post_job fills in.
      price: Number(row.price ?? getVariant(row.template_id, row.variant_id)?.suggestedPrice ?? 0),
      mine: row.customer_id === uid,
      createdAt: row.created_at,
    }))
}

/** "Nhận việc": the first to call it gets a confirmed booking at the request's price. Returns its id. */
export const takeJob = (jobId: string) => rpc<string>("take_job", { p_job: jobId })

/** take_job's refusals that mean the request is gone from the board for everyone. */
export const jobGone = (error: string) => /Đã có người nhận|quá giờ|Không tìm thấy yêu cầu/i.test(error)
