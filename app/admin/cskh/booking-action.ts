"use server"

import { supabaseServer } from "@/lib/supabase/server"

export async function supportBooking<T>(action: "options" | "quote" | "place", customer: string, input: object) {
  const db = await supabaseServer()
  const { data, error } = await db.rpc("support_assisted_booking" as never, { p_action: action, p_customer: customer, p_input: input } as never)
  if (error) return { ok: false as const, error: ["23514","42501","P0002"].includes(error.code) ? error.message : "Không xử lý được yêu cầu này. Kiểm tra thông tin rồi thử lại." }
  return { ok: true as const, data: data as T }
}
