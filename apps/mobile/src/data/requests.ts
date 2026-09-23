import { getVariant, type ServiceVariant } from "@/shared"
import { localDate, localTime, toTimestamptz } from "./format"
import { messageFor, rpc, selectWithFallback, supabase, type Result, type Row } from "./supabase"

/**
 * The customer's side of requests (20260926100000_match_then_chat.sql): post
 * one at a fixed price (post_job), every freelancer who can do it is told, and
 * the first to take it gets a confirmed booking. No quotes to compare. Same
 * RPC and arguments as the web.
 */
export interface MyRequest {
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
  status: "open" | "booked" | "closed" | "expired"
  createdAt: string
  /** Per person, fixed when posted. */
  price: number
  /** How many freelancers were told when it was posted; null on a server without the column. */
  notified: number | null
  /** The booking it became once someone took it. */
  bookingId: string | null
}

/** "Trả thêm để có người nhận nhanh hơn": steps per person above the suggested price. */
export const PRICE_STEP = 20_000

/** Suggested price plus `steps` extra steps, never above the catalogue's ceiling. */
export const requestPrice = (variant: ServiceVariant, steps: number) => Math.min(variant.suggestedPrice + Math.max(0, steps) * PRICE_STEP, variant.maxPrice)

export async function postJob(input: {
  templateId: string
  variantId: string
  date: string
  time: string
  atHome: boolean
  addressId: string | null
  quantity?: number
  description: string
  /** Per person; post_job takes the suggested price when it is left out. */
  price?: number
}) {
  return rpc<string>("post_job", {
    p_template: input.templateId,
    p_variant: input.variantId,
    p_starts_at: toTimestamptz(input.date, input.time),
    p_at_home: input.atHome,
    p_address_id: input.addressId,
    p_quantity: input.quantity ?? 1,
    p_description: input.description,
    p_payment: "cash",
    p_price: input.price,
  })
}

const BASE = "id, template_id, variant_id, quantity, description, starts_at, at_home, city, district, status, created_at"
const COLUMN_SETS = [`${BASE}, price, notified, booking_id`, BASE]

function toRequest(row: Row): MyRequest {
  return {
    id: row.id,
    templateId: row.template_id,
    variantId: row.variant_id,
    quantity: row.quantity ?? 1,
    description: row.description ?? "",
    startsAt: row.starts_at,
    date: localDate(row.starts_at),
    time: localTime(row.starts_at),
    city: row.city ?? "",
    district: row.district ?? "",
    atHome: Boolean(row.at_home),
    status: row.status,
    createdAt: row.created_at,
    price: Number(row.price ?? getVariant(row.template_id, row.variant_id)?.suggestedPrice ?? 0),
    notified: row.notified == null ? null : Number(row.notified),
    bookingId: row.booking_id ?? null,
  }
}

export async function listMyRequests(uid: string): Promise<MyRequest[]> {
  const rows = await selectWithFallback(
    "requests",
    (c) => supabase.from("jobs").select(c).eq("customer_id", uid).order("created_at", { ascending: false }).limit(100),
    COLUMN_SETS,
  )
  return rows.map(toRequest)
}

export async function getMyRequest(uid: string, id: string): Promise<MyRequest | null> {
  const rows = await selectWithFallback("request", (c) => supabase.from("jobs").select(c).eq("customer_id", uid).eq("id", id).limit(1), COLUMN_SETS)
  return rows[0] ? toRequest(rows[0]) : null
}

/** Only an open request can be deleted; customers no longer edit one (the price is part of the deal). */
export async function closeJob(jobId: string): Promise<Result> {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId)
  if (error) return { ok: false, error: messageFor(error, "Không xoá được yêu cầu.") }
  return { ok: true, data: undefined }
}

/** How far along a request is, in the customer's words. */
export function requestProgress(r: MyRequest): string {
  if (r.status === "booked") return "Đã có người nhận việc"
  if (r.status !== "open") return r.status === "expired" ? "Hết hạn, chưa ai nhận" : "Đã đóng"
  if (r.notified === null) return "Đang tìm người làm"
  return r.notified > 0 ? `Đang tìm người làm · đã báo cho ${r.notified} người` : "Đang tìm người làm · chưa báo được cho ai"
}
