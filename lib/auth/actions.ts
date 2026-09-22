"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { absoluteUrl } from "@/lib/env"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server"
import { RESET_COOKIE, isEmail, parseIdentifier, passwordProblem } from "./credentials"
import { toE164 } from "./phone"

/**
 * Signing in with a password. No SMS, no code.
 *
 * Supabase Auth holds email + password, because email is how a forgotten
 * password comes back. The phone number is still required at sign-up, unique,
 * and still the thing people type to sign in: the server looks up the email
 * behind it, so a browser never learns which email belongs to which number.
 *
 * Every failure to sign in reads the same, so the form cannot be used to find
 * out whether a number or an address has an account.
 */
export type AuthResult = { ok: true } | { ok: false; error: string }

const WRONG_CREDENTIALS = "Sai số điện thoại/email hoặc mật khẩu."

export async function signUpWithPassword(input: {
  fullName: string
  phone: string
  email: string
  password: string
}): Promise<AuthResult> {
  const name = input.fullName.trim()
  if (name.length < 2) return { ok: false, error: "Nhập họ tên của bạn." }
  const phone = toE164(input.phone)
  if (!phone) return { ok: false, error: "Số điện thoại không hợp lệ. Nhập số di động Việt Nam." }
  const email = input.email.trim().toLowerCase()
  if (!isEmail(email)) return { ok: false, error: "Email không hợp lệ." }
  const weak = passwordProblem(input.password)
  if (weak) return { ok: false, error: weak }

  // The database refuses a second account on the same number either way; asking
  // first only turns "Database error saving new user" into a sentence.
  const { data: taken } = await supabaseAdmin().from("accounts").select("id").eq("phone", phone).maybeSingle()
  if (taken) {
    return { ok: false, error: "Số điện thoại này đã có tài khoản. Hãy đăng nhập, hoặc dùng “Quên mật khẩu”." }
  }

  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { full_name: name, phone } },
  })
  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { ok: false, error: "Email này đã có tài khoản. Hãy đăng nhập, hoặc dùng “Quên mật khẩu”." }
    }
    if (error.code === "weak_password") return { ok: false, error: "Mật khẩu quá dễ đoán, chọn mật khẩu khác." }
    console.error("signUp failed:", error.code, error.message)
    return { ok: false, error: "Không tạo được tài khoản. Vui lòng thử lại sau." }
  }
  if (!data.session) {
    // Only when email confirmation is switched on in the Supabase project.
    return { ok: false, error: "Đã tạo tài khoản. Mở email để xác nhận, rồi đăng nhập." }
  }
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function signInWithPassword(identifier: string, password: string): Promise<AuthResult> {
  const who = parseIdentifier(identifier)
  if (!who) return { ok: false, error: "Nhập số điện thoại hoặc email." }
  if (!password) return { ok: false, error: "Nhập mật khẩu." }

  const email = who.kind === "email" ? who.email : await emailForPhone(who.phone)
  if (!email) return { ok: false, error: WRONG_CREDENTIALS }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, error: "Email chưa được xác nhận. Mở email 360dep đã gửi để xác nhận." }
    }
    if (error.status === 429) return { ok: false, error: "Thử quá nhiều lần. Đợi vài phút rồi thử lại." }
    return { ok: false, error: WRONG_CREDENTIALS }
  }
  revalidatePath("/", "layout")
  return { ok: true }
}

/**
 * Always answers the same way, found or not. The link lands on /auth/confirm,
 * which opens a session and sends the person to set a new password.
 */
export async function requestPasswordReset(identifier: string): Promise<AuthResult> {
  const who = parseIdentifier(identifier)
  if (!who) return { ok: false, error: "Nhập số điện thoại hoặc email của tài khoản." }
  const email = who.kind === "email" ? who.email : await emailForPhone(who.phone)
  if (email) {
    const supabase = await supabaseServer()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: absoluteUrl("/auth/confirm?next=/dat-lai-mat-khau"),
    })
    if (error) console.error("resetPasswordForEmail failed:", error.code, error.message)
  }
  return { ok: true }
}

/** Only from a reset link: /auth/confirm leaves a short-lived cookie naming the account. */
export async function setNewPassword(password: string): Promise<AuthResult> {
  const weak = passwordProblem(password)
  if (weak) return { ok: false, error: weak }
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const store = await cookies()
  if (!auth.user || store.get(RESET_COOKIE)?.value !== auth.user.id) {
    return { ok: false, error: "Link đặt lại mật khẩu đã hết hạn. Hãy yêu cầu link mới." }
  }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    if (error.code === "same_password") return { ok: false, error: "Mật khẩu mới phải khác mật khẩu cũ." }
    return { ok: false, error: "Không đổi được mật khẩu. Vui lòng thử lại." }
  }
  store.delete(RESET_COOKIE)
  revalidatePath("/", "layout")
  return { ok: true }
}

/** From account settings: proves the current password first. */
export async function changePassword(current: string, next: string): Promise<AuthResult> {
  const weak = passwordProblem(next)
  if (weak) return { ok: false, error: weak }
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user?.email) return { ok: false, error: "Cần đăng nhập." }
  const { error: wrong } = await supabase.auth.signInWithPassword({ email: auth.user.email, password: current })
  if (wrong) return { ok: false, error: "Mật khẩu hiện tại không đúng." }
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) {
    if (error.code === "same_password") return { ok: false, error: "Mật khẩu mới phải khác mật khẩu cũ." }
    return { ok: false, error: "Không đổi được mật khẩu. Vui lòng thử lại." }
  }
  return { ok: true }
}

async function emailForPhone(phone: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin().rpc("account_email_for_phone" as never, { p_phone: phone } as never)
  if (error) {
    console.error("account_email_for_phone failed:", error.message)
    return null
  }
  return (data as string | null) ?? null
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
