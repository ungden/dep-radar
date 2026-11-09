"use server"

import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase/server"

export type VoucherCampaign = { code: string; title: string; amount: number; min_total: number; claim_limit: number; claimed: number; ends_at: string; paused: boolean }
export async function claimCampaignVoucher(code: string) {
  const db = await supabaseServer()
  const { error } = await db.rpc("claim_campaign_voucher" as never, { p_code: code } as never)
  if (error) return { ok: false as const, error: error.code === "23514" ? error.message : "Chưa nhận được voucher. Thử đăng nhập lại." }
  revalidatePath("/gioi-thieu")
  return { ok: true as const }
}

export async function adminCampaign(action: "read" | "create" | "pause" | "resume", input: object = {}) {
  const db = await supabaseServer()
  const { data, error } = await db.rpc("admin_voucher_campaign" as never, { p_action: action, p_input: input } as never)
  if (error) return { ok: false as const, error: error.code === "23505" ? "Mã ưu đãi đã tồn tại." : "Không lưu được. Kiểm tra mã, hạn, giá trị và số lượt." }
  if (action !== "read") revalidatePath("/admin/uu-dai")
  return { ok: true as const, data: data as unknown as VoucherCampaign[] }
}
