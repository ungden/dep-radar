"use server"

import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase/server"

export async function saveCustomerNote(customerId: string, body: string) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(customerId) || !body.trim() || body.trim().length > 1500) {
    return { ok: false, message: "Kiểm tra lại ghi chú trước khi lưu." }
  }
  const client = await supabaseServer()
  const { error } = await client.rpc("add_customer_note" as never, { p_customer: customerId, p_body: body.trim() } as never)
  if (error) return { ok: false, message: "Chưa lưu được ghi chú. Kiểm tra quyền hoặc thử lại." }
  revalidatePath("/admin/cskh")
  return { ok: true, message: "Đã lưu ghi chú." }
}
