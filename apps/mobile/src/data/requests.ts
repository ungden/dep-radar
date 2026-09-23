import { localDate, localTime, toTimestamptz } from "./format"
import { imageUrl } from "./links"
import { messageFor, one, rpc, supabase, type Result, type Row } from "./supabase"

/**
 * The customer's side of the request board: post a request (post_job), read
 * the quotes that come back, pick one (accept_offer). Same RPCs and arguments
 * as postJob() / acceptOffer() / closeJob() in lib/api/actions.ts.
 */
export interface RequestOffer {
  id: string
  price: number
  message: string
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "expired"
  createdAt: string
  pro: {
    uuid: string
    slug: string
    name: string
    avatar?: string
    verified: boolean
    rating: { average: number; count: number }
    completedJobs: number
  }
}

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
  offers: RequestOffer[]
}

export async function postJob(input: {
  templateId: string
  variantId: string
  date: string
  time: string
  atHome: boolean
  addressId: string | null
  quantity?: number
  description: string
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
  })
}

const SELECT = `
  id, template_id, variant_id, quantity, description, starts_at, at_home, city, district, status, created_at,
  offers (id, pro_id, price, message, status, created_at,
    pros (id, slug, display_name, avatar_path, identity_status, rating_avg, rating_count, completed_jobs))
`

function toRequest(row: Row): MyRequest {
  const offers = ((row.offers ?? []) as Row[])
    .filter((o) => o.status !== "withdrawn")
    .map((o) => {
      const pro = one(o.pros)
      return {
        id: o.id,
        price: Number(o.price ?? 0),
        message: o.message ?? "",
        status: o.status,
        createdAt: o.created_at,
        pro: {
          uuid: o.pro_id,
          slug: pro.slug ?? "",
          name: pro.display_name || "Người làm",
          avatar: imageUrl(pro.avatar_path, "avatars"),
          verified: pro.identity_status === "verified",
          rating: { average: Number(pro.rating_avg ?? 0), count: pro.rating_count ?? 0 },
          completedJobs: pro.completed_jobs ?? 0,
        },
      } satisfies RequestOffer
    })
    .sort((a, b) => a.price - b.price)
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
    offers,
  }
}

export async function listMyRequests(uid: string): Promise<MyRequest[]> {
  const { data, error } = await supabase.from("jobs").select(SELECT).eq("customer_id", uid).order("created_at", { ascending: false }).limit(100)
  if (error) throw new Error("Không tải được yêu cầu của bạn.")
  return ((data ?? []) as Row[]).map(toRequest)
}

export async function getMyRequest(uid: string, id: string): Promise<MyRequest | null> {
  const { data, error } = await supabase.from("jobs").select(SELECT).eq("customer_id", uid).eq("id", id).maybeSingle()
  if (error) throw new Error("Không tải được yêu cầu.")
  return data ? toRequest(data as Row) : null
}

/** Returns the new booking's id. */
export const acceptOffer = (offerId: string) => rpc<string>("accept_offer", { p_offer: offerId })

export async function closeJob(jobId: string): Promise<Result> {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId)
  if (error) return { ok: false, error: messageFor(error, "Không xoá được yêu cầu.") }
  return { ok: true, data: undefined }
}

/** The booking a request turned into, for "Xem lịch hẹn". Matched the way the web does: same freelancer, same start. */
export async function bookingForRequest(uid: string, request: MyRequest): Promise<string | null> {
  const accepted = request.offers.find((o) => o.status === "accepted")
  if (!accepted) return null
  const { data } = await supabase
    .from("bookings")
    .select("id")
    .eq("customer_id", uid)
    .eq("pro_id", accepted.pro.uuid)
    .eq("starts_at", request.startsAt)
    .limit(1)
    .maybeSingle()
  return (data as { id?: string } | null)?.id ?? null
}
