/**
 * While the marketplace still shows seeded sample profiles (the "Bản demo"
 * notice), their reviews are not real customers' words. They may be shown on
 * the page with that notice, but never handed to search engines as reviews.
 * Set NEXT_PUBLIC_SAMPLE_DATA=false once the seeded profiles are gone.
 */
export const SHOWING_SAMPLE_DATA = process.env.NEXT_PUBLIC_SAMPLE_DATA !== "false"
