"use server"

import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase/server"
import type { PaymentMethod } from "@/lib/types"

/**
 * Every write the app makes. Each one calls a database RPC that re-checks the
 * rules, so a request crafted by hand gets the same answer as the button.
 *
 * Actions return a result instead of throwing, because a rejected booking is a
 * normal outcome the screen has to explain ("Khung giờ này đã có lịch khác"),
 * not an error page.
 */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

const GENERIC = "Có lỗi xảy ra, vui lòng thử lại."

/** Postgres messages from our RPCs are written for the user; the rest are not. */
function messageFor(error: { message?: string; code?: string } | null): string {
  const raw = error?.message?.trim()
  if (!raw) return GENERIC
  if (/^(duplicate key|permission denied|JWT|new row violates|invalid input)/i.test(raw)) return GENERIC
  // Anything our own functions raise is already a sentence in Vietnamese.
  return /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩậắằẵặẹẻẽếềểệỉịọỏốồổộớờởợụủứừửữựỳỵỷỹ]/i.test(raw) ? raw : GENERIC
}

async function rpc<T>(fn: string, args: Record<string, unknown>, paths: string[] = []): Promise<ActionResult<T>> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc(fn as never, args as never)
  if (error) return { ok: false, error: messageFor(error) }
  for (const path of paths) revalidatePath(path)
  return { ok: true, data: data as T }
}

// Customer -------------------------------------------------------------------

export async function createBooking(input: {
  proId: string
  templateId: string
  variantId: string
  startsAt: string
  atHome: boolean
  addressId?: string | null
  quantity?: number
  note?: string
  paymentMethod?: PaymentMethod
}) {
  return rpc<string>(
    "create_booking",
    {
      p_pro: input.proId,
      p_template: input.templateId,
      p_variant: input.variantId,
      p_starts_at: input.startsAt,
      p_at_home: input.atHome,
      p_address_id: input.addressId ?? null,
      p_quantity: input.quantity ?? 1,
      p_note: input.note ?? "",
      p_payment: input.paymentMethod ?? "cash",
    },
    ["/bookings"],
  )
}

export async function cancelBooking(bookingId: string, reason: string) {
  return rpc<void>("cancel_booking", { p_booking: bookingId, p_reason: reason }, ["/bookings", "/studio/jobs"])
}

export async function requestReschedule(bookingId: string, startsAt: string) {
  return rpc<void>("request_reschedule", { p_booking: bookingId, p_starts_at: startsAt }, ["/bookings", "/studio/jobs"])
}

export async function respondReschedule(bookingId: string, accept: boolean) {
  return rpc<void>("respond_reschedule", { p_booking: bookingId, p_accept: accept }, ["/bookings", "/studio/jobs"])
}

export async function writeReview(input: {
  bookingId: string
  rating: number
  tags: string[]
  body: string
  photos?: string[]
}) {
  return rpc<void>(
    "write_review",
    {
      p_booking: input.bookingId,
      p_rating: input.rating,
      p_tags: input.tags,
      p_body: input.body,
      p_photo_paths: input.photos ?? [],
    },
    ["/bookings", "/pros"],
  )
}

export async function postJob(input: {
  templateId: string
  variantId: string
  startsAt: string
  atHome: boolean
  addressId?: string | null
  quantity?: number
  description?: string
  paymentMethod?: PaymentMethod
}) {
  return rpc<string>(
    "post_job",
    {
      p_template: input.templateId,
      p_variant: input.variantId,
      p_starts_at: input.startsAt,
      p_at_home: input.atHome,
      p_address_id: input.addressId ?? null,
      p_quantity: input.quantity ?? 1,
      p_description: input.description ?? "",
      p_payment: input.paymentMethod ?? "cash",
    },
    ["/requests"],
  )
}

export async function acceptOffer(offerId: string) {
  return rpc<string>("accept_offer", { p_offer: offerId }, ["/requests", "/bookings"])
}

// Freelancer ------------------------------------------------------------------

export async function confirmBooking(bookingId: string) {
  return rpc<void>("confirm_booking", { p_booking: bookingId }, ["/studio", "/studio/jobs", "/bookings"])
}

export async function declineBooking(bookingId: string, reason: string) {
  return rpc<void>("decline_booking", { p_booking: bookingId, p_reason: reason }, ["/studio/jobs", "/bookings"])
}

export async function startBooking(bookingId: string) {
  return rpc<void>("start_booking", { p_booking: bookingId }, ["/studio/jobs", "/bookings"])
}

export async function completeBooking(bookingId: string) {
  return rpc<void>("complete_booking", { p_booking: bookingId }, ["/studio", "/studio/jobs", "/bookings"])
}

export async function markNoShow(bookingId: string, reason: string) {
  return rpc<void>("mark_no_show", { p_booking: bookingId, p_reason: reason }, ["/studio/jobs", "/bookings"])
}

export async function sendOffer(jobId: string, price: number, message: string) {
  return rpc<string>("send_offer", { p_job: jobId, p_price: price, p_message: message }, ["/studio/jobs"])
}

export async function withdrawOffer(offerId: string) {
  return rpc<void>("withdraw_offer", { p_offer: offerId }, ["/studio/jobs"])
}

export async function replyReview(bookingId: string, reply: string) {
  return rpc<void>("reply_review", { p_booking: bookingId, p_reply: reply }, ["/pros"])
}

// Profile, listings, availability --------------------------------------------
// These are ordinary table writes: row level security and the price-band trigger
// are what keep them honest, so there is no RPC to go through.

export async function setAcceptingJobs(value: boolean): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const { error } = await supabase.from("pros").update({ accepting_jobs: value }).eq("id", auth.user.id)
  if (error) return { ok: false, error: messageFor(error) }
  revalidatePath("/studio")
  return { ok: true, data: undefined }
}

export async function saveListing(input: {
  templateId: string
  prices: Record<string, number>
  active?: boolean
}): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const proId = auth.user.id

  const { error: listingError } = await supabase
    .from("pro_services")
    .upsert({ pro_id: proId, template_id: input.templateId, active: input.active ?? true })
  if (listingError) return { ok: false, error: messageFor(listingError) }

  const rows = Object.entries(input.prices).map(([variant_id, price]) => ({
    pro_id: proId,
    template_id: input.templateId,
    variant_id,
    price,
  }))
  // Options the freelancer removed are no longer offered.
  const { error: clearError } = await supabase
    .from("pro_service_prices")
    .delete()
    .eq("pro_id", proId)
    .eq("template_id", input.templateId)
    .not("variant_id", "in", `(${Object.keys(input.prices).join(",") || "''"})`)
  if (clearError) return { ok: false, error: messageFor(clearError) }

  if (rows.length) {
    const { error } = await supabase.from("pro_service_prices").upsert(rows)
    if (error) return { ok: false, error: messageFor(error) }
  }
  revalidatePath("/studio/services")
  return { ok: true, data: undefined }
}

export async function removeListing(templateId: string): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const { error } = await supabase
    .from("pro_services")
    .delete()
    .eq("pro_id", auth.user.id)
    .eq("template_id", templateId)
  if (error) return { ok: false, error: messageFor(error) }
  revalidatePath("/studio/services")
  return { ok: true, data: undefined }
}

export async function saveAddress(input: {
  id?: string
  label: string
  city: string
  district: string
  detail: string
  note?: string
  lat?: number | null
  lng?: number | null
  isDefault?: boolean
}): Promise<ActionResult<string>> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }

  if (input.isDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("account_id", auth.user.id)
  }
  const row = {
    account_id: auth.user.id,
    label: input.label,
    city: input.city,
    district: input.district,
    detail: input.detail,
    note: input.note ?? "",
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    is_default: input.isDefault ?? false,
  }
  const query = input.id
    ? supabase.from("addresses").update(row).eq("id", input.id).select("id").single()
    : supabase.from("addresses").insert(row).select("id").single()
  const { data, error } = await query
  if (error) return { ok: false, error: messageFor(error) }
  revalidatePath("/me")
  return { ok: true, data: data.id }
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { error } = await supabase.from("addresses").delete().eq("id", id)
  if (error) return { ok: false, error: messageFor(error) }
  revalidatePath("/me")
  return { ok: true, data: undefined }
}

export async function toggleSavedWork(workId: string): Promise<ActionResult<boolean>> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const { data: existing } = await supabase
    .from("saved_works")
    .select("work_id")
    .eq("account_id", auth.user.id)
    .eq("work_id", workId)
    .maybeSingle()
  if (existing) {
    await supabase.from("saved_works").delete().eq("account_id", auth.user.id).eq("work_id", workId)
    revalidatePath("/me")
    return { ok: true, data: false }
  }
  const { error } = await supabase.from("saved_works").insert({ account_id: auth.user.id, work_id: workId })
  if (error) return { ok: false, error: messageFor(error) }
  revalidatePath("/me")
  return { ok: true, data: true }
}

export async function toggleFollow(proId: string): Promise<ActionResult<boolean>> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const { data: existing } = await supabase
    .from("follows")
    .select("pro_id")
    .eq("account_id", auth.user.id)
    .eq("pro_id", proId)
    .maybeSingle()
  if (existing) {
    await supabase.from("follows").delete().eq("account_id", auth.user.id).eq("pro_id", proId)
    return { ok: true, data: false }
  }
  const { error } = await supabase.from("follows").insert({ account_id: auth.user.id, pro_id: proId })
  if (error) return { ok: false, error: messageFor(error) }
  return { ok: true, data: true }
}
