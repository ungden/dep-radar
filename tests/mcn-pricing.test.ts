import { describe, expect, it } from "vitest"
import { MCN_POLICY, splitMcnCommission } from "@/lib/mcn"
import { buildQuote, commissionFor } from "@/lib/pricing"

describe("MCN allocation of existing KTV fees", () => {
  it("allocates 80/4/16 for a service whose commission needs no rounding", () => {
    const quote = buildQuote({ servicePrice: 1_000_000, atHome: false, distanceKm: null, urgent: false })
    const share = splitMcnCommission(quote.commission)
    expect(quote.payout).toBe(800_000)
    expect(share).toEqual({ mcn: 40_000, platform: 160_000 })
    expect(quote.payout + share.mcn + share.platform).toBe(quote.total)
  })

  it("uses the rounded fee so independently rounding 4% cannot create or lose money", () => {
    const quote = buildQuote({ servicePrice: 352_500, atHome: false, distanceKm: null, urgent: false })
    expect(quote.commission).toBe(71_000)
    expect(splitMcnCommission(quote.commission)).toEqual({ mcn: 14_200, platform: 56_800 })
    expect(quote.payout).toBe(281_500)
  })

  it("splits the 350k service as 280k KTV, 14k MCN and 56k platform", () => {
    const quote = buildQuote({ servicePrice: 350_000, atHome: false, distanceKm: null, urgent: false })
    expect(quote.payout).toBe(280_000)
    expect(splitMcnCommission(quote.commission)).toEqual({ mcn: 14_000, platform: 56_000 })
  })

  it("preserves allocation of an old booking's stored 15% fee", () => {
    const historicalFee = commissionFor(350_000, .15)
    expect(historicalFee).toBe(53_000)
    expect(splitMcnCommission(historicalFee)).toEqual({ mcn: 10_600, platform: 42_400 })
  })

  it("leaves every đồng of travel and urgent fees with the KTV", () => {
    const service = buildQuote({ servicePrice: 350_000, atHome: false, distanceKm: null, urgent: false })
    const homeVisit = buildQuote({ servicePrice: 350_000, atHome: true, distanceKm: 12, urgent: true })
    expect(splitMcnCommission(homeVisit.commission)).toEqual(splitMcnCommission(service.commission))
    expect(homeVisit.payout - service.payout).toBe(150_000)
    expect(homeVisit.total - service.total).toBe(150_000)
  })

  it("conserves every integer amount across fees and never assigns a negative share", () => {
    for (const fee of [0, 1, 2, 3, 4, 5, 999, 1_000, 53_000, 1_500_000, 2_147_483_647]) {
      const { mcn, platform } = splitMcnCommission(fee)
      expect(Number.isInteger(mcn)).toBe(true)
      expect(Number.isInteger(platform)).toBe(true)
      expect(mcn).toBeGreaterThanOrEqual(0)
      expect(platform).toBeGreaterThanOrEqual(0)
      expect(mcn + platform).toBe(fee)
    }
  })

  it("rejects negative, fractional, nonfinite or unsafe money inputs", () => {
    for (const invalid of [-1, .5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => splitMcnCommission(invalid)).toThrow(RangeError)
    }
  })

  it("keeps the disclosed hold, invitation window and minimum transfer explicit", () => {
    expect(MCN_POLICY).toMatchObject({ feeShareRate: .2, holdDays: 7, invitationDays: 7, minimumPayout: 100_000 })
  })
})
