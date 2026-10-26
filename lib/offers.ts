import { providerLocationOpen, serviceLocationOpen } from "./launch"
import { CATALOG, serviceDuration, serviceQuantity, verticalOf } from "./catalog"
import type { VerticalFilter } from "./feed"
import type { Category, CategoryId, Pro, ProService, ServiceTemplate, ServiceVariant, Work } from "./types"

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
  /** The offered option supplying the starting price, with its real minimum booking. */
  variant: ServiceVariant
  minimumQuantity: number
  minimumTotal: number
  durationMin: number
  /** A real photo of this service, if anyone has posted one. */
  photo?: string
}

export function listedOptions(template: ServiceTemplate, prices: Readonly<Record<string, number>>, studioBookingOpen = false) {
  if (!serviceLocationOpen(template, studioBookingOpen)) return []
  return template.variants.flatMap((variant) => {
    const unitPrice = prices[variant.id]
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return []
    const minimumQuantity = serviceQuantity(variant)
    return [{ variant, unitPrice, minimumQuantity, minimumTotal: unitPrice * minimumQuantity, durationMin: serviceDuration(variant, minimumQuantity) }]
  })
}

export function serviceOffers(input: {
  studioBookingOpen?: boolean
  pros: readonly Pro[]
  proServices: readonly ProService[]
  works: readonly Work[]
  city: string | null
  vertical: VerticalFilter
  proFilter?: (pro: Pro) => boolean
  priceFilter?: (minimumTotal: number) => boolean
}): ServiceOffer[] {
  const inScope = new Map(
    input.pros.filter((p) => providerLocationOpen(p, input.studioBookingOpen) && p.published && p.acceptingJobs && (!input.city || p.city === input.city) && (!input.proFilter || input.proFilter(p))).map((p) => [p.id, p]),
  )

  const byTemplate = new Map<string, { pros: Pro[]; options: ReturnType<typeof listedOptions> }>()
  for (const listing of input.proServices) {
    const pro = inScope.get(listing.proId)
    const template = CATALOG.find((t) => t.id === listing.templateId)
    if (!pro || !template || !listing.active) continue
    const options = listedOptions(template, listing.prices, input.studioBookingOpen).filter((option) => !input.priceFilter || input.priceFilter(option.minimumTotal))
    if (!options.length) continue
    const entry = byTemplate.get(listing.templateId) ?? { pros: [], options: [] }
    if (!entry.pros.some((p) => p.id === pro.id)) entry.pros.push(pro)
    entry.options.push(...options)
    byTemplate.set(listing.templateId, entry)
  }

  // A service's own work from eligible providers first. Without
  // any, it may borrow real work from its category -- but never a photo
  // another card already shows, or two services look like the same thing.
  const coverOf = (w: Work) => (w.kind === "before_after" ? (w.images[1] ?? w.images[0]) : w.images[0])
  const ownPhoto = (template: ServiceTemplate, pros: Pro[]) => {
    const work = input.works.find((w) => w.templateId === template.id && pros.some((p) => p.id === w.proId) && w.images[0])
    return work ? coverOf(work) : undefined
  }

  const offers = CATALOG.map((template, order) => ({ template, order, entry: byTemplate.get(template.id) }))
    .filter((x) => x.entry && (input.vertical === "all" || verticalOf(x.template.category) === input.vertical))
    .sort((a, b) => b.entry!.pros.length - a.entry!.pros.length || a.order - b.order)
    .map(({ template, entry }) => {
      const start = [...entry!.options].sort((a, b) => a.minimumTotal - b.minimumTotal || a.durationMin - b.durationMin)[0]
      return { template, pros: entry!.pros, fromPrice: start.unitPrice, variant: start.variant, minimumQuantity: start.minimumQuantity, minimumTotal: start.minimumTotal, durationMin: start.durationMin, photo: ownPhoto(template, entry!.pros) }
    })

  const used = new Set(offers.map((o) => o.photo).filter(Boolean))
  for (const offer of offers) {
    if (offer.photo) continue
    const borrowed = input.works
      .filter((w) => w.category === offer.template.category && offer.pros.some((p) => p.id === w.proId) && w.images[0])
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

/** Sort by the nearest provider actually eligible for this offer; unknown distances stay last. */
export function sortServiceOffers(
  offers: readonly ServiceOffer[],
  sort: "match" | "price" | "near",
  distanceTo: (proId: string) => number | null,
): ServiceOffer[] {
  if (sort === "price") return [...offers].sort((a, b) => a.minimumTotal - b.minimumTotal)
  if (sort !== "near") return [...offers]
  const ranked = offers.map((offer) => ({
    offer,
    distance: Math.min(...offer.pros.map((pro) => distanceTo(pro.id) ?? Number.POSITIVE_INFINITY)),
  }))
  return ranked.sort((a, b) => a.distance === b.distance ? 0 : a.distance - b.distance).map(({ offer }) => offer)
}
