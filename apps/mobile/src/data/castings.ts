import type { CategoryId } from "@/shared"
import { formatPrice, localDate, localTime } from "./format"
import { imageUrl } from "./links"
import { one, rpc, supabase, type Row } from "./supabase"

/**
 * Tuyển mẫu: a freelancer needs a model; customers apply. Same read as the
 * snapshot's `castings` query on the web (row level security decides which
 * calls and applications come back) and the same RPCs (apply_casting,
 * withdraw_application).
 */
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn"

export interface CastingItem {
  id: string
  proUuid: string
  category: CategoryId
  title: string
  description: string
  startsAt: string
  date: string
  time: string
  city: string
  district: string
  slots: number
  compensation: "free" | "discount" | "paid"
  discountPercent?: number
  fee?: number
  status: "open" | "closed"
  acceptedCount: number
  mine: boolean
  myApplication: { id: string; status: ApplicationStatus; message: string } | null
  pro: { slug: string; name: string; avatar?: string; verified: boolean; title: string }
}

const SELECT = `
  id, pro_id, category, title, description, starts_at, city, district, slots,
  compensation, discount_percent, fee, status, accepted_count, created_at,
  casting_applications (id, account_id, message, status),
  pros (slug, display_name, avatar_path, identity_status, title)
`

function toCasting(row: Row, uid: string | null): CastingItem {
  const own = uid ? ((row.casting_applications ?? []) as Row[]).find((a) => a.account_id === uid) : undefined
  const pro = one(row.pros)
  return {
    id: row.id,
    proUuid: row.pro_id,
    category: row.category,
    title: row.title ?? "",
    description: row.description ?? "",
    startsAt: row.starts_at,
    date: localDate(row.starts_at),
    time: localTime(row.starts_at),
    city: row.city ?? "",
    district: row.district ?? "",
    slots: row.slots ?? 1,
    compensation: ["free", "discount", "paid"].includes(row.compensation) ? row.compensation : "free",
    discountPercent: row.discount_percent ?? undefined,
    fee: row.fee ?? undefined,
    status: row.status === "closed" ? "closed" : "open",
    acceptedCount: row.accepted_count ?? 0,
    mine: Boolean(uid && row.pro_id === uid),
    myApplication: own ? { id: own.id, status: own.status, message: own.message ?? "" } : null,
    pro: {
      slug: pro.slug ?? "",
      name: pro.display_name || "Người làm",
      avatar: imageUrl(pro.avatar_path, "avatars"),
      verified: pro.identity_status === "verified",
      title: pro.title ?? "",
    },
  }
}

export async function listCastings(uid: string | null, city: string | null): Promise<CastingItem[]> {
  let query = supabase.from("castings").select(SELECT).eq("status", "open").gt("starts_at", new Date().toISOString()).order("starts_at").limit(100)
  if (city) query = query.eq("city", city)
  const { data, error } = await query
  if (error) throw new Error("Không tải được tin tuyển mẫu.")
  return ((data ?? []) as Row[]).map((r) => toCasting(r, uid))
}

export async function getCasting(uid: string | null, id: string): Promise<CastingItem | null> {
  const { data, error } = await supabase.from("castings").select(SELECT).eq("id", id).maybeSingle()
  if (error) throw new Error("Không tải được tin tuyển mẫu.")
  return data ? toCasting(data as Row, uid) : null
}

export const applyCasting = (id: string, message: string) => rpc<string>("apply_casting", { p_casting: id, p_message: message })
export const withdrawApplication = (id: string) => rpc("withdraw_application", { p_application: id })

/** Same words as compensationLabel() in components/casting.tsx. */
export function compensationLabel(c: Pick<CastingItem, "compensation" | "discountPercent" | "fee">) {
  if (c.compensation === "paid") return c.fee ? `Thù lao ${formatPrice(c.fee)}` : "Có thù lao"
  if (c.compensation === "discount") return c.discountPercent === 100 ? "Làm miễn phí" : `Giảm ${c.discountPercent ?? 0}%`
  return "Làm miễn phí"
}

export const APPLICATION_LABEL: Record<ApplicationStatus, string> = {
  pending: "Đã gửi, đang chờ chọn",
  accepted: "Bạn được chọn",
  rejected: "Lần này chưa được chọn",
  withdrawn: "Bạn đã rút",
}
