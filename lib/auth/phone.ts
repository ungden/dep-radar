/**
 * Vietnamese phone numbers, one canonical form.
 *
 * Accounts are keyed by phone number, so "0968 112 233", "+84968112233" and
 * "84968112233" have to be the same account or two people can end up owning the
 * same identity.
 */

const DIGITS = /\D/g

/** E.164, e.g. +84968112233. Returns null when it is not a usable VN number. */
export function toE164(input: string): string | null {
  let digits = input.replace(DIGITS, "")
  if (digits.startsWith("0084")) digits = digits.slice(4)
  else if (digits.startsWith("84") && digits.length >= 11) digits = digits.slice(2)
  else if (digits.startsWith("0")) digits = digits.slice(1)
  // Mobile numbers are 9 digits after the country code (3x, 5x, 7x, 8x, 9x).
  if (!/^[35789]\d{8}$/.test(digits)) return null
  return `+84${digits}`
}

/** How a Vietnamese reader expects to see it: 0968 112 233. */
export function formatPhone(e164OrLocal: string): string {
  const e164 = e164OrLocal.startsWith("+") ? e164OrLocal : toE164(e164OrLocal)
  if (!e164) return e164OrLocal
  const local = `0${e164.slice(3)}`
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
}

export const isValidPhone = (input: string) => toE164(input) !== null
