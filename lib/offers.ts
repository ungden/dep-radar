import { CATALOG, verticalOf } from "./catalog"
import type { VerticalFilter } from "./feed"
import type { Pro, ProService, ServiceTemplate, Work } from "./types"

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

  // Prefer work by someone the customer can book, then any work of this
  // service, then real work in the same category; a before/after shows its "after".
  const photoOf = (template: ServiceTemplate) => {
    const work =
      input.works.find((w) => w.templateId === template.id && inScope.has(w.proId) && w.images[0]) ??
      input.works.find((w) => w.templateId === template.id && w.images[0]) ??
      input.works.find((w) => w.category === template.category && inScope.has(w.proId) && w.images[0])
    return work ? (work.kind === "before_after" ? (work.images[1] ?? work.images[0]) : work.images[0]) : undefined
  }

  return CATALOG.map((template, order) => ({ template, order, entry: byTemplate.get(template.id) }))
    .filter((x) => x.entry && (input.vertical === "all" || verticalOf(x.template.category) === input.vertical))
    .sort((a, b) => b.entry!.pros.length - a.entry!.pros.length || a.order - b.order)
    .map(({ template, entry }) => ({
      template,
      pros: entry!.pros,
      fromPrice: Math.min(...entry!.prices),
      photo: photoOf(template),
    }))
}
