import { describe, expect, it } from "vitest"
import { CATALOG, CATEGORIES, clampPrice, getTemplate, getVariant, isPriceAllowed, templatesByCategory } from "@/lib/catalog"
import { PROS, PRO_SERVICES, REVIEWS, getPro } from "@/lib/data"
import { travelDistanceKm } from "@/lib/geo"
import { bayesianRating, isVerified, rankScore } from "@/lib/trust"
import type { Pro } from "@/lib/types"

describe("catalogue integrity", () => {
  it("has unique ids and unique variant ids", () => {
    const ids = CATALOG.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of CATALOG) {
      const vids = t.variants.map((v) => v.id)
      expect(new Set(vids).size, `variants of ${t.id}`).toBe(vids.length)
    }
  })

  it("keeps every band ordered and aligned to the 5.000đ step the sliders use", () => {
    for (const t of CATALOG) {
      for (const v of t.variants) {
        expect(v.minPrice, `${t.id}/${v.id}`).toBeLessThanOrEqual(v.suggestedPrice)
        expect(v.suggestedPrice, `${t.id}/${v.id}`).toBeLessThanOrEqual(v.maxPrice)
        expect(v.minPrice % 5000, `${t.id}/${v.id} min`).toBe(0)
        expect(v.maxPrice % 5000, `${t.id}/${v.id} max`).toBe(0)
        expect(v.suggestedPrice % 5000, `${t.id}/${v.id} suggested`).toBe(0)
        expect(v.durationMin, `${t.id}/${v.id}`).toBeGreaterThanOrEqual(15)
      }
    }
  })

  it("covers every category shown to customers", () => {
    for (const c of CATEGORIES) expect(templatesByCategory(c.id).length, c.id).toBeGreaterThan(0)
  })

  it("accepts prices inside the band only", () => {
    const v = getVariant("nail-design", "simple")!
    expect(isPriceAllowed(v, v.minPrice)).toBe(true)
    expect(isPriceAllowed(v, v.maxPrice)).toBe(true)
    expect(isPriceAllowed(v, v.minPrice - 5000)).toBe(false)
    expect(isPriceAllowed(v, v.maxPrice + 5000)).toBe(false)
    expect(isPriceAllowed(v, v.minPrice + 1000)).toBe(false) // not a 5.000đ step
    expect(clampPrice(v, 10)).toBe(v.minPrice)
    expect(clampPrice(v, 99_000_000)).toBe(v.maxPrice)
  })
})

describe("seed data integrity", () => {
  it("prices every listing inside the catalogue band", () => {
    for (const listing of PRO_SERVICES) {
      const tpl = getTemplate(listing.templateId)
      expect(tpl, listing.templateId).toBeDefined()
      for (const [variantId, price] of Object.entries(listing.prices)) {
        const variant = tpl!.variants.find((v) => v.id === variantId)
        expect(variant, `${listing.templateId}/${variantId}`).toBeDefined()
        expect(isPriceAllowed(variant!, price), `${listing.proId} ${listing.templateId}/${variantId} = ${price}`).toBe(true)
      }
    }
  })

  it("only lists services inside the freelancer's own categories", () => {
    for (const listing of PRO_SERVICES) {
      const pro = getPro(listing.proId)!
      expect(pro.categories, `${listing.proId} ${listing.templateId}`).toContain(getTemplate(listing.templateId)!.category)
    }
  })

  it("never lists a studio-only service for a freelancer without a studio", () => {
    for (const listing of PRO_SERVICES) {
      if (!getTemplate(listing.templateId)!.studioOnly) continue
      expect(getPro(listing.proId)!.studioAddress, listing.proId).toBeTruthy()
    }
  })

  it("derives the displayed rating from the reviews that exist", () => {
    for (const pro of PROS) {
      const rows = REVIEWS.filter((r) => r.proId === pro.id)
      expect(pro.rating.count, pro.id).toBe(rows.length)
      if (rows.length) {
        const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length
        expect(pro.rating.average, pro.id).toBeCloseTo(avg, 5)
      }
    }
  })

  it("gives every freelancer a phone number customers can call", () => {
    for (const pro of PROS) expect(pro.phone.replace(/\D/g, "").length, pro.id).toBeGreaterThanOrEqual(9)
  })
})

describe("travel distance", () => {
  it("returns null across cities", () => {
    expect(travelDistanceKm("Hà Nội", "Ba Đình", "TP.HCM", "Quận 1")).toBeNull()
  })

  it("returns null for districts it does not know", () => {
    expect(travelDistanceKm("Hà Nội", "Ba Đình", "Hà Nội", "Quận Không Tồn Tại")).toBeNull()
  })

  it("is symmetric and grows with real distance", () => {
    const a = travelDistanceKm("Hà Nội", "Ba Đình", "Hà Nội", "Thanh Xuân")!
    const b = travelDistanceKm("Hà Nội", "Thanh Xuân", "Hà Nội", "Ba Đình")!
    const far = travelDistanceKm("Hà Nội", "Ba Đình", "Hà Nội", "Hà Đông")!
    expect(a).toBeCloseTo(b, 5)
    expect(far).toBeGreaterThan(a)
  })
})

const pro = (over: Partial<Pro>): Pro => ({
  ...PROS[0],
  uuid: `uuid-${PROS[0].id}`,
  acceptingJobs: true,
  ...over,
})

describe("ranking", () => {
  it("pulls small samples toward the platform mean", () => {
    const few = bayesianRating({ average: 5, count: 2 })
    const many = bayesianRating({ average: 4.9, count: 300 })
    expect(many).toBeGreaterThan(few)
  })

  it("puts a verified freelancer ahead of an unverified one with the same reviews", () => {
    const rating = { average: 4.8, count: 40 }
    const verified = pro({ id: "a", identity: "verified", rating, stats: { completedJobs: 50, responseMinutes: 20 } })
    const plain = pro({ id: "b", identity: "none", rating, stats: { completedJobs: 50, responseMinutes: 20 } })
    expect(isVerified(verified)).toBe(true)
    expect(rankScore(verified)).toBeGreaterThan(rankScore(plain))
  })

  it("does not treat a pending or rejected check as verified", () => {
    expect(isVerified(pro({ identity: "pending" }))).toBe(false)
    expect(isVerified(pro({ identity: "rejected" }))).toBe(false)
  })

  it("rewards experience when everything else is equal", () => {
    const rating = { average: 4.7, count: 20 }
    const senior = pro({ id: "a", identity: "none", rating, stats: { completedJobs: 300, responseMinutes: 30 } })
    const junior = pro({ id: "b", identity: "none", rating, stats: { completedJobs: 3, responseMinutes: 30 } })
    expect(rankScore(senior)).toBeGreaterThan(rankScore(junior))
  })
})
