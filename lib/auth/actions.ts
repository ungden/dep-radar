"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { absoluteUrl } from "@/lib/env"
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server"
import { safeNext } from "./credentials"
import { isPhoneEmail, maskEmail, parseIdentifier } from "./identifier"
import { detachedAuthClient, requestPasswordReset, signInWithIdentifier, signUpWithIdentifier, throttles } from "./password"
import { MESSAGES, authErrorKind, newPasswordProblem } from "./password-rules"
import { toE164 } from "./phone"
import { clientIp } from "./throttle"

/**
 * Signing in, through Supabase Auth: Google or Apple (when switched on in the
 * dashboard, lib/auth/providers.ts), or a password with a phone number or an
 * email (lib/auth/password.ts, shared with the app's /api/auth/* routes). No SMS.
 *
 * Google, Apple and an email sign-up give no phone number, and the number is
 * how the two sides reach each other once a booking is accepted. So those
 * sign-ins end on /me/so-dien-thoai, and the database refuses a booking, a
 * request or a partner profile from an account that has not set one
 * (require_phone()).
 */
export type AuthResult = { ok: true } | { ok: false; error: string }

/** Starts the Google or Apple round trip; comes back through /auth/callback. */
export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = formData.get("provider") === "apple" ? "apple" : "google"
  const next = safeNext(String(formData.get("next") ?? ""), "/")
  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
      queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
    },
  })
  if (error || !data.url) {
    console.error("signInWithOAuth failed:", provider, error?.code, error?.message)
    redirect(`/login?loi=${provider}&next=${encodeURIComponent(next)}`)
  }
  redirect(data.url)
}

export type SignInResult = { ok: true; next: string } | { ok: false; error: string }

/** Where a password sign-in lands: the phone step first if the account has no number. */
async function landing(userId: string, next: string): Promise<string> {
  const supabase = await supabaseServer()
  const { data } = await supabase.from("accounts").select("phone").eq("id", userId).maybeSingle()
  return data?.phone ? next : `/me/so-dien-thoai?next=${encodeURIComponent(next)}`
}

export async function signInWithPassword(input: { identifier: string; password: string; next?: string }): Promise<SignInResult> {
  if (!throttles.signIn.take(clientIp(await headers()))) return { ok: false, error: MESSAGES.tooMany }
  const next = safeNext(input.next)
  const result = await signInWithIdentifier(await supabaseServer(), input.identifier, input.password)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath("/", "layout")
  return { ok: true, next: await landing(result.userId, next) }
}

export async function signUpWithPassword(input: {
  identifier: string
  password: string
  fullName: string
  next?: string
}): Promise<SignInResult> {
  if (!throttles.signUp.take(clientIp(await headers()))) return { ok: false, error: MESSAGES.tooMany }
  const next = safeNext(input.next)
  const result = await signUpWithIdentifier(await supabaseServer(), input)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath("/", "layout")
  // A number-only account cannot recover a forgotten password: offer an email right away.
  if (result.kind === "phone") return { ok: true, next: `/me/email?next=${encodeURIComponent(next)}` }
  return { ok: true, next: await landing(result.userId, next) }
}

export type ForgotResult = { sent: boolean; masked?: string; message: string; noEmail?: boolean }

export async function forgotPassword(identifier: string): Promise<ForgotResult> {
  if (!throttles.forgot.take(clientIp(await headers()))) return { sent: false, message: MESSAGES.tooMany }
  const { sent, masked, message, noEmail } = await requestPasswordReset(identifier)
  return { sent, masked, message, noEmail }
}

/** For password accounts, from Cài đặt: the current password first, then the new one. */
export async function changePassword(input: { current: string; next: string }): Promise<AuthResult> {
  const problem = newPasswordProblem(input.next)
  if (problem) return { ok: false, error: problem }
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user?.email) return { ok: false, error: "Cần đăng nhập." }
  if (!throttles.changePassword.take(auth.user.id)) return { ok: false, error: MESSAGES.tooMany }
  if (input.current === input.next) return { ok: false, error: "Mật khẩu mới phải khác mật khẩu hiện tại." }

  // Checked on a throwaway client, so this browser's own session is untouched.
  const check = detachedAuthClient()
  const { error: wrong } = await check.auth.signInWithPassword({ email: auth.user.email, password: input.current })
  if (wrong) {
    const kind = authErrorKind(wrong)
    if (kind === "invalid_credentials") return { ok: false, error: "Mật khẩu hiện tại chưa đúng." }
    if (kind === "rate_limited") return { ok: false, error: MESSAGES.tooMany }
    console.error("changePassword check failed:", wrong.code, wrong.message)
    return { ok: false, error: MESSAGES.failed }
  }
  await check.auth.signOut({ scope: "local" })

  const { error } = await supabase.auth.updateUser({ password: input.next })
  if (error) {
    switch (authErrorKind(error)) {
      case "same_password":
        return { ok: false, error: "Mật khẩu mới phải khác mật khẩu hiện tại." }
      case "weak_password":
        return { ok: false, error: "Mật khẩu này quá dễ đoán. Chọn mật khẩu khác." }
      case "reauth":
        return { ok: false, error: "Vì an toàn, đăng xuất rồi đăng nhập lại trước khi đổi mật khẩu." }
    }
    console.error("updateUser(password) failed:", error.code, error.message)
    return { ok: false, error: MESSAGES.failed }
  }
  return { ok: true }
}

/**
 * A real email for an account made with a phone number, so a forgotten password
 * can be recovered. Supabase mails a confirmation link to the new address; the
 * auth email changes only when that link is opened.
 */
export async function addRecoveryEmail(rawEmail: string): Promise<{ ok: true; masked: string } | { ok: false; error: string }> {
  const id = parseIdentifier(rawEmail)
  if (id.kind !== "email" || isPhoneEmail(id.email)) return { ok: false, error: "Nhập một địa chỉ email hợp lệ." }
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: "Cần đăng nhập." }
  if (auth.user.email?.toLowerCase() === id.email) return { ok: false, error: "Đây đã là email của tài khoản." }

  const { error } = await supabase.auth.updateUser(
    { email: id.email },
    { emailRedirectTo: absoluteUrl(`/auth/callback?loai=email&next=${encodeURIComponent("/me/cai-dat")}`) },
  )
  if (error) {
    switch (authErrorKind(error)) {
      case "user_exists":
        return { ok: false, error: "Email này đã thuộc một tài khoản khác." }
      case "email_invalid":
        return { ok: false, error: "Email này không nhận được thư. Kiểm tra lại địa chỉ." }
      case "rate_limited":
        return { ok: false, error: "Đã gửi nhiều lần quá. Đợi một lúc rồi thử lại." }
    }
    console.error("updateUser(email) failed:", error.code, error.message)
    return { ok: false, error: "Chưa gửi được email xác nhận. Thử lại sau, hoặc liên hệ hỗ trợ." }
  }
  revalidatePath("/", "layout")
  return { ok: true, masked: maskEmail(id.email) }
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
