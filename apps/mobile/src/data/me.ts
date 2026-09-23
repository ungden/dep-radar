import { getTemplate, type CategoryId } from "@/shared"
import { supabase, type Row } from "./supabase"

export interface Account {
  id: string
  fullName: string
  /** Empty until set once through set_my_phone(). */
  phone: string
  activeRole: "customer" | "pro"
  email: string
}

export interface Address {
  id: string
  label: string
  city: string
  district: string
  detail: string
  note: string
  isDefault: boolean
}

export interface MeData {
  account: Account | null
  addresses: Address[]
  /** Work database ids. */
  savedWorkIds: string[]
  /** Freelancer database ids. */
  followedProIds: string[]
  unreadNotifications: number
  unreadMessages: number
  /** Categories of services this person has booked, for "Dành cho bạn". */
  bookedCategories: CategoryId[]
}

export const emptyMe: MeData = {
  account: null,
  addresses: [],
  savedWorkIds: [],
  followedProIds: [],
  unreadNotifications: 0,
  unreadMessages: 0,
  bookedCategories: [],
}

export async function loadMe(uid: string, email: string): Promise<MeData> {
  const [account, addresses, saved, follows, notes, messages, booked] = await Promise.all([
    supabase.from("accounts").select("id, full_name, phone, active_role").eq("id", uid).maybeSingle(),
    supabase.from("addresses").select("id, label, city, district, detail, note, is_default").eq("account_id", uid).order("created_at"),
    supabase.from("saved_works").select("work_id").eq("account_id", uid),
    supabase.from("follows").select("pro_id").eq("account_id", uid),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("account_id", uid).is("read_at", null),
    // Row level security limits this to threads the caller is part of.
    supabase.from("messages").select("id", { count: "exact", head: true }).is("read_at", null).neq("sender_id", uid),
    supabase.from("bookings").select("template_id").eq("customer_id", uid).limit(50),
  ])

  const a = account.data as Row | null
  return {
    account: a
      ? {
          id: a.id,
          fullName: a.full_name || "Bạn",
          phone: a.phone ?? "",
          activeRole: a.active_role === "pro" ? "pro" : "customer",
          email,
        }
      : null,
    addresses: ((addresses.data ?? []) as Row[]).map((r) => ({
      id: r.id,
      label: r.label ?? "",
      city: r.city,
      district: r.district,
      detail: r.detail ?? "",
      note: r.note ?? "",
      isDefault: Boolean(r.is_default),
    })),
    savedWorkIds: ((saved.data ?? []) as Row[]).map((r) => r.work_id),
    followedProIds: ((follows.data ?? []) as Row[]).map((r) => r.pro_id),
    unreadNotifications: notes.count ?? 0,
    unreadMessages: messages.count ?? 0,
    bookedCategories: ((booked.data ?? []) as Row[])
      .map((r) => getTemplate(r.template_id)?.category)
      .filter((c): c is CategoryId => Boolean(c)),
  }
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  link: string | null
  readAt: string | null
  createdAt: string
}

export async function listNotifications(uid: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at")
    .eq("account_id", uid)
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) throw new Error("Không tải được thông báo.")
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    title: r.title ?? "",
    body: r.body ?? "",
    link: r.link ?? null,
    readAt: r.read_at ?? null,
    createdAt: r.created_at,
  }))
}

/** Same write as the web's markNotificationsRead(): the owner stamps their own rows. */
export async function markNotificationsRead(uid: string) {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("account_id", uid).is("read_at", null)
}
