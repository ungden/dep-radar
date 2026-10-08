import { getTemplate, tierLabels } from "./catalog"
import type { CategoryId, ProService, ServiceVariant } from "./types"

/**
 * Price levels. Every catalogue option has three prices, "Cơ bản",
 * "Chuyên nghiệp" and "Master" (lib/catalog.ts), and a partner picks one of
 * them for each package they list. Nobody approves a level: it is the price the
 * partner chose, not a certificate (PRICE_LEVEL_NOTE says so to customers).
 */
export type Level = 0 | 1 | 2

export const LEVELS: readonly Level[] = [0, 1, 2]

export const levelName = (level: Level) => tierLabels()[level]

export const isLevel = (value: unknown): value is Level => value === 0 || value === 1 || value === 2

/**
 * Which of an option's levels a listed price is. Null for a price that is not
 * one of them (set before levels existed): better no label than a wrong one.
 */
export function levelOfPrice(variant: Pick<ServiceVariant, "tiers">, price: number): Level | null {
  const i = variant.tiers.indexOf(price)
  return isLevel(i) ? i : null
}

type Listing = Pick<ProService, "proId" | "templateId" | "prices" | "active">

/** Every price a person lists in a category, with its catalogue option. */
function packagesIn(listings: readonly Listing[], proId: string, category: CategoryId) {
  const out: { variant: ServiceVariant; price: number }[] = []
  for (const l of listings) {
    if (l.proId !== proId || !l.active) continue
    const tpl = getTemplate(l.templateId)
    if (!tpl || tpl.category !== category) continue
    for (const [variantId, price] of Object.entries(l.prices)) {
      const variant = tpl.variants.find((v) => v.id === variantId)
      if (variant) out.push({ variant, price })
    }
  }
  return out
}

/**
 * A person's level in a category: the level they picked most often across the
 * packages they list there; a tie goes to the higher level. Null when they list
 * nothing there, or nothing at a catalogue level.
 */
export function proLevelIn(listings: readonly Listing[], proId: string, category: CategoryId): Level | null {
  const count = [0, 0, 0]
  for (const { variant, price } of packagesIn(listings, proId, category)) {
    const level = levelOfPrice(variant, price)
    if (level !== null) count[level]++
  }
  let best: Level | null = null
  for (const level of LEVELS) if (count[level] > 0 && (best === null || count[level] >= count[best])) best = level
  return best
}

/** The lowest price a person lists in a category ("Từ ..."), or null. */
export function fromPriceIn(listings: readonly Listing[], proId: string, category: CategoryId): number | null {
  const prices = packagesIn(listings, proId, category).map((p) => p.price)
  return prices.length ? Math.min(...prices) : null
}

/**
 * The category a person mostly works in: the one with the most listed
 * packages, ties going to the order of their own categories. Null when they
 * list nothing.
 */
export function mainCategory(listings: readonly Listing[], pro: { id: string; categories: readonly CategoryId[] }): CategoryId | null {
  let best: CategoryId | null = null
  let bestCount = 0
  for (const c of pro.categories) {
    const n = packagesIn(listings, pro.id, c).length
    if (n > bestCount) {
      best = c
      bestCount = n
    }
  }
  return best
}
