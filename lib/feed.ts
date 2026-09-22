import { verticalOf } from "./catalog"
import type { CategoryId, Pro, VerticalId, Work, WorkStats } from "./types"

/**
 * How the explore feed is ordered. Pure, so the web and the native app rank
 * the same way and the rules are testable (tests/feed.test.ts).
 *
 *   "for-you"   scored, then re-ordered so no one freelancer fills the screen
 *   "latest"    newest first, exactly the order people posted in
 *   "following" newest first, only people the customer follows
 *
 * Nothing here is paid for: position is never sold (see /chinh-sach).
 */
export type FeedTab = "for-you" | "latest" | "following"
export type VerticalFilter = VerticalId | "all"

export interface FeedContext {
  vertical: VerticalFilter
  /** Categories the customer chose, booked, or saved. Empty for a visitor. */
  interests: ReadonlySet<CategoryId>
  followed: ReadonlySet<string>
  /** Road distance from the customer's address; null when we don't know it. */
  distanceKm: (proId: string) => number | null
  stats: Readonly<Record<string, WorkStats>>
  now: Date
}

/** Starting weights. Tune them with real data, not by feel. */
export const WEIGHTS = {
  relevance: 3,
  near: 2,
  quality: 2,
  fresh: 1.5,
  appeal: 1.5,
  available: 1,
} as const

export const FRESH_HALF_LIFE_DAYS = 7
/** Below this many impressions, a save rate is noise: treat it as average. */
export const APPEAL_MIN_IMPRESSIONS = 200
/** A freelancer counts as new for this long after their profile goes up. */
export const NEW_PRO_DAYS = 14

/** No freelancer appears twice within this many consecutive cards. */
export const PRO_SPACING = 6
/** At most this many cards from one freelancer per page. */
export const PRO_PER_PAGE = 3
export const PAGE_SIZE = 24
/** No more than this many cards in a row from the same category. */
export const CATEGORY_RUN = 3
/** A new freelancer gets at least one card in every this many. */
export const NEW_PRO_EVERY = 12

/**
 * With few freelancers a feed of posts repeats the same faces and makes the
 * app look empty, so the home page leads with people instead.
 */
export const THIN_SUPPLY_PROS = 30
export const THIN_SUPPLY_WORKS = 150

export function supplyIsThin(pros: number, works: number) {
  return pros < THIN_SUPPLY_PROS || works < THIN_SUPPLY_WORKS
}

const DAY = 24 * 60 * 60 * 1000
const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/**
 * A rating pulled towards the average while it rests on few reviews, so one
 * five-star review does not outrank forty 4.8s.
 */
export function bayesRating(average: number, count: number, prior = 4.5, weight = 5) {
  if (count <= 0) return prior
  return (prior * weight + average * count) / (weight + count)
}

export function isNewPro(pro: Pick<Pro, "joinedAt">, now: Date) {
  const joined = Date.parse(pro.joinedAt)
  return Number.isFinite(joined) && now.getTime() - joined <= NEW_PRO_DAYS * DAY
}

export interface ScoreParts {
  relevance: number
  near: number
  quality: number
  fresh: number
  appeal: number
  available: number
  total: number
}

export function scoreWork(work: Work, pro: Pro, ctx: FeedContext): ScoreParts {
  const relevance = ctx.interests.size === 0 ? 0.5 : ctx.interests.has(work.category) ? 1 : 0

  const km = ctx.distanceKm(pro.id)
  // Unknown distance is neutral, not a penalty: most visitors have no address yet.
  const near = km === null ? 0.5 : km > pro.maxTravelKm && !pro.studioAddress ? 0 : clamp01(1 - km / Math.max(pro.maxTravelKm, 1))

  const rating = bayesRating(pro.rating.average, pro.rating.count)
  const quality = clamp01((rating - 3) / 2) * 0.7 + (pro.identity === "verified" ? 0.2 : 0) + clamp01(Math.log10(1 + pro.stats.completedJobs) / 2) * 0.1

  const created = Date.parse(work.createdAt)
  const ageDays = Number.isFinite(created) ? Math.max(0, (ctx.now.getTime() - created) / DAY) : 60
  const fresh = Math.pow(0.5, ageDays / FRESH_HALF_LIFE_DAYS)

  const s = ctx.stats[work.id]
  let appeal = 0.5
  if (s && s.impressions >= APPEAL_MIN_IMPRESSIONS) {
    // A booking click is worth more than a save, a save more than a look.
    const rate = (s.opens * 1 + s.saves * 3 + s.bookClicks * 6) / s.impressions
    appeal = clamp01(rate / 0.6)
  }

  const available = pro.acceptingJobs ? 1 : 0

  const total =
    WEIGHTS.relevance * relevance +
    WEIGHTS.near * near +
    WEIGHTS.quality * quality +
    WEIGHTS.fresh * fresh +
    WEIGHTS.appeal * appeal +
    WEIGHTS.available * available
  return { relevance, near, quality, fresh, appeal, available, total }
}

const newestFirst = (a: Work, b: Work) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id)

export function visibleWorks(works: readonly Work[], pros: ReadonlyMap<string, Pro>, vertical: VerticalFilter) {
  return works.filter((w) => {
    const pro = pros.get(w.proId)
    if (!pro || !pro.published) return false
    return vertical === "all" || verticalOf(w.category) === vertical
  })
}

export function rankFeed(works: readonly Work[], prosList: readonly Pro[], ctx: FeedContext, tab: FeedTab): Work[] {
  const pros = new Map(prosList.map((p) => [p.id, p]))
  const list = visibleWorks(works, pros, ctx.vertical)

  if (tab === "latest") return [...list].sort(newestFirst)
  if (tab === "following") return list.filter((w) => ctx.followed.has(w.proId)).sort(newestFirst)

  const scored = list
    .map((w) => ({ work: w, score: scoreWork(w, pros.get(w.proId)!, ctx).total }))
    .sort((a, b) => b.score - a.score || newestFirst(a.work, b.work))
    .map((x) => x.work)
  return diversify(scored, (proId) => {
    const pro = pros.get(proId)
    return pro ? isNewPro(pro, ctx.now) : false
  })
}

/**
 * Greedy re-order of a ranked list. Takes the best remaining card that breaks
 * none of the spacing rules; when every remaining card breaks one (few
 * freelancers), the rules relax in order rather than dropping content:
 * category run first, then the per-page cap, then spacing.
 */
export function diversify(ranked: readonly Work[], isNew: (proId: string) => boolean = () => false): Work[] {
  const pool = [...ranked]
  const out: Work[] = []

  const perPage = (proId: string) => {
    const pageStart = out.length - (out.length % PAGE_SIZE)
    let n = 0
    for (let i = pageStart; i < out.length; i++) if (out[i].proId === proId) n++
    return n
  }
  const spaced = (proId: string) => !out.slice(-(PRO_SPACING - 1)).some((w) => w.proId === proId)
  const categoryOk = (category: CategoryId) => {
    const tail = out.slice(-CATEGORY_RUN)
    return tail.length < CATEGORY_RUN || tail.some((w) => w.category !== category)
  }
  const newDue = () => {
    const window = out.slice(-(NEW_PRO_EVERY - 1))
    return out.length >= NEW_PRO_EVERY - 1 && !window.some((w) => isNew(w.proId))
  }

  const rules: ((w: Work) => boolean)[][] = [
    [(w) => spaced(w.proId), (w) => perPage(w.proId) < PRO_PER_PAGE, (w) => categoryOk(w.category)],
    [(w) => spaced(w.proId), (w) => perPage(w.proId) < PRO_PER_PAGE],
    [(w) => spaced(w.proId)],
    [],
  ]

  while (pool.length) {
    let index = -1
    if (newDue()) index = pool.findIndex((w) => isNew(w.proId) && spaced(w.proId))
    for (const set of rules) {
      if (index !== -1) break
      index = pool.findIndex((w) => set.every((ok) => ok(w)))
    }
    out.push(pool.splice(index === -1 ? 0 : index, 1)[0])
  }
  return out
}

/**
 * The categories a person has shown interest in, from what they did, most
 * telling first: chose it, booked it, saved it.
 */
export function interestsFrom(input: {
  chosen: readonly CategoryId[]
  booked: readonly CategoryId[]
  saved: readonly CategoryId[]
}): Set<CategoryId> {
  return new Set([...input.chosen, ...input.booked, ...input.saved])
}
