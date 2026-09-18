"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { CITY_COOKIE } from "./snapshot"
import { supabaseServer } from "@/lib/supabase/server"
import type { PaymentMethod } from "@/lib/types"
import { localTime } from "@/lib/utils"

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * URLs carry a freelancer's slug; RPCs need the row id. Comparing a slug against
 * the uuid column is not merely useless, it makes Postgres reject the whole
 * query -- which is how every slot silently came back as "no openings".
 */
async function proIdFor(slugOrId: string): Promise<string | null> {
  if (UUID.test(slugOrId)) return slugOrId
  const supabase = await supabaseServer()
  const { data, error } = await supabase.from("pros").select("id").eq("slug", slugOrId).maybeSingle()
  if (error) console.error("proIdFor failed:", error.message)
  return data?.id ?? null
}

/** Bookable start times for one day, generated from the freelancer's own hours. */
export async function fetchSlots(input: {
  proId: string
  templateId: string
  variantId: string
  quantity?: number
  date: string
  atHome: boolean
  addressId?: string | null
}): Promise<{ startsAt: string; time: string }[]> {
  const supabase = await supabaseServer()
  const pro = await proIdFor(input.proId)
  if (!pro) return []
  let lat: number | null = null
  let lng: number | null = null
  if (input.atHome && input.addressId) {
    const { data } = await supabase.from("addresses").select("lat, lng").eq("id", input.addressId).maybeSingle()
    lat = data?.lat ?? null
    lng = data?.lng ?? null
  } else if (!input.atHome) {
    const { data } = await supabase.from("pros").select("lat, lng").eq("id", pro).maybeSingle()
    lat = data?.lat ?? null
    lng = data?.lng ?? null
  }
  const { data, error } = await supabase.rpc("free_slots", {
    p_pro: pro,
    p_template: input.templateId,
    p_variant: input.variantId,
    p_quantity: input.quantity ?? 1,
    p_date: input.date,
    p_at_home: input.atHome,
    p_lat: lat ?? undefined,
    p_lng: lng ?? undefined,
  })
  if (error) {
    console.error("free_slots failed:", error.message)
    return []
  }
  return ((data ?? []) as unknown as string[]).map((startsAt) => ({ startsAt, time: localTime(startsAt) }))
}

// Customer -------------------------------------------------------------------

export async function createBooking(input: {
  /** Slug or id of the freelancer. */
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
  const pro = await proIdFor(input.proId)
  if (!pro) return { ok: false as const, error: "Không tìm thấy chuyên viên." }
  return rpc<string>(
    "create_booking",
    {
      p_pro: pro,
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

export async function closeJob(jobId: string): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { error } = await supabase.from("jobs").delete().eq("id", jobId)
  if (error) return { ok: false, error: messageFor(error) }
  revalidatePath("/requests")
  return { ok: true, data: undefined }
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

/** The job board holds a job id, not an offer id: find the caller's own offer. */
export async function withdrawMyOfferOn(jobId: string): Promise<ActionResult> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const { data: offer } = await supabase
    .from("offers")
    .select("id")
    .eq("job_id", jobId)
    .eq("pro_id", auth.user.id)
    .maybeSingle()
  if (!offer) return { ok: false, error: "Bạn chưa báo giá cho yêu cầu này." }
  return withdrawOffer(offer.id)
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

  // Travel distance is computed from coordinates, so an address without them
  // cannot be priced. Until there is a map to drop a pin on, fall back to the
  // district centre -- which is why the UI calls the distance an estimate.
  let { lat, lng } = input
  if (lat == null || lng == null) {
    const { data: centre } = await supabase
      .from("districts")
      .select("lat, lng")
      .eq("city", input.city)
      .eq("district", input.district)
      .maybeSingle()
    lat = centre?.lat ?? null
    lng = centre?.lng ?? null
  }

  const row = {
    account_id: auth.user.id,
    label: input.label,
    city: input.city,
    district: input.district,
    detail: input.detail,
    note: input.note ?? "",
    lat,
    lng,
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

/** Takes a work slug, the id the URLs use. */
export async function toggleSavedWork(workSlug: string): Promise<ActionResult<boolean>> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const query = supabase.from("works").select("id")
  const { data: work } = await (UUID.test(workSlug)
    ? query.eq("id", workSlug).maybeSingle()
    : query.eq("slug", workSlug).maybeSingle())
  if (!work) return { ok: false, error: "Không tìm thấy tác phẩm." }
  const workId = work.id
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

/** Takes a freelancer slug, the id the URLs use. */
export async function toggleFollow(proSlug: string): Promise<ActionResult<boolean>> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  const proId = await proIdFor(proSlug)
  if (!proId) return { ok: false, error: "Không tìm thấy chuyên viên." }
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

/**
 * Which city the customer is browsing. A cookie rather than browser storage, so
 * the feed arrives already filtered instead of re-rendering after hydration.
 */
export async function setBrowsingCity(city: string | null): Promise<void> {
  const store = await cookies()
  if (city) store.set(CITY_COOKIE, city, { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax" })
  else store.delete(CITY_COOKIE)
  revalidatePath("/", "layout")
}
