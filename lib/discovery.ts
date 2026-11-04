import { CATEGORIES, getTemplate } from "./catalog"
import { bayesianRating, rankScore } from "./trust"
import type { Category, CategoryId, Pro } from "./types"

/**
 * How customers find a person. Every category stays open, but Nail and Makeup
 * are what most customers come for, so they come first and the list of people
 * opens on Nail.
 */
export const PRIORITY_CATEGORIES: readonly CategoryId[] = ["nail", "makeup"]
export const DEFAULT_CATEGORY: CategoryId = "nail"

/** The same categories with Nail and Makeup moved to the front; the rest keep their order. */
export function priorityFirst<T extends Pick<Category, "id">>(categories: readonly T[]): T[] {
  const rank = (c: T) => {
    const i = PRIORITY_CATEGORIES.indexOf(c.id)
    return i === -1 ? PRIORITY_CATEGORIES.length : i
  }
  return categories.map((c, order) => ({ c, order })).sort((a, b) => rank(a.c) - rank(b.c) || a.order - b.order).map((x) => x.c)
}

/**
 * A short row of category tiles (lib/offers.ts categoryRow) with Nail and
 * Makeup at the front. The row keeps its length; a category chosen from
 * further down still takes the last place, so the choice stays in sight.
 */
export function pinPriority<T extends Pick<Category, "id">>(
  tiles: { ordered: T[]; row: T[]; more: boolean },
  selected: CategoryId | "all",
): { ordered: T[]; row: T[] } {
  const ordered = priorityFirst(tiles.ordered)
  if (!tiles.more) return { ordered, row: ordered }
  const row = ordered.slice(0, tiles.row.length)
  const chosen = ordered.find((c) => c.id === selected)
  if (chosen && !row.includes(chosen)) row[row.length - 1] = chosen
  return { ordered, row }
}

/** The radii a customer can filter by, in km. */
export const RADII_KM = [3, 5, 10] as const
export type RadiusKm = (typeof RADII_KM)[number]

export const isRadius = (value: unknown): value is RadiusKm => RADII_KM.some((r) => r === value)

/**
 * Whether a person is inside the radius. An unknown distance (another city, or
 * a district not on the map) is outside: we do not show someone as "within
 * 3 km" without knowing it.
 */
export const withinRadius = (km: number | null, radius: RadiusKm | null) => radius === null || (km !== null && km <= radius)

/**
 * A portfolio split into albums, one per category, Nail and Makeup first and
 * the rest in catalogue order. A work's category is its catalogue service's.
 */
export function albumsOf<W extends { templateId: string; category: CategoryId }>(works: readonly W[]): { category: CategoryId; works: W[] }[] {
  const by = new Map<CategoryId, W[]>()
  for (const w of works) {
    const category = getTemplate(w.templateId)?.category ?? w.category
    by.set(category, [...(by.get(category) ?? []), w])
  }
  return priorityFirst(CATEGORIES.filter((c) => by.has(c.id))).map((c) => ({ category: c.id, works: by.get(c.id)! }))
}

/** How a customer can line up the people on the list. */
export type ArtistSort = "near" | "popular" | "rated" | "new"

export const ARTIST_SORTS: readonly { id: ArtistSort; label: string }[] = [
  { id: "near", label: "Gần nhất" },
  { id: "popular", label: "Đặt nhiều" },
  { id: "rated", label: "Đánh giá cao" },
  { id: "new", label: "Artist mới" },
]

const NEW_ARTIST_DAYS = 45

/** Joined in the last weeks, or still waiting for a first completed job. */
export function isNewArtist(pro: Pick<Pro, "joinedAt" | "stats">, now = Date.now()) {
  if (pro.stats.completedJobs === 0) return true
  return now - Date.parse(pro.joinedAt) < NEW_ARTIST_DAYS * 24 * 60 * 60 * 1000
}

/**
 * The list in the chosen order. "Artist mới" keeps only new people, the most
 * recent first. Without a distance someone goes after those who have one.
 */
export function sortArtists<T extends { pro: Pro; km: number | null }>(list: readonly T[], sort: ArtistSort, now = Date.now()): T[] {
  const trust = (a: T, b: T) => rankScore(b.pro) - rankScore(a.pro)
  const nearest = (a: T, b: T) => (a.km ?? Infinity) - (b.km ?? Infinity)
  if (sort === "new") {
    return list.filter((p) => isNewArtist(p.pro, now)).sort((a, b) => b.pro.joinedAt.localeCompare(a.pro.joinedAt) || nearest(a, b) || trust(a, b))
  }
  const by: Record<Exclude<ArtistSort, "new">, (a: T, b: T) => number> = {
    near: (a, b) => nearest(a, b) || trust(a, b),
    popular: (a, b) => b.pro.stats.completedJobs - a.pro.stats.completedJobs || trust(a, b),
    rated: (a, b) => bayesianRating(b.pro.rating) - bayesianRating(a.pro.rating) || b.pro.stats.completedJobs - a.pro.stats.completedJobs,
  }
  return [...list].sort(by[sort])
}
