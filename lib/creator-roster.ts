import type { Kol } from "@/lib/types"

/**
 * Public creator directory after the 2026-07-18 TikTok live audit.
 *
 * The historical 100-profile corpus remains available to editors, but only
 * current, reachable and beauty-relevant TikTok creators are public. This is
 * intentionally separate from evidence publication: being in the directory
 * never means a creator/product claim has been verified.
 */
export const ACTIVE_CREATOR_IDS = new Set([
  "1", "2", "4", "7", "10", "21", "23", "26", "28", "31", "33", "34",
  "37", "39", "41", "42", "50", "51", "52", "53", "55", "56", "63", "71",
  "74", "78", "79", "81", "86", "87", "89", "98", "101", "102", "103", "104",
])

export function isActivePublicCreator(creator: Pick<Kol, "id">) {
  return ACTIVE_CREATOR_IDS.has(creator.id)
}
