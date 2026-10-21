import { describe, expect, it } from "vitest"
import { ADDONS, CATALOG, CATEGORIES, getTemplate, getVariant, isPriceAllowed, nearestTier, partnerTemplatesByCategory, perUnitSuffix, templatesByCategory, tierLabels, serviceDuration, serviceQuantity } from "@/lib/catalog"
import { PROS, PRO_SERVICES, REVIEWS, getPro } from "@/lib/data"
import { travelDistanceKm } from "@/lib/geo"
import { bayesianRating, isVerified, rankScore } from "@/lib/trust"
import type { Pro } from "@/lib/types"

describe("catalogue integrity", () => {
  it("has unique ids and unique variant ids", () => {
    const ids = [...CATALOG, ...ADDONS].map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of [...CATALOG, ...ADDONS]) {
      const vids = t.variants.map((v) => v.id)
      expect(new Set(vids).size, `variants of ${t.id}`).toBe(vids.length)
    }
  })

  it("gives every option 3 ascending price levels or one shared price", () => {
    for (const t of [...CATALOG, ...ADDONS]) {
      for (const v of t.variants) {
        const at = `${t.id}/${v.id}`
        expect([1, 3], at).toContain(v.tiers.length)
        v.tiers.forEach((tier, i) => {
          // Per-finger nail art goes down to 3.000đ; everything else stays on 5.000đ.
          expect(tier % (v.unit ? 1000 : 5000), `${at} level ${i}`).toBe(0)
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
    const v = getVariant("nail-extension", "tips")!
    for (const tier of v.tiers) expect(isPriceAllowed(v, tier)).toBe(true)
    expect(isPriceAllowed(v, v.tiers[0] + 5000)).toBe(false)
    expect(isPriceAllowed(v, v.minPrice - 5000)).toBe(false)
    expect(isPriceAllowed(v, v.maxPrice + 5000)).toBe(false)
  })

  it("moves an old price to the closest level", () => {
    const v = getVariant("nail-gel", "hand")! // 85 / 100 / 120
    expect(nearestTier(v, 10)).toBe(85_000)
    expect(nearestTier(v, 95_000)).toBe(100_000)
    expect(nearestTier(v, 99_000_000)).toBe(120_000)
  })

  it("names a single price 'Giá chung' and the per-finger unit", () => {
    const trial = getVariant("makeup-bridal", "trial")!
    expect(trial.tiers).toEqual([800_000])
    expect(trial.suggestedPrice).toBe(800_000)
    expect(tierLabels(trial)).toEqual(["Giá chung"])
    expect(isPriceAllowed(trial, 800_000)).toBe(true)
    const ombre = getVariant("nail-design", "ombre")!
    expect(ombre.tiers).toEqual([7_000, 10_000, 15_000])
    expect(perUnitSuffix(ombre)).toBe("/ngón")
    expect(perUnitSuffix(getVariant("makeup-family", "family")!)).toBe("/người")
    expect(perUnitSuffix(trial)).toBe("")
  })

  it("lists add-ons for partners but never as a service to book on its own", () => {
    expect(templatesByCategory("nail").some((t) => t.addon)).toBe(false)
    expect(partnerTemplatesByCategory("nail").map((t) => t.id)).toContain("nail-design")
    expect(partnerTemplatesByCategory("makeup").map((t) => t.id)).toContain("makeup-hair-updo")
    for (const t of ADDONS) expect(t.addon, t.id).toBe(true)
  })

  it("matches the owner's price list for makeup and nail", () => {
    const table: [string, string, number[]][] = [
      ["makeup-daily", "single", [250, 300, 400]],
      ["makeup-party", "makeup", [300, 350, 450]],
      ["makeup-photo", "single", [250, 300, 400]],
      ["makeup-bridal", "engagement", [1200, 1500, 1800]],
      ["makeup-bridal", "wedding", [1500, 1800, 2000]],
      ["makeup-takecare", "takecare", [500]],
      ["makeup-family", "mother", [400, 450, 500]],
      ["makeup-family", "family", [350, 400, 500]],
      ["makeup-prewedding", "studio", [1000, 1200, 1500]],
      ["makeup-prewedding", "outdoor", [1200, 1500, 1800]],
      ["makeup-event", "event", [500, 650, 800]],
      ["makeup-hair-updo", "updo", [150]],
      ["nail-gel", "hand", [85, 100, 120]],
      ["nail-extension", "tips", [140, 150, 160]],
      ["nail-extension", "gelx", [165, 180, 210]],
      ["nail-extension", "builder", [220, 250, 280]],
      ["nail-removal", "remove", [50]],
      ["nail-design", "design", [5, 10, 20]],
      ["nail-design", "french", [10]],
      ["nail-design", "stone", [3, 10, 20]],
      ["nail-design", "3d", [10, 20, 30]],
    ]
    for (const [t, v, prices] of table) expect(getVariant(t, v)?.tiers, `${t}/${v}`).toEqual(prices.map((p) => p * 1000))
    // Group yearbook makeup: 10% off for two, 15% for three, 20% from five, per person.
    const single = getVariant("makeup-photo", "single")!.tiers
    for (const [id, off] of [["group2", 0.1], ["group3", 0.15], ["group5", 0.2]] as const) {
      getVariant("makeup-photo", id)!.tiers.forEach((p, i) => expect(1 - p / single[i]!, `${id} level ${i}`).toBeGreaterThanOrEqual(off - 1e-9))
    }
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


describe("package scheduling", () => {
  it("charges a yearbook group per person without multiplying the reserved session", () => {
    const group = getVariant("photo-yearbook-group", "half")!
    expect(serviceQuantity(group, 1)).toBe(5)
    expect(serviceQuantity(group, 20)).toBe(15)
    expect(serviceDuration(group, 5)).toBe(180)
    expect(serviceDuration(group, 15)).toBe(180)
  })
  it("reserves sequential makeup time for each person and separate bridal appointments", () => {
    expect(serviceDuration(getVariant("makeup-photo", "group3")!, 3)).toBe(135)
    const bridal = getVariant("makeup-bridal", "two")!
    expect(bridal.sessions).toBe(2)
    expect(serviceDuration(bridal, 1)).toBe(120)
  })
})
