import { type Identifier, isPhoneEmail, parseIdentifier, passwordProblem } from "./identifier"

/**
 * The pure half of password sign-in: what a form may send, and what Supabase
 * Auth's answers mean in words a person can act on. No I/O here, so the web
 * form, the server actions and the JSON routes for the app agree, and the
 * rules are tested (tests/password-rules.test.ts).
 */

/** A sign-in or sign-up body is three short strings. Anything bigger is not a form. */
export const MAX_BODY_BYTES = 2048

/** bcrypt, which Supabase Auth uses, reads at most 72 bytes of a password. */
export const MAX_PASSWORD_LENGTH = 72

export const MESSAGES = {
  wrong: "Sai số điện thoại/email hoặc mật khẩu.",
  invalidIdentifier: "Nhập số di động Việt Nam hoặc email hợp lệ.",
  noPassword: "Nhập mật khẩu.",
  phoneTaken: "Số điện thoại này đã có tài khoản. Đăng nhập hoặc lấy lại mật khẩu.",
  emailTaken: "Email này đã có tài khoản. Đăng nhập hoặc lấy lại mật khẩu.",
  tooMany: "Bạn thử nhiều lần quá. Đợi vài phút rồi thử lại.",
  failed: "Chưa xử lý được. Vui lòng thử lại sau ít phút.",
  noRecoveryEmail: "Tài khoản này chưa có email. Liên hệ hỗ trợ để lấy lại mật khẩu.",
} as const

type Valid = Exclude<Identifier, { kind: "invalid" }>

export type SignUpField = "fullName" | "identifier" | "password"

export type CheckedSignUp =
  | { ok: true; id: Valid; password: string; fullName: string }
  | { ok: false; field: SignUpField; error: string }

/** A new password: long enough, not only digits, and within what bcrypt reads. */
export function newPasswordProblem(password: string): string | null {
  if (password.length > MAX_PASSWORD_LENGTH) return `Mật khẩu dài tối đa ${MAX_PASSWORD_LENGTH} ký tự.`
  return passwordProblem(password)
}

export function checkSignUp(input: { identifier: string; password: string; fullName: string }): CheckedSignUp {
  const fullName = input.fullName.trim().replace(/\s+/g, " ")
  if (fullName.length < 2) return { ok: false, field: "fullName", error: "Nhập họ tên của bạn." }
  if (fullName.length > 80) return { ok: false, field: "fullName", error: "Họ tên dài tối đa 80 ký tự." }

  const id = parseIdentifier(input.identifier)
  // The stand-in domain belongs to accounts made with a phone number; nobody signs up "as" one.
  if (id.kind === "invalid" || (id.kind === "email" && isPhoneEmail(id.email))) {
    return { ok: false, field: "identifier", error: MESSAGES.invalidIdentifier }
  }

  const problem = newPasswordProblem(input.password)
  if (problem) return { ok: false, field: "password", error: problem }
  return { ok: true, id, password: input.password, fullName }
}

export type AuthErrorKind =
  | "invalid_credentials"
  | "rate_limited"
  | "user_exists"
  | "weak_password"
  | "same_password"
  | "email_invalid"
  | "email_not_authorized"
  | "not_confirmed"
  | "reauth"
  | "db_error"
  | "other"

/**
 * Supabase Auth errors by meaning. Codes first (auth-js puts them on
 * `error.code`); messages only for the ones older servers send without a code.
 */
export function authErrorKind(error: { code?: string; status?: number; message?: string } | null | undefined): AuthErrorKind {
  if (!error) return "other"
  const code = error.code ?? ""
  const message = error.message ?? ""
  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) return "invalid_credentials"
  if (error.status === 429 || /^over_.*rate_limit$/.test(code)) return "rate_limited"
  if (code === "user_already_exists" || code === "email_exists" || /already (been )?registered/i.test(message)) return "user_exists"
  if (code === "weak_password") return "weak_password"
  if (code === "same_password") return "same_password"
  if (code === "email_address_invalid") return "email_invalid"
  if (code === "email_address_not_authorized") return "email_not_authorized"
  if (code === "email_not_confirmed") return "not_confirmed"
  if (code === "reauthentication_needed" || code === "reauthentication_not_valid") return "reauth"
  if (code === "unexpected_failure" || /database error saving new user/i.test(message)) return "db_error"
  return "other"
}

/**
 * A JSON body of at most MAX_BODY_BYTES that is an object, or why not.
 * `text` is the raw body; the byte count is what counts, not characters.
 */
export function parseSmallJson(text: string): { ok: true; body: Record<string, unknown> } | { ok: false; status: 400 | 413 } {
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { ok: false, status: 413 }
  try {
    const body: unknown = JSON.parse(text)
    if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, status: 400 }
    return { ok: true, body: body as Record<string, unknown> }
  } catch {
    return { ok: false, status: 400 }
  }
}

/** A string field of a parsed body, or "" when it is missing or not a string. */
export const stringField = (body: Record<string, unknown>, key: string) => {
  const value = body[key]
  return typeof value === "string" ? value : ""
}
