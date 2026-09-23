import { CATALOG, verticalOf } from "./catalog"
import type { VerticalFilter } from "./feed"
import type { Category, CategoryId, Pro, ProService, ServiceTemplate, Work } from "./types"

/**
 * What the home page sells: catalogue services that somebody near the
 * customer actually offers, with the real lowest price and a real photo.
 * Pure, so the web and the native app list the same things.
 *
 * A service nobody offers in the city is not shown: a card that cannot be
 * booked is an advert for nothing.
 */
export interface ServiceOffer {
  template: ServiceTemplate
  /** Published freelancers in scope who list it and are taking bookings. */
  pros: Pro[]
  /** Lowest listed price among them, for the cheapest option. */
  fromPrice: number
  /** A real photo of this service, if anyone has posted one. */
  photo?: string
}

export function serviceOffers(input: {
  pros: readonly Pro[]
  proServices: readonly ProService[]
  works: readonly Work[]
  city: string | null
  vertical: VerticalFilter
}): ServiceOffer[] {
  const inScope = new Map(
    input.pros.filter((p) => p.published && p.acceptingJobs && (!input.city || p.city === input.city)).map((p) => [p.id, p]),
  )

  const byTemplate = new Map<string, { pros: Pro[]; prices: number[] }>()
  for (const listing of input.proServices) {
    const pro = inScope.get(listing.proId)
    const prices = Object.values(listing.prices)
    if (!pro || !listing.active || !prices.length) continue
    const entry = byTemplate.get(listing.templateId) ?? { pros: [], prices: [] }
    if (!entry.pros.some((p) => p.id === pro.id)) entry.pros.push(pro)
    entry.prices.push(...prices)
    byTemplate.set(listing.templateId, entry)
  }

  // A service's own work first (by someone bookable, then anyone). Without
  // any, it may borrow real work from its category -- but never a photo
  // another card already shows, or two services look like the same thing.
  const coverOf = (w: Work) => (w.kind === "before_after" ? (w.images[1] ?? w.images[0]) : w.images[0])
  const ownPhoto = (template: ServiceTemplate) => {
    const work =
      input.works.find((w) => w.templateId === template.id && inScope.has(w.proId) && w.images[0]) ??
      input.works.find((w) => w.templateId === template.id && w.images[0])
    return work ? coverOf(work) : undefined
  }

  const offers = CATALOG.map((template, order) => ({ template, order, entry: byTemplate.get(template.id) }))
    .filter((x) => x.entry && (input.vertical === "all" || verticalOf(x.template.category) === input.vertical))
    .sort((a, b) => b.entry!.pros.length - a.entry!.pros.length || a.order - b.order)
    .map(({ template, entry }) => ({
      template,
      pros: entry!.pros,
      fromPrice: Math.min(...entry!.prices),
      photo: ownPhoto(template),
    }))

  const used = new Set(offers.map((o) => o.photo).filter(Boolean))
  for (const offer of offers) {
    if (offer.photo) continue
    const borrowed = input.works
      .filter((w) => w.category === offer.template.category && inScope.has(w.proId) && w.images[0])
      .map(coverOf)
      .find((src) => src && !used.has(src))
    if (borrowed) {
      offer.photo = borrowed
      used.add(borrowed)
    }
  }
  return offers
}

/**
 * The one row of category tiles on the home page. Twelve tiles in three rows
 * pushed the services off the first screen, so the row holds `size` tiles:
 * the categories with the most on offer here, then the ones coming soon, and
 * a last "Xem thêm" tile that opens the rest. A category chosen from the rest
 * takes the last place, so the choice stays in sight.
 */
export function categoryRow(
  categories: readonly Category[],
  offers: readonly ServiceOffer[],
  selected: CategoryId | "all",
  size = 5,
): { ordered: Category[]; row: Category[]; more: boolean; offered: Set<CategoryId> } {
  const count = new Map<CategoryId, number>()
  for (const o of offers) count.set(o.template.category, (count.get(o.template.category) ?? 0) + 1)
  const ordered = categories
    .map((c, order) => ({ c, order, n: count.get(c.id) ?? 0 }))
    .sort((a, b) => b.n - a.n || a.order - b.order)
    .map((x) => x.c)
  const offered = new Set(count.keys())
  if (ordered.length <= size) return { ordered, row: ordered, more: false, offered }
  const row = ordered.slice(0, size - 1)
  const chosen = ordered.find((c) => c.id === selected)
  if (chosen && !row.includes(chosen)) row[row.length - 1] = chosen
  return { ordered, row, more: true, offered }
}
