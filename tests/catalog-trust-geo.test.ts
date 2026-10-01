import { describe, expect, it } from "vitest"
import { CATALOG, CATEGORIES, getTemplate, getVariant, isPriceAllowed, nearestTier, templatesByCategory, tierLabels } from "@/lib/catalog"
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

  it("gives every option 2–3 ascending price levels on the 5.000đ step", () => {
    for (const t of CATALOG) {
      for (const v of t.variants) {
        const at = `${t.id}/${v.id}`
        expect(v.tiers.length, at).toBeGreaterThanOrEqual(2)
        expect(v.tiers.length, at).toBeLessThanOrEqual(3)
        v.tiers.forEach((tier, i) => {
          expect(tier % 5000, `${at} level ${i}`).toBe(0)
          if (i) expect(tier, `${at} level ${i}`).toBeGreaterThan(v.tiers[i - 1])
        })
        expect(v.minPrice, at).toBe(v.tiers[0])
        expect(v.maxPrice, at).toBe(v.tiers[v.tiers.length - 1])
        expect(v.tiers, at).toContain(v.suggestedPrice)
        expect(tierLabels(v).length, at).toBe(v.tiers.length)
        expect(v.durationMin, at).toBeGreaterThanOrEqual(15)
      }
    }
  })

  it("covers every category shown to customers", () => {
    for (const c of CATEGORIES) expect(templatesByCategory(c.id).length, c.id).toBeGreaterThan(0)
  })

  it("accepts the listed levels only, never a price in between", () => {
    const v = getVariant("nail-design", "simple")!
    for (const tier of v.tiers) expect(isPriceAllowed(v, tier)).toBe(true)
    expect(isPriceAllowed(v, v.tiers[0] + 5000)).toBe(false)
    expect(isPriceAllowed(v, v.minPrice - 5000)).toBe(false)
    expect(isPriceAllowed(v, v.maxPrice + 5000)).toBe(false)
  })

  it("moves an old price to the closest level", () => {
    const v = getVariant("nail-gel", "hand")! // 120 / 160 / 220
    expect(nearestTier(v, 10)).toBe(120_000)
    expect(nearestTier(v, 175_000)).toBe(160_000)
    expect(nearestTier(v, 99_000_000)).toBe(220_000)
  })
})

describe("seed data integrity", () => {
  it("prices every listing at one of the catalogue levels", () => {
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
  published: true,
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
