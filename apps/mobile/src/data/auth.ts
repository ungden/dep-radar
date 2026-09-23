import * as SecureStore from "expo-secure-store"
import type { User } from "@supabase/supabase-js"
import { isPhoneEmail, parseIdentifier, passwordProblem } from "@/shared"
import { WEB_URL } from "./links"
import { SUPABASE_KEY, SUPABASE_URL, backendConfigured, supabase } from "./supabase"

/**
 * Password accounts. Signing in with a phone number needs the server (the
 * number is looked up to the account's auth email there), so the app posts to
 * the web's /api/auth/* and receives a Supabase session back, the same one the
 * web would have set in its cookies.
 */

type Tokens = { access_token?: string; refresh_token?: string; error?: string }

export type AuthResult = { ok: true; user: User } | { ok: false; error: string }

const OFFLINE = "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại."

async function post<T>(path: string, body: Record<string, string>): Promise<{ status: number; json: T | null } | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${WEB_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const json = (await res.json().catch(() => null)) as T | null
    return { status: res.status, json }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** The web writes its errors in Vietnamese for people; anything else gets ours. */
const said = (error: unknown, fallback: string) => (typeof error === "string" && /[ạ-ỹđàáâãèéêìíòóôõùúýăĩũơư]/i.test(error) ? error : fallback)

async function adoptTokens(res: { status: number; json: Tokens | null } | null, fallback: string): Promise<AuthResult> {
  if (!res) return { ok: false, error: OFFLINE }
  const { access_token, refresh_token, error } = res.json ?? {}
  if (res.status !== 200 || !access_token || !refresh_token) return { ok: false, error: said(error, fallback) }
  const { data, error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token })
  if (sessionError || !data.user) return { ok: false, error: fallback }
  return { ok: true, user: data.user }
}

export async function signInWithPassword(identifier: string, password: string): Promise<AuthResult> {
  if (!backendConfigured) return { ok: false, error: "App chưa được cấu hình máy chủ." }
  if (parseIdentifier(identifier).kind === "invalid") return { ok: false, error: "Nhập số điện thoại hoặc email hợp lệ." }
  if (!password) return { ok: false, error: "Nhập mật khẩu." }
  const res = await post<Tokens>("/api/auth/password-login", { identifier: identifier.trim(), password })
  return adoptTokens(res, res?.status === 401 ? "Sai số điện thoại/email hoặc mật khẩu." : "Chưa đăng nhập được. Thử lại nhé.")
}

export async function signUpWithPassword(identifier: string, password: string, fullName: string): Promise<AuthResult> {
  if (!backendConfigured) return { ok: false, error: "App chưa được cấu hình máy chủ." }
  if (parseIdentifier(identifier).kind === "invalid") return { ok: false, error: "Nhập số điện thoại hoặc email hợp lệ." }
  if (!fullName.trim()) return { ok: false, error: "Nhập tên của bạn." }
  const problem = passwordProblem(password)
  if (problem) return { ok: false, error: problem }
  const res = await post<Tokens>("/api/auth/signup", { identifier: identifier.trim(), password, fullName: fullName.trim() })
  return adoptTokens(
    res,
    res?.status === 409 ? "Số điện thoại hoặc email này đã có tài khoản. Bạn đăng nhập nhé." : "Chưa tạo được tài khoản. Thử lại nhé.",
  )
}

/** Sends a reset link to the account's real email. The answer says where (masked), or why not. */
export async function forgotPassword(identifier: string): Promise<{ ok: boolean; message: string }> {
  if (parseIdentifier(identifier).kind === "invalid") return { ok: false, message: "Nhập số điện thoại hoặc email của bạn trước." }
  const res = await post<{ sent?: boolean; masked?: string; message?: string }>("/api/auth/forgot", { identifier: identifier.trim() })
  if (!res) return { ok: false, message: OFFLINE }
  const { sent, masked, message } = res.json ?? {}
  if (res.status === 200 && typeof message === "string" && message) return { ok: Boolean(sent), message }
  if (res.status === 200 && sent) return { ok: true, message: masked ? `Đã gửi link đặt lại mật khẩu tới ${masked}.` : "Đã gửi link đặt lại mật khẩu tới email của bạn." }
  return { ok: false, message: "Chưa gửi được link đặt lại mật khẩu. Thử lại sau nhé." }
}

/**
 * Which sign-in providers are switched on in Supabase Auth. The providers
 * live in the dashboard, so the app asks Auth itself (as the web does for
 * Google). null when it could not tell: the caller then shows the button and
 * lets the provider's own error speak.
 */
export async function loadProviders(): Promise<{ apple: boolean; google: boolean } | null> {
  if (!backendConfigured) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY }, signal: controller.signal })
    if (!res.ok) return null
    const settings = (await res.json()) as { external?: { apple?: boolean; google?: boolean } }
    return { apple: settings.external?.apple === true, google: settings.external?.google === true }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Signed up with a phone number: the auth email is a stand-in and a forgotten password cannot be recovered yet. */
export const needsRecoveryEmail = (user: Pick<User, "email"> | null | undefined) => isPhoneEmail(user?.email)

/** Has a password (signed up with one), as opposed to Google or Apple only. */
export function hasPassword(user: Pick<User, "app_metadata" | "identities"> | null | undefined) {
  if (!user) return false
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [user.app_metadata?.provider].filter(Boolean)
  return providers.includes("email") || Boolean(user.identities?.some((i) => i.provider === "email"))
}

const askedKey = (uid: string) => `dep360_recovery_email_asked_${uid}`

/** The "add an email" prompt comes once per person on this phone; the row in Tôi stays. */
export async function recoveryEmailAsked(uid: string) {
  try {
    return (await SecureStore.getItemAsync(askedKey(uid))) === "1"
  } catch {
    return true
  }
}

export async function rememberRecoveryEmailAsked(uid: string) {
  await SecureStore.setItemAsync(askedKey(uid), "1").catch(() => {})
}

function authMessage(error: { message?: string; code?: string } | null | undefined, fallback: string) {
  const raw = `${error?.code ?? ""} ${error?.message ?? ""}`
  if (/email_exists|already (been )?registered|already exists/i.test(raw)) return "Email này đã dùng cho một tài khoản khác."
  if (/rate|too many|over_email_send/i.test(raw)) return "Bạn thử hơi nhiều lần. Đợi vài phút rồi thử lại nhé."
  if (/same_password|different from the old/i.test(raw)) return "Mật khẩu mới cần khác mật khẩu cũ."
  if (/weak_password|weak|pwned/i.test(raw)) return "Mật khẩu này dễ đoán quá. Chọn mật khẩu khác nhé."
  if (/reauthentication|recent login|session_not_found|JWT|expired/i.test(raw)) return "Phiên đăng nhập đã cũ. Đăng xuất, đăng nhập lại rồi thử lần nữa."
  if (/invalid.*email|email_address_invalid/i.test(raw)) return "Email không hợp lệ."
  return fallback
}

/**
 * Replaces the stand-in address with a real one. Supabase normally mails a
 * confirmation link first and keeps the old address until it is clicked
 * (`pending`); when the project confirms emails automatically the new one is
 * the auth email at once.
 */
export async function addRecoveryEmail(input: string): Promise<{ ok: true; pending: boolean; email: string } | { ok: false; error: string }> {
  const parsed = parseIdentifier(input)
  if (parsed.kind !== "email") return { ok: false, error: "Nhập một địa chỉ email hợp lệ." }
  if (isPhoneEmail(parsed.email)) return { ok: false, error: "Nhập email bạn đang dùng." }
  const { data, error } = await supabase.auth.updateUser({ email: parsed.email })
  if (error || !data.user) return { ok: false, error: authMessage(error, "Chưa lưu được email. Thử lại nhé.") }
  return { ok: true, pending: data.user.email?.toLowerCase() !== parsed.email, email: parsed.email }
}

export async function changePassword(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const problem = passwordProblem(password)
  if (problem) return { ok: false, error: problem }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { ok: false, error: authMessage(error, "Chưa đổi được mật khẩu. Thử lại nhé.") }
  return { ok: true }
}
