import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js"
import { absoluteUrl } from "@/lib/env"
import { requireBackend } from "@/lib/supabase/env"
import { supabaseAdmin } from "@/lib/supabase/server"
import { isPhoneEmail, maskEmail, parseIdentifier, phoneEmail } from "./identifier"
import { MESSAGES, authErrorKind, checkSignUp } from "./password-rules"
import { createThrottle } from "./throttle"

/**
 * Password accounts, on top of Supabase's email auth (the phone provider is off:
 * no SMS). Used by the web's server actions (lib/auth/actions.ts) and by the
 * app's JSON routes (app/api/auth/*), so both behave the same.
 *
 * - Email sign-up: the auth email is theirs. The phone number is asked after,
 *   like after Google (/me/so-dien-thoai), and required before booking.
 * - Phone sign-up: the auth email is a stand-in built from the number
 *   (identifier.ts) and the number goes in user_metadata, where
 *   handle_new_user() stores it on the account. Adding a real email later
 *   (addRecoveryEmail) makes that the auth email.
 * - Signing in with a phone number looks up the email behind it with the
 *   service role. Only this server may: answered to a browser, it would turn any
 *   number into an address.
 *
 * Sign-in and sign-up themselves go through the anon key, so Auth and RLS
 * behave exactly as they would from a browser.
 */

type AuthClient = Pick<SupabaseClient, "auth">

export type Fail = { ok: false; status: number; error: string }
export type SignedIn = { ok: true; session: Session; userId: string }

/** Per-IP (or per-account) limits. See throttle.ts for what they are and are not. */
export const throttles = {
  signIn: createThrottle({ limit: 20, windowMs: 10 * 60_000 }),
  signUp: createThrottle({ limit: 5, windowMs: 10 * 60_000 }),
  forgot: createThrottle({ limit: 5, windowMs: 15 * 60_000 }),
  changePassword: createThrottle({ limit: 5, windowMs: 15 * 60_000 }),
}

/** A client with no cookies and no storage: for the app's routes and for one-off checks. */
export function detachedAuthClient(flowType: "implicit" | "pkce" = "implicit") {
  const { url, anonKey } = requireBackend()
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType },
  })
}

type Lookup = { status: "found"; email: string | null } | { status: "none" } | { status: "unavailable" }

/** The auth email of the account holding this number (E.164), with the service role. */
export async function authEmailForPhone(e164: string): Promise<Lookup> {
  try {
    const admin = supabaseAdmin()
    const { data, error } = await admin.from("accounts").select("id").eq("phone", e164).maybeSingle()
    if (error) throw error
    if (!data) return { status: "none" }
    const { data: user, error: userError } = await admin.auth.admin.getUserById(data.id)
    if (userError || !user.user) throw userError ?? new Error("no auth user")
    return { status: "found", email: user.user.email ?? null }
  } catch (error) {
    console.error("authEmailForPhone failed:", error instanceof Error ? error.message : error)
    return { status: "unavailable" }
  }
}

async function passwordAttempt(client: AuthClient, email: string, password: string): Promise<SignedIn | Fail> {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (!error && data.session && data.user) return { ok: true, session: data.session, userId: data.user.id }
  switch (authErrorKind(error)) {
    case "invalid_credentials":
      return { ok: false, status: 401, error: MESSAGES.wrong }
    case "not_confirmed":
      return { ok: false, status: 401, error: "Email này chưa được xác nhận. Mở thư 360dep đã gửi và bấm link xác nhận." }
    case "rate_limited":
      return { ok: false, status: 429, error: MESSAGES.tooMany }
    default:
      console.error("signInWithPassword failed:", error?.code, error?.message)
      return { ok: false, status: 500, error: MESSAGES.failed }
  }
}

/**
 * "Số điện thoại hoặc email" + password. A wrong number, an unknown email and a
 * wrong password all get the same answer.
 */
export async function signInWithIdentifier(client: AuthClient, identifier: string, password: string): Promise<SignedIn | Fail> {
  const id = parseIdentifier(identifier)
  if (id.kind === "invalid") return { ok: false, status: 400, error: MESSAGES.invalidIdentifier }
  if (!password) return { ok: false, status: 400, error: MESSAGES.noPassword }
  if (id.kind === "email") return passwordAttempt(client, id.email, password)

  // The number's account may have a real email by now. Asking first means one
  // Auth request per sign-in instead of a failed stand-in attempt and a retry,
  // which matters because Auth rate-limits by IP and all of these come from
  // this server. If the lookup is down, the stand-in is still worth a try.
  const found = await authEmailForPhone(id.phone)
  if (found.status === "none") return { ok: false, status: 401, error: MESSAGES.wrong }
  const email = found.status === "found" ? found.email : phoneEmail(id.phone)
  if (!email) return { ok: false, status: 401, error: MESSAGES.wrong }
  return passwordAttempt(client, email, password)
}

export type SignedUp = SignedIn & { kind: "phone" | "email" }

export async function signUpWithIdentifier(
  client: AuthClient,
  input: { identifier: string; password: string; fullName: string },
): Promise<SignedUp | Fail> {
  const checked = checkSignUp(input)
  if (!checked.ok) return { ok: false, status: 400, error: checked.error }
  const { id, password, fullName } = checked
  const taken = id.kind === "phone" ? MESSAGES.phoneTaken : MESSAGES.emailTaken

  // A second account for a number fails in the database (accounts_phone_key),
  // which Auth reports as "Database error saving new user". Say it properly first.
  if (id.kind === "phone") {
    const found = await authEmailForPhone(id.phone)
    if (found.status === "found") return { ok: false, status: 409, error: taken }
  }

  const { data, error } = await client.auth.signUp({
    email: id.kind === "phone" ? phoneEmail(id.phone) : id.email,
    password,
    options: { data: id.kind === "phone" ? { full_name: fullName, phone: id.phone } : { full_name: fullName } },
  })

  if (error) {
    switch (authErrorKind(error)) {
      case "user_exists":
        return { ok: false, status: 409, error: taken }
      case "db_error":
        // With a number, the one database rule a sign-up can break is the unique phone.
        if (id.kind === "phone") return { ok: false, status: 409, error: taken }
        break
      case "weak_password":
        return { ok: false, status: 400, error: "Mật khẩu này quá dễ đoán. Chọn mật khẩu khác." }
      case "email_invalid":
        if (id.kind === "email") return { ok: false, status: 400, error: "Email này không nhận được thư. Kiểm tra lại địa chỉ." }
        break
      case "rate_limited":
        return { ok: false, status: 429, error: MESSAGES.tooMany }
    }
    console.error("signUp failed:", id.kind, error.code, error.message)
    return { ok: false, status: 500, error: id.kind === "phone" ? "Chưa tạo được tài khoản bằng số điện thoại. Thử lại sau, hoặc dùng email." : MESSAGES.failed }
  }

  // With email confirmation on, an existing address comes back as a user with no identities.
  if (data.user && data.user.identities?.length === 0) return { ok: false, status: 409, error: taken }
  if (!data.session || !data.user) {
    // Only when "Confirm email" is turned on in Supabase; README says to keep it off.
    console.error("signUp returned no session: is email confirmation on?")
    return { ok: false, status: 202, error: "Đã tạo tài khoản nhưng chưa đăng nhập được. Thử đăng nhập lại sau ít phút." }
  }
  return { ok: true, session: data.session, userId: data.user.id, kind: id.kind }
}

export type ResetOutcome = { status: number; sent: boolean; masked?: string; message: string; noEmail?: boolean }

/**
 * "Quên mật khẩu": finds the account's real email and asks Supabase to mail a
 * reset link. The link lands on /dat-lai-mat-khau with the session in the URL
 * fragment (implicit flow), so it works in whichever browser opens the email,
 * not only the one that asked.
 */
export async function requestPasswordReset(identifier: string): Promise<ResetOutcome> {
  const id = parseIdentifier(identifier)
  if (id.kind === "invalid") return { status: 400, sent: false, message: MESSAGES.invalidIdentifier }

  let email: string
  let known = false
  if (id.kind === "email") {
    email = id.email
  } else {
    const found = await authEmailForPhone(id.phone)
    if (found.status === "unavailable") return { status: 503, sent: false, message: MESSAGES.failed }
    if (found.status === "none") return { status: 200, sent: false, message: "Chưa có tài khoản nào dùng số điện thoại này." }
    if (!found.email) return { status: 200, sent: false, noEmail: true, message: MESSAGES.noRecoveryEmail }
    email = found.email
    known = true
  }
  if (isPhoneEmail(email)) return { status: 200, sent: false, noEmail: true, message: MESSAGES.noRecoveryEmail }

  const { error } = await detachedAuthClient("implicit").auth.resetPasswordForEmail(email, {
    redirectTo: absoluteUrl("/dat-lai-mat-khau"),
  })
  if (error) {
    const kind = authErrorKind(error)
    if (kind === "rate_limited") return { status: 429, sent: false, message: "Đã gửi nhiều lần quá. Đợi một lúc rồi thử lại." }
    console.error("resetPasswordForEmail failed:", error.code, error.message)
    return { status: 502, sent: false, message: "Chưa gửi được email lúc này. Thử lại sau, hoặc liên hệ hỗ trợ." }
  }
  const masked = maskEmail(email)
  return {
    status: 200,
    sent: true,
    masked,
    // Supabase does not say whether an address has an account, so neither can we.
    message: known ? `Đã gửi link đặt lại mật khẩu tới ${masked}.` : `Nếu ${masked} có tài khoản 360dep, link đặt lại mật khẩu đã được gửi tới đó.`,
  }
}
