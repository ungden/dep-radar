import { getVariant, type BookingStatus, type ServiceContract, type ServiceVariant } from "@/shared"
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
  contract?: ServiceContract
  maxTotal?: number | null
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
  /** Where that booking stands now: a taken order can still be cancelled. */
  bookingStatus: BookingStatus | null
  /** The reference photos sent with it, paths in the references bucket. */
  referencePhotos: string[]
}

/** The price a request is posted at: the chosen level, or the middle level until one is chosen. */
export const requestPrice = (variant: ServiceVariant, tier: number | null) =>
  tier !== null && variant.tiers.includes(tier) ? tier : variant.suggestedPrice

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
  maxTotal: number
}) {
  return rpc<string>("post_job_checked", {
    p_template: input.templateId,
    p_variant: input.variantId,
    p_starts_at: toTimestamptz(input.date, input.time),
    p_at_home: input.atHome,
    p_address_id: input.addressId,
    p_quantity: input.quantity ?? 1,
    p_description: input.description,
    p_payment: "cash",
    p_price: input.price,
    p_max_total: input.maxTotal,
  })
}

const BASE = "id, template_id, variant_id, quantity, description, starts_at, at_home, city, district, status, created_at"
const COLUMN_SETS = [`${BASE}, price, notified, booking_id, service_contract, max_total, reference_photos`, `${BASE}, price, notified, booking_id, service_contract, max_total`, `${BASE}, price, notified, booking_id`, BASE]

function toRequest(row: Row): MyRequest {
  return {
    id: row.id,
    contract: row.service_contract ?? undefined, maxTotal: row.max_total ?? null,
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
    bookingStatus: null,
    referencePhotos: Array.isArray(row.reference_photos) ? (row.reference_photos as string[]) : [],
  }
}

export async function listMyRequests(uid: string): Promise<MyRequest[]> {
  const rows = await selectWithFallback(
    "requests",
    (c) => supabase.from("jobs").select(c).eq("customer_id", uid).order("created_at", { ascending: false }).limit(100),
    COLUMN_SETS,
  )
  return withBookingStatus(rows.map(toRequest))
}

export async function getMyRequest(uid: string, id: string): Promise<MyRequest | null> {
  const rows = await selectWithFallback("request", (c) => supabase.from("jobs").select(c).eq("customer_id", uid).eq("id", id).limit(1), COLUMN_SETS)
  return rows[0] ? (await withBookingStatus([toRequest(rows[0])]))[0] : null
}

async function withBookingStatus(requests: MyRequest[]): Promise<MyRequest[]> {
  const ids = requests.flatMap((r) => (r.bookingId ? [r.bookingId] : []))
  if (!ids.length) return requests
  const { data, error } = await supabase.from("bookings").select("id, status").in("id", ids)
  if (error) throw new Error(messageFor(error, "Không tải được lịch hẹn của đơn."))
  const status = new Map((data ?? []).map((b) => [b.id as string, b.status as BookingStatus]))
  return requests.map((r) => ({ ...r, bookingStatus: r.bookingId ? (status.get(r.bookingId) ?? null) : null }))
}

/** A taken order whose booking did not go ahead: the customer can order again. */
export const bookingFellThrough = (r: MyRequest) =>
  r.bookingStatus === "cancelled" || r.bookingStatus === "declined" || r.bookingStatus === "expired" || r.bookingStatus === "no_show"

/**
 * Only an open request can be deleted; customers no longer edit one (the price
 * is part of the deal). One an Artist has just taken deletes nothing and raises
 * no error, so count what went.
 */
export async function closeJob(jobId: string): Promise<Result> {
  const { data, error } = await supabase.from("jobs").delete().eq("id", jobId).select("id")
  if (error) return { ok: false, error: messageFor(error, "Không huỷ được đơn.") }
  if (!data?.length) return { ok: false, error: "Đơn này vừa có Artist nhận hoặc đã đóng. Tải lại để xem lịch hẹn." }
  return { ok: true, data: undefined }
}

/** How far along a request is, in the customer's words. */
export function requestProgress(r: MyRequest): string {
  if (r.status === "booked") {
    if (r.bookingStatus === "completed") return "Đã hoàn thành"
    return bookingFellThrough(r) ? "Lịch hẹn đã huỷ" : "Đã có Artist nhận đơn"
  }
  if (r.status !== "open") return r.status === "expired" ? "Hết hạn, chưa ai nhận" : "Đã đóng"
  if (r.notified === null) return "Đang chờ Artist nhận"
  return r.notified > 0 ? `Đã báo cho ${r.notified} Artist` : "Chưa báo được Artist nào"
}
