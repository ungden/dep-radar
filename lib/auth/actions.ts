"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { absoluteUrl } from "@/lib/env"
import { supabaseServer } from "@/lib/supabase/server"
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
 * how the two sides reach each other once a booking is accepted. Signing up
 * does not ask for it; booking, posting a request and opening a partner profile
 * do (middleware NEEDS_PHONE), and the database refuses those without one
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

/**
 * Where a password sign-in lands: where the person was going. A missing phone
 * number is asked later, at the step that needs it (middleware NEEDS_PHONE).
 */
async function landing(_userId: string, next: string): Promise<string> {
  return next
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

/** Add or change the signed-in account's unique phone number. */
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
  const { data, error } = await supabase.rpc("create_partner" as never, {
    p_title: input.title, p_city: input.city, p_district: input.district, p_categories: input.categories,
  } as never)
  if (error) return { ok: false, error: /[ạ-ỹđ]/i.test(error.message) ? error.message : "Không tạo được hồ sơ đối tác." }
  revalidatePath("/", "layout")
  return { ok: true, slug: String(data) }
}

export async function switchRole(role: "customer" | "pro"): Promise<void> {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return
  await supabase.from("accounts").update({ active_role: role }).eq("id", auth.user.id)
  revalidatePath("/", "layout")
}
