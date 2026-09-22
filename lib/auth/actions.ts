"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { absoluteUrl } from "@/lib/env"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server"
import { safeNext } from "./credentials"
import { toE164 } from "./phone"

/**
 * Signing in is Google, through Supabase Auth. No password to forget, no SMS.
 *
 * Google gives a name and an email but never a phone number, and a freelancer
 * has to call the customer before taking a job. So the first sign-in ends on
 * /me/so-dien-thoai, and the database refuses a booking, a request or a
 * freelancer profile from an account that has not set one (require_phone()).
 */
export type AuthResult = { ok: true } | { ok: false; error: string }

/** Starts the Google round trip; comes back through /auth/callback. */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNext(String(formData.get("next") ?? ""), "/")
  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
      queryParams: { prompt: "select_account" },
    },
  })
  if (error || !data.url) {
    console.error("signInWithOAuth failed:", error?.code, error?.message)
    redirect(`/login?loi=google&next=${encodeURIComponent(next)}`)
  }
  redirect(data.url)
}

/** Once per account. Changing a number later goes through support. */
export async function setMyPhone(rawPhone: string): Promise<AuthResult> {
  const phone = toE164(rawPhone)
  if (!phone) return { ok: false, error: "Số điện thoại không hợp lệ. Nhập số di động Việt Nam." }
  const supabase = await supabaseServer()
  const { error } = await supabase.rpc("set_my_phone" as never, { p_phone: phone } as never)
  if (error) {
    // The function's own messages are written for people; anything else is not.
    const message = /[ạ-ỹđ]/i.test(error.message) ? error.message : "Không lưu được số điện thoại. Vui lòng thử lại."
    return { ok: false, error: message }
  }
  revalidatePath("/", "layout")
  return { ok: true }
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
