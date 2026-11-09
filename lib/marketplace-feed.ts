import { CATALOG, getTemplate } from "./catalog"
import { isSpa, listingLocationOpen, providerLocationOpen } from "./launch"
import { listedOptions } from "./offers"
import type { Pro, ProService, Work } from "./types"

export function featuredOption(templateId: string, prices: ProService["prices"], studioOpen = false, variantId?: string) {
  const template = getTemplate(templateId)
  if (!template || template.addon) return undefined
  const options = listedOptions(template, prices, studioOpen)
  return variantId
    ? options.find((o) => o.variant.id === variantId)
    : options.sort((a, b) => a.minimumTotal - b.minimumTotal || a.durationMin - b.durationMin)[0]
}

export function marketplaceFeed(input: {
  pros: readonly Pro[]; works: readonly Work[]; services: readonly ProService[]
  city?: string | null; studioOpen?: boolean; following?: ReadonlySet<string>
}) {
  const people = new Map(input.pros.filter((p) =>
    p.published && !isSpa(p) && providerLocationOpen(p, input.studioOpen) &&
    (!input.city || p.city === input.city) && (!input.following || input.following.has(p.id)),
  ).map((p) => [p.id, p]))
  const works = new Map<string, Work[]>()
  for (const w of input.works) {
    if (w.hiddenReason || !people.has(w.proId)) continue
    const key = w.proId + "/" + w.templateId
    const list = works.get(key) ?? []
    list.push(w)
    works.set(key, list)
  }
  const pool = input.services.flatMap((listing) => {
    const pro = people.get(listing.proId)
    const template = getTemplate(listing.templateId)
    const option = listing.active && featuredOption(listing.templateId, listing.prices, input.studioOpen)
    if (!pro || !template || !option || !listingLocationOpen(template, pro, input.studioOpen)) return []
    const portfolio = works.get(pro.id + "/" + template.id) ?? []
    const tiles = portfolio.length ? portfolio : [null]
    return tiles.map((work) => ({
      id: work?.id ?? listing.id, pro, template, option, work,
      photo: work?.images[work.kind === "before_after" && work.images[1] ? 1 : 0],
    }))
  }).sort((a, b) =>
    Number(b.pro.acceptingJobs) - Number(a.pro.acceptingJobs) ||
    Number(Boolean(b.photo)) - Number(Boolean(a.photo)) ||
    (b.work?.createdAt ?? "").localeCompare(a.work?.createdAt ?? ""),
  )

  // Three makeup spots for each editorial row pair, while avoiding repeats
  // where there are enough distinct providers. No fake work to fill gaps.
  const result: typeof pool = []
  const seen = new Set<string>()
  const makeup = pool.filter((x) => x.template.category === "makeup")
  const other = pool.filter((x) => x.template.category !== "makeup")
  while (makeup.length || other.length) {
    const preferred = result.length % 4 === 3 ? other : makeup
    const fallback = preferred === makeup ? other : makeup
    const recent = result.slice(-3)
    const available = (x: typeof pool[number]) => !recent.some((r) => r.pro.id === x.pro.id)
    const queue = preferred.some(available) ? preferred : fallback.some(available) ? fallback : preferred.length ? preferred : fallback
    const index = queue.findIndex(available)
    const [entry] = queue.splice(index < 0 ? 0 : index, 1)
    if (!seen.has(entry.id)) { seen.add(entry.id); result.push(entry) }
  }
  return result
}
export type MarketplaceTile = ReturnType<typeof marketplaceFeed>[number]

/** Editorial starting points when there aren't enough local portfolios yet. */
export function editorialTemplates(exclude: ReadonlySet<string>, studioOpen = false) {
  return ["makeup-party", "makeup-bridal", "makeup-daily", "nail-gel"].flatMap((id) => {
    const template = CATALOG.find((t) => t.id === id)
    return template && !exclude.has(id) && (!template.studioOnly || studioOpen) ? [template] : []
  })
}
