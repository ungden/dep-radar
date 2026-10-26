import { describe, expect, it } from "vitest"
import { getTemplate } from "@/lib/catalog"
import { serviceOffers } from "@/lib/offers"
import type { Pro, ProService } from "@/lib/types"

const pro = (id: string, homeService = true, city = "Hà Nội"): Pro => ({ id, uuid: id, name: id, title: "", phone: "", tone: "#fff", categories: ["nail", "camera"], city, district: "Cầu Giấy", areas: [], homeService, studioAddress: homeService ? undefined : "Studio", maxTravelKm: 10, yearsExp: 0, acceptingJobs: true, published: true, joinedAt: "2026-10-11", bio: "", highlights: [], identity: "none", stats: { completedJobs: 0, responseMinutes: 0 }, rating: { average: 0, count: 0 } })
const listing = (proId: string, templateId: string, prices: Record<string, number>): ProService => ({ id: `${proId}:${templateId}`, proId, templateId, prices, active: true })
const browse = (pros: Pro[], proServices: ProService[]) => ({ pros, proServices, works: [], city: "Hà Nội", vertical: "all" as const })

describe("bookable starting offers", () => {
  it("keeps price, option and duration from the same actually offered package", () => {
    const offers = serviceOffers(browse([pro("a")], [listing("a", "nail-gel", { "hand-foot": 400000 })]))
    expect(offers[0]).toMatchObject({ fromPrice: 400000, minimumTotal: 400000, durationMin: 90, variant: { id: "hand-foot" } })
  })
  it("does not offer a five-person booking inside a 300k total budget", () => {
    const input = browse([pro("a")], [listing("a", "photo-yearbook-group", { half: 150000 })])
    expect(serviceOffers(input)[0]).toMatchObject({ fromPrice: 150000, minimumQuantity: 5, minimumTotal: 750000, durationMin: 180 })
    expect(serviceOffers({ ...input, priceFilter: (total) => total <= 300000 })).toEqual([])
  })
  it("requires location and price to match the same provider, and counts only eligible providers", () => {
    const input = browse([pro("home"), pro("studio", false)], [listing("home", "nail-gel", { "hand-foot": 400000 }), listing("studio", "nail-gel", { hand: 120000 })])
    expect(serviceOffers({ ...input, proFilter: (p) => p.homeService, priceFilter: (total) => total <= 300000 })).toEqual([])
    expect(serviceOffers({ ...input, priceFilter: (total) => total <= 300000 })).toEqual([])
  })
  it("selects a matching option before computing the starting price for a price band", () => {
    const [offer] = serviceOffers({ ...browse([pro("a")], [listing("a", "nail-gel", { hand: 120000, "hand-foot": 400000 })]), priceFilter: (total) => total >= 300000 })
    expect(offer).toMatchObject({ fromPrice: 400000, durationMin: 90 })
  })
  it("does not borrow a portfolio photo from an excluded provider or another city", () => {
    const offers = serviceOffers({ ...browse([pro("a"), pro("b", true, "TP.HCM")], [listing("a", "nail-gel", { hand: 120000 })]), works: [{ id: "w", dbId: "w", kind: "work", proId: "b", templateId: "nail-gel", category: "nail", title: "", description: "", images: ["https://example.com/b.jpg"], createdAt: "2026-10-11" }] })
    expect(offers[0].photo).toBeUndefined()
  })
  it("hides equipment-dependent studio services even when a travelling provider lists them", () => {
    const offers = serviceOffers(browse([pro("a")], [listing("a", "hair-color", { short: 500000 })]))
    expect(offers).toEqual([])
  })
  it("ignores orphaned variants and non-finite prices", () => {
    const offers = serviceOffers(browse([pro("a")], [listing("a", "nail-gel", { old: 1, hand: Number.NaN, "hand-foot": 400000 })]))
    expect(offers[0].variant).toBe(getTemplate("nail-gel")!.variants[1])
    expect(offers[0].fromPrice).toBe(400000)
  })
})
