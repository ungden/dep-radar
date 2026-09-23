import { toE164 } from "./phone"

/**
 * What someone types to sign in: a phone number or an email address.
 *
 * Supabase Auth keys password accounts by email. An account created with a
 * phone number gets a stand-in address built from that number
 * (84912345678@sdt.360dep.vn) until the person adds a real email; after that
 * the real one is the auth email and the number is looked up server-side
 * (app/api/auth/*). Shared by the web and the app, so both parse the same way.
 */

/** The domain of stand-in addresses. Never receives mail. */
export const PHONE_EMAIL_DOMAIN = "sdt.360dep.vn"

export const MIN_PASSWORD_LENGTH = 8

export type Identifier = { kind: "phone"; phone: string } | { kind: "email"; email: string } | { kind: "invalid" }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function parseIdentifier(input: string): Identifier {
  const text = input.trim()
  if (text.includes("@")) return EMAIL.test(text) ? { kind: "email", email: text.toLowerCase() } : { kind: "invalid" }
  const phone = toE164(text)
  return phone ? { kind: "phone", phone } : { kind: "invalid" }
}

/** The stand-in auth email of an account created with this phone number (E.164). */
export const phoneEmail = (e164: string) => `${e164.replace(/\D/g, "")}@${PHONE_EMAIL_DOMAIN}`

/** True for a stand-in address: the account has no real email to recover a password through yet. */
export const isPhoneEmail = (email: string | null | undefined) =>
  Boolean(email && email.toLowerCase().endsWith(`@${PHONE_EMAIL_DOMAIN}`))

/** Shown instead of the address itself: a***@gmail.com. */
export function maskEmail(email: string) {
  const [name, domain] = email.split("@")
  if (!domain) return email
  return `${name.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(5, name.length - 1)))}@${domain}`
}

/** Why a new password is refused, or null. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`
  if (/^\d+$/.test(password)) return "Mật khẩu không nên chỉ có số."
  return null
}
