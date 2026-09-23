import { DISTRICT_COORDS } from "@/shared"
import { messageFor, supabase, type Result } from "./supabase"

/**
 * Saved addresses, written exactly as saveAddress() / deleteAddress() in
 * lib/api/actions.ts: the `addresses` table under the "own addresses" row
 * level security policy. Only one default per account (a unique index), so
 * the others are cleared first.
 */
export interface AddressInput {
  id?: string
  label: string
  city: string
  district: string
  detail: string
  note?: string
  isDefault?: boolean
}

/** The id of the address saved last, so the booking flow can pick it when the editor closes. */
export let lastSavedAddressId: string | null = null
export const takeLastSavedAddress = () => {
  const id = lastSavedAddressId
  lastSavedAddressId = null
  return id
}

export async function saveAddress(uid: string | null, input: AddressInput): Promise<Result<string>> {
  if (!uid) return { ok: false, error: "Cần đăng nhập." }
  const detail = input.detail.trim()
  if (!input.city || !input.district) return { ok: false, error: "Chọn thành phố và quận." }
  if (detail.length < 3) return { ok: false, error: "Nhập số nhà, tên đường." }

  if (input.isDefault) {
    const { error } = await supabase.from("addresses").update({ is_default: false }).eq("account_id", uid)
    if (error) return { ok: false, error: messageFor(error, "Không lưu được địa chỉ.") }
  }

  // Travel distance is priced from coordinates; without a map pin the district
  // centre stands in, which is why the app calls the distance an estimate.
  const { data: centre } = await supabase.from("districts").select("lat, lng").eq("city", input.city).eq("district", input.district).maybeSingle()
  const fallback = DISTRICT_COORDS[input.city]?.[input.district]
  const lat = (centre as { lat?: number } | null)?.lat ?? fallback?.[0] ?? null
  const lng = (centre as { lng?: number } | null)?.lng ?? fallback?.[1] ?? null

  const row = {
    account_id: uid,
    label: input.label.trim() || "Nhà",
    city: input.city,
    district: input.district,
    detail,
    note: (input.note ?? "").trim(),
    lat,
    lng,
    is_default: input.isDefault ?? false,
  }
  const query = input.id
    ? supabase.from("addresses").update(row).eq("id", input.id).select("id").single()
    : supabase.from("addresses").insert(row).select("id").single()
  const { data, error } = await query
  if (error) return { ok: false, error: messageFor(error, "Không lưu được địa chỉ.") }
  lastSavedAddressId = (data as { id: string }).id
  return { ok: true, data: lastSavedAddressId }
}

export async function deleteAddress(id: string): Promise<Result> {
  const { error } = await supabase.from("addresses").delete().eq("id", id)
  if (error) return { ok: false, error: messageFor(error, "Không xoá được địa chỉ.") }
  return { ok: true, data: undefined }
}

export async function setDefaultAddress(uid: string, id: string): Promise<Result> {
  const { error: clear } = await supabase.from("addresses").update({ is_default: false }).eq("account_id", uid)
  if (clear) return { ok: false, error: messageFor(clear, "Không đổi được địa chỉ mặc định.") }
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id)
  if (error) return { ok: false, error: messageFor(error, "Không đổi được địa chỉ mặc định.") }
  return { ok: true, data: undefined }
}
