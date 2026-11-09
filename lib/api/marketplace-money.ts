"use server"

import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase/server"
import type { BookingCheckout } from "@/lib/payments/vietqr"

async function call<T>(name: string, args: Record<string, unknown>) {
  const db = await supabaseServer()
  const { data, error } = await db.rpc(name as never, args as never)
  if (error) {
    const message = ["23514","23505","42501","P0002"].includes(error.code) ? error.message : "Chưa xử lý được. Vui lòng thử lại."
    return { ok: false as const, error: message }
  }
  return { ok: true as const, data: data as T }
}

export async function bookingCheckout(id: string, action: "read" | "issue" | "cancel" = "read") {
  const result = await call<BookingCheckout>("booking_checkout", { p_booking: id, p_action: action })
  if (result.ok && action !== "read") revalidatePath("/bookings/" + id)
  return result
}

export async function requestCashout(id: string, bank?: string, account?: string, holder?: string) {
  return call<void>("request_booking_cashout", { p_booking: id, p_bank: bank ?? null, p_account: account ?? null, p_holder: holder ?? null })
}

export async function manageBookingMoney(action: "read" | "configure" | "reserve" | "sent" | "release", id: string | null = null, input: Record<string, unknown> = {}) {
  const result = await call<BookingMoneyDesk>("admin_booking_money", { p_action: action, p_booking: id, p_input: input })
  if (result.ok && action !== "read") revalidatePath("/admin/thanh-toan")
  return result
}

export interface BookingMoneyDesk {
  settings: { enabled: boolean; bin: string | null; account: string | null; holder: string | null }
  cashouts: { booking_id: string; kind: "artist" | "refund"; state: "queued" | "processing" | "sent"; amount: number; bank: string; account: string; holder: string; bank_ref: string | null; mine: boolean }[]
}
