import * as React from "react"
import { rankScore, verticalOf, type CategoryId, type VerticalFilter } from "@/shared"
import { fromPrice, type AppPro, type AppWork } from "@/data/public"
import { useApp } from "./app"

/** What the customer can browse right now: listed people in the chosen city. */
export function useBrowse() {
  const { data, city, me, distanceTo, blocked } = useApp()
  return React.useMemo(() => {
    const pros = (data?.pros ?? []).filter((p) => p.published && (!city || p.city === city) && !blocked.has(p.uuid))
    const proIds = new Set(pros.map((p) => p.id))
    const works = (data?.works ?? []).filter((w) => proIds.has(w.proId))
    const proById = new Map((data?.pros ?? []).map((p) => [p.id, p]))
    const services = data?.services ?? []

    const photosOf = new Map<string, string[]>()
    for (const w of data?.works ?? []) {
      const list = photosOf.get(w.proId) ?? []
      if (list.length < 3 && w.images[0]) list.push(w.images[0])
      photosOf.set(w.proId, list)
    }

    const slugOfWork = new Map((data?.works ?? []).map((w) => [w.dbId, w]))
    const savedCategories = me.savedWorkIds.map((id) => slugOfWork.get(id)?.category).filter((c): c is CategoryId => Boolean(c))
    const followedSlugs = new Set(
      me.followedProIds.map((uuid) => data?.pros.find((p) => p.uuid === uuid)?.id).filter((s): s is string => Boolean(s)),
    )

    const inVertical = (p: AppPro, v: VerticalFilter) => v === "all" || p.categories.some((c) => verticalOf(c) === v)
    const worksIn = (v: VerticalFilter) => (v === "all" ? works : works.filter((w) => verticalOf(w.category) === v))

    /**
     * People for the "near you" block: taking bookings, nearest first when we
     * know the customer's address, otherwise by the same trust score as /pros.
     */
    const peopleFor = (v: VerticalFilter) =>
      pros
        .filter((p) => p.acceptingJobs && inVertical(p, v))
        .map((p) => ({ pro: p, km: distanceTo(p) }))
        .sort((a, b) => {
          if (a.km !== null && b.km !== null && a.km !== b.km) return a.km - b.km
          return rankScore(b.pro) - rankScore(a.pro)
        })

    return {
      pros,
      works,
      proById,
      services,
      photosOf,
      savedCategories,
      followedSlugs,
      inVertical,
      worksIn,
      peopleFor,
      priceOf: (proId: string, templateId?: string) => fromPrice(services, proId, templateId),
      /** A real photo for a category, for bubbles and occasion cards. */
      photoFor: (category: CategoryId): string | undefined =>
        (works.find((w) => w.category === category && w.images[0]) ?? data?.works.find((w) => w.category === category && w.images[0]))
          ?.images[0],
    }
  }, [data, city, me, distanceTo, blocked])
}

export type Browse = ReturnType<typeof useBrowse>
export type { AppWork }
