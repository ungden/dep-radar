/**
 * Launch switch. While the seeded demo freelancers, customers, works and
 * reviews are live, the site says so (home banner, footer, /chinh-sach). On
 * launch day: run supabase/scripts/remove-demo-data.sql, then set this to false
 * and deploy. See docs/launch.md.
 */
export const DEMO_DATA_LIVE = true

/**
 * Identity verification (CCCD + selfie, app/api/identity) opens later, once
 * there are enough partners for the tick to mean something. While false, the
 * studio does not ask partners to photograph their ID, says the step opens
 * later, and the API refuses before any image is read. Model services and
 * casting calls stay locked, since they require a verified identity.
 * To open: set IDENTITY_HASH_SALT (and GEMINI_API_KEY) on Vercel, set this to
 * true, deploy. See docs/launch.md.
 */
export const IDENTITY_VERIFICATION_OPEN = false
