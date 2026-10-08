import { describe, expect, it } from "vitest"
import { CATEGORIES, getVariant, tierLabels } from "@/lib/catalog"
import { albumsOf, isRadius, pinPriority, priorityFirst, withinRadius } from "@/lib/discovery"
import { DISTRICT_COORDS, MIN_ROAD_KM, cityOfPoint, distanceFromPointKm, isLatLng, travelDistanceKm, type LatLng } from "@/lib/geo"
import { fromPriceIn, levelName, levelOfPrice, mainCategory, proLevelIn } from "@/lib/levels"
import type { ProService } from "@/lib/types"

// nail-gel/hand levels: 120k, 160k, 220k; nail-design/simple: see the catalogue.
const tier = (templateId: string, variantId: string, level: 0 | 1 | 2) => getVariant(templateId, variantId)!.tiers[level]

const listing = (proId: string, templateId: string, prices: Record<string, number>, active = true): ProService => ({
  id: `${proId}:${templateId}`,
  proId,
  templateId,
  prices,
  active,
})

describe("price levels", () => {
  it("names the three levels like the catalogue", () => {
    expect([0, 1, 2].map((l) => levelName(l as 0 | 1 | 2))).toEqual(tierLabels())
    expect(levelName(2)).toBe("Master")
  })

  it("reads a listed price as its level, and a price off the levels as none", () => {
    const v = getVariant("nail-gel", "hand")!
    expect(levelOfPrice(v, v.tiers[0])).toBe(0)
    expect(levelOfPrice(v, v.tiers[2])).toBe(2)
    expect(levelOfPrice(v, v.tiers[0] + 5000)).toBeNull()
  })

  it("takes the level picked most often in the category", () => {
    const listings = [
      listing("a", "nail-gel", { hand: tier("nail-gel", "hand", 2), "hand-foot": tier("nail-gel", "hand-foot", 2) }),
      listing("a", "nail-design", { simple: tier("nail-design", "simple", 0) }),
      // Another category does not count towards Nail.
      listing("a", "makeup-daily", { single: tier("makeup-daily", "single", 0) }),
    ]
    expect(proLevelIn(listings, "a", "nail")).toBe(2)
    expect(proLevelIn(listings, "a", "makeup")).toBe(0)
  })

  it("breaks a tie towards the higher level", () => {
    const listings = [
      listing("a", "nail-gel", { hand: tier("nail-gel", "hand", 0) }),
      listing("a", "nail-design", { simple: tier("nail-design", "simple", 1) }),
    ]
    expect(proLevelIn(listings, "a", "nail")).toBe(1)
  })

  it("is null without packages there, and ignores other people, paused services and off-level prices", () => {
    const listings = [
      listing("a", "nail-gel", { hand: tier("nail-gel", "hand", 0) + 5000 }),
      listing("a", "nail-design", { simple: tier("nail-design", "simple", 2) }, false),
      listing("b", "nail-gel", { hand: tier("nail-gel", "hand", 2) }),
    ]
    expect(proLevelIn(listings, "a", "nail")).toBeNull()
    expect(proLevelIn(listings, "a", "makeup")).toBeNull()
    expect(proLevelIn(listings, "b", "nail")).toBe(2)
  })

  it("gives the starting price of one category only", () => {
    const listings = [
      listing("a", "nail-gel", { hand: 160_000, "hand-foot": 300_000 }),
      listing("a", "makeup-daily", { single: 90_000 }),
    ]
    expect(fromPriceIn(listings, "a", "nail")).toBe(160_000)
    expect(fromPriceIn(listings, "a", "makeup")).toBe(90_000)
    expect(fromPriceIn(listings, "a", "hair")).toBeNull()
  })

  it("finds the main category by listed packages, ties by the person's own order", () => {
    const listings = [
      listing("a", "makeup-daily", { single: tier("makeup-daily", "single", 1) }),
      listing("a", "nail-gel", { hand: tier("nail-gel", "hand", 1), "hand-foot": tier("nail-gel", "hand-foot", 1) }),
    ]
    expect(mainCategory(listings, { id: "a", categories: ["makeup", "nail"] })).toBe("nail")
    expect(mainCategory(listings.slice(0, 1), { id: "a", categories: ["nail", "makeup"] })).toBe("makeup")
    expect(mainCategory([], { id: "a", categories: ["nail"] })).toBeNull()
  })
})

describe("distance from the customer's own location", () => {
  const baDinh = DISTRICT_COORDS["Hà Nội"]["Ba Đình"]
  const hoanKiem = DISTRICT_COORDS["Hà Nội"]["Hoàn Kiếm"]

  it("matches the district-to-district distance when standing at a district centre", () => {
    expect(distanceFromPointKm(baDinh, "Hà Nội", "Hoàn Kiếm")).toBe(travelDistanceKm("Hà Nội", "Ba Đình", "Hà Nội", "Hoàn Kiếm"))
  })

  it("uses the road factor over the straight line", () => {
    // About 4.2 km straight between the two centres, so a little under 5.7 km by road.
    const km = distanceFromPointKm(baDinh, "Hà Nội", "Hoàn Kiếm")!
    expect(km).toBeGreaterThan(5)
    expect(km).toBeLessThan(6.5)
  })

  it("never quotes less than the minimum, even next door", () => {
    const nearby: LatLng = [hoanKiem[0] + 0.001, hoanKiem[1]]
    expect(distanceFromPointKm(nearby, "Hà Nội", "Hoàn Kiếm")).toBe(MIN_ROAD_KM)
    expect(travelDistanceKm("Hà Nội", "Ba Đình", "Hà Nội", "Ba Đình")).toBe(MIN_ROAD_KM)
  })

  it("is null in another city, as between districts of different cities", () => {
    const daNang = DISTRICT_COORDS["Đà Nẵng"]["Hải Châu"]
    expect(cityOfPoint(baDinh)).toBe("Hà Nội")
    expect(cityOfPoint(daNang)).toBe("Đà Nẵng")
    expect(cityOfPoint([12.24, 109.19])).toBeNull()
    expect(distanceFromPointKm(baDinh, "Đà Nẵng", "Hải Châu")).toBeNull()
    expect(travelDistanceKm("Hà Nội", "Ba Đình", "Đà Nẵng", "Hải Châu")).toBeNull()
  })

  it("is null for a district not on the map or a bad point", () => {
    expect(distanceFromPointKm(baDinh, "Hà Nội", "Nowhere")).toBeNull()
    expect(distanceFromPointKm([Number.NaN, 105] as LatLng, "Hà Nội", "Ba Đình")).toBeNull()
    expect(isLatLng([21, 105.8])).toBe(true)
    expect(isLatLng([200, 105.8])).toBe(false)
    expect(isLatLng("21,105")).toBe(false)
  })

  it("filters by radius only on a known distance", () => {
    expect(withinRadius(2.4, 3)).toBe(true)
    expect(withinRadius(3, 3)).toBe(true)
    expect(withinRadius(5.1, 5)).toBe(false)
    expect(withinRadius(null, 10)).toBe(false)
    expect(withinRadius(null, null)).toBe(true)
    expect(isRadius(5)).toBe(true)
    expect(isRadius(4)).toBe(false)
  })
})

describe("Nail and Makeup first", () => {
  it("moves Nail and Makeup to the front and keeps the rest in order", () => {
    const shuffled = [...CATEGORIES].reverse()
    const ids = priorityFirst(shuffled).map((c) => c.id)
    expect(ids.slice(0, 2)).toEqual(["nail", "makeup"])
    expect(ids.slice(2)).toEqual(shuffled.map((c) => c.id).filter((id) => id !== "nail" && id !== "makeup"))
  })

  it("pins them into a short tile row that keeps its length and the chosen category", () => {
    const ordered = CATEGORIES.filter((c) => c.vertical === "beauty").reverse()
    const pinned = pinPriority({ ordered, row: ordered.slice(0, 4), more: true }, "skincare")
    expect(pinned.row).toHaveLength(4)
    expect(pinned.row.slice(0, 2).map((c) => c.id)).toEqual(["nail", "makeup"])
    expect(pinned.row.at(-1)!.id).toBe("skincare")
  })

  it("splits a portfolio into albums by the work's catalogue service", () => {
    const works = [
      { id: "1", templateId: "makeup-daily", category: "makeup" as const },
      { id: "2", templateId: "hair-wash", category: "hair" as const },
      { id: "3", templateId: "nail-gel", category: "nail" as const },
      // A stale category on the work loses to its service's.
      { id: "4", templateId: "nail-design", category: "makeup" as const },
    ]
    const albums = albumsOf(works)
    expect(albums.map((a) => a.category)).toEqual(["nail", "makeup", "hair"])
    expect(albums[0].works.map((w) => w.id)).toEqual(["3", "4"])
  })
})
