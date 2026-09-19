"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server"
import { otpEnabled } from "./config"
import { toE164 } from "./phone"

/**
 * Signing in by phone number.
 *
 * With an SMS provider configured, this is a real one-time code. Without one it
 * is a labelled demo sign-in: the server creates or finds the account for that
 * number and opens a session, and the login screen says plainly that no code was
 * sent. What it must never be is a password anyone can guess, so the demo path
 * rotates a random password the browser never sees.
 */
export type AuthResult = { ok: true; otpSent: boolean } | { ok: false; error: string }

export async function requestCode(rawPhone: string, fullName: string): Promise<AuthResult> {
  const phone = toE164(rawPhone)
  if (!phone) return { ok: false, error: "Số điện thoại không hợp lệ. Nhập số di động Việt Nam." }
  const name = fullName.trim()
  if (name.length < 2) return { ok: false, error: "Nhập họ tên của bạn." }

  if (!otpEnabled) return { ok: false, error: "Đăng nhập SMS đang chưa khả dụng. Vui lòng thử lại sau." }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { data: { full_name: name }, channel: "sms" },
  })
  if (error) return { ok: false, error: "Không gửi được mã xác thực. Vui lòng thử lại sau." }
  return { ok: true, otpSent: true }
}

export async function verifyCode(rawPhone: string, code: string): Promise<AuthResult> {
  const phone = toE164(rawPhone)
  if (!phone) return { ok: false, error: "Số điện thoại không hợp lệ." }
  if (!/^\d{4,8}$/.test(code.trim())) return { ok: false, error: "Mã xác thực gồm 6 chữ số." }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.verifyOtp({ phone, token: code.trim(), type: "sms" })
  if (error) return { ok: false, error: "Mã xác thực không đúng hoặc đã hết hạn." }
  revalidatePath("/", "layout")
  return { ok: true, otpSent: false }
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
}

/** Turn the signed-in account into a freelancer profile, or return the existing one. */
export async function becomePro(input: {
  title: string
  city: string
  district: string
  categories: string[]
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }

  const { data: already } = await supabase.from("pros").select("slug").eq("id", auth.user.id).maybeSingle()
  if (already) return { ok: true, slug: already.slug }

  const { data: account } = await supabase
    .from("accounts")
    .select("full_name")
    .eq("id", auth.user.id)
    .maybeSingle()

  const slug = await uniqueSlug(account?.full_name || "chuyen-vien")
  const { data: district } = await supabase
    .from("districts")
    .select("lat, lng")
    .eq("city", input.city)
    .eq("district", input.district)
    .maybeSingle()
  if (!district) return { ok: false, error: "Khu vực hoạt động không hợp lệ." }
  const { error } = await supabase.from("pros").insert({
    id: auth.user.id,
    slug,
    title: input.title,
    city: input.city,
    district: input.district,
    lat: district.lat,
    lng: district.lng,
    categories: input.categories as never,
  })
  if (error) return { ok: false, error: "Không tạo được hồ sơ chuyên viên." }
  await supabase.from("accounts").update({ active_role: "pro" }).eq("id", auth.user.id)
  revalidatePath("/studio")
  return { ok: true, slug }
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "chuyen-vien"
  )
}

async function uniqueSlug(name: string) {
  const admin = supabaseAdmin()
  const base = slugify(name)
  const { data } = await admin.from("pros").select("slug").like("slug", `${base}%`)
  const taken = new Set((data ?? []).map((r) => r.slug))
  if (!taken.has(base)) return base
  for (let i = 2; i < 100; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`
  return `${base}-${crypto.randomUUID().slice(0, 6)}`
}

export async function switchRole(role: "customer" | "pro"): Promise<void> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return
  await supabase.from("accounts").update({ active_role: role }).eq("id", auth.user.id)
  revalidatePath("/", "layout")
}
