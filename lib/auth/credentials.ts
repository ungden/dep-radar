import { toE164 } from "./phone"

/**
 * What a person types to sign in. One box takes either a phone number or an
 * email address: the phone number is what people here remember, the email is
 * what a forgotten password is recovered through.
 */
export type Identifier = { kind: "phone"; phone: string } | { kind: "email"; email: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmail(input: string): boolean {
  return EMAIL.test(input.trim())
}

/** Null when it is neither a usable email nor a Vietnamese mobile number. */
export function parseIdentifier(input: string): Identifier | null {
  const value = input.trim()
  if (value.includes("@")) return isEmail(value) ? { kind: "email", email: value.toLowerCase() } : null
  const phone = toE164(value)
  return phone ? { kind: "phone", phone } : null
}

/** Supabase Auth hashes with bcrypt, which reads at most 72 bytes. */
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.`
  if (new TextEncoder().encode(password).length > PASSWORD_MAX) return `Mật khẩu dài quá ${PASSWORD_MAX} ký tự.`
  return null
}

/** Only same-site paths, so a crafted link cannot bounce someone to another site. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}

/**
 * Set by /auth/confirm when a password-reset link opens a session, for fifteen
 * minutes, and required by setNewPassword(). Without it, any signed-in session
 * could set a new password without knowing the current one.
 */
export const RESET_COOKIE = "dep360_pw_reset"
export const RESET_COOKIE_MAX_AGE = 15 * 60
