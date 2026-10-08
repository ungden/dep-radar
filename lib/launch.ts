/**
 * Launch switch. While the seeded demo freelancers, customers, works and
 * reviews are live, the site says so (home banner, footer, /chinh-sach). On
 * launch day: run supabase/scripts/remove-demo-data.sql, then set this to false
 * and deploy. See docs/launch.md.
 */
export const DEMO_DATA_LIVE = true

/**
 * Identity verification (CCCD front and back + a portrait holding the card,
 * app/api/identity). Built and tested on 08/10/2026, then held back by the
 * owner the same day ("khoan cần KYC thật, sau này bật sau"): partners onboard
 * without it; model services and casting calls stay closed until it opens.
 * When on, AI decides the clear cases; the uncertain ones wait for the staff
 * (Admin › Xác minh), with their photos kept privately until decided. The hash
 * salt is IDENTITY_HASH_SALT, or derived from the service role key when unset.
 * Turning it on: set this to true, and IDENTITY_IN_APP in
 * apps/mobile/src/app/ho-so-doi-tac.tsx for the next app build.
 */
export const IDENTITY_VERIFICATION_OPEN = false

/**
 * The support Zalo, for the help centre's written answers (lib/help/knowledge.ts).
 * Buttons read the live one from Admin › Cấu hình (platform_settings.support_zalo);
 * change both together.
 */
export const SUPPORT_ZALO = "0987220101"

/**
 * Partners verify their identity before their profile is shown (owner, 08/10/2026):
 * the profile review asks for it (lib/ai/rules.ts). False makes it optional again
 * (a badge and the model services only).
 */
export const IDENTITY_REQUIRED_FOR_PARTNERS = IDENTITY_VERIFICATION_OPEN && true
