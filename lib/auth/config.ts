/**
 * Whether a real one-time code can be sent.
 *
 * Supabase Auth needs an SMS provider (Twilio, Vonage, or a Vietnamese Zalo ZNS
 * relay) before signInWithOtp does anything. Until one is configured the login
 * screen must say that no code was sent, rather than show a code field that
 * silently accepts anything.
 */
export const otpEnabled = process.env.SUPABASE_SMS_PROVIDER_READY === "true"
