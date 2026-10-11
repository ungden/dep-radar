import { describe, expect, it } from "vitest"
import { catalogReadStatus } from "@/lib/catalog-read"
import { getTemplate } from "@/lib/catalog"
import { sortServiceOffers, type ServiceOffer } from "@/lib/offers"
import type { Pro } from "@/lib/types"

const pro = (id: string): Pro => ({ id, uuid: id, name: id, title: "", phone: "", tone: "#fff", categories: ["nail"], city: "Hà Nội", district: "Cầu Giấy", areas: [], homeService: true, maxTravelKm: 10, yearsExp: 0, acceptingJobs: true, published: true, joinedAt: "2026-10-11", bio: "", highlights: [], identity: "none", stats: { completedJobs: 0, responseMinutes: 0 }, rating: { average: 0, count: 0 } })
const offer = (id: string, people: string[], price = 120000): ServiceOffer => ({ template: { ...getTemplate("nail-gel")!, id }, pros: people.map(pro), fromPrice: price })

describe("service sorting", () => {
  const input = [offer("unknown", ["u"]), offer("far", ["f"]), offer("near", ["f", "n"]), offer("unknown-2", ["u2"])]
  const distances: Record<string, number> = { f: 8, n: 1 }
  it("uses the nearest eligible provider and keeps unknown distances last in stable order", () => {
    expect(sortServiceOffers(input, "near", id => distances[id] ?? null).map(o => o.template.id)).toEqual(["near", "far", "unknown", "unknown-2"])
    expect(input.map(o => o.template.id)).toEqual(["unknown", "far", "near", "unknown-2"])
  })
  it("preserves ranking when no distances exist", () => {
    expect(sortServiceOffers(input, "near", () => null)).toEqual(input)
  })
  it("sorts by actual lowest prices and leaves relevance order alone", () => {
    const items = [offer("high", ["f"], 300000), offer("low", ["n"], 120000)]
    expect(sortServiceOffers(items, "price", () => null).map(o => o.template.id)).toEqual(["low", "high"])
    expect(sortServiceOffers(items, "match", () => null)).toEqual(items)
  })
})

describe("catalogue availability", () => {
  const ok = { error: null }
  it("distinguishes successful empty reads from errors", () => {
    expect(catalogReadStatus({ pros: ok, prices: ok, listings: ok, works: ok })).toEqual({ catalogError: false, worksError: false })
    for (const key of ["pros", "prices", "listings"] as const) {
      const result = catalogReadStatus({ pros: ok, prices: ok, listings: ok, works: ok, [key]: { error: { message: "private details" } } })
      expect(result.catalogError).toBe(true)
      expect(JSON.stringify(result)).not.toContain("private details")
    }
  })
  it("allows service browsing when only portfolio photos fail", () => {
    expect(catalogReadStatus({ pros: ok, prices: ok, listings: ok, works: { error: new Error("offline") } })).toEqual({ catalogError: false, worksError: true })
  })
})
