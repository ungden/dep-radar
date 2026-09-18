import { describe, expect, it } from "vitest"
import { POLICY, buildQuote, commissionFor, hoursUntilStart, isTooSoon, isUrgent, payoutFor, travelFeeFor } from "@/lib/pricing"
import { addDays, formatResponseTime, localDate, localTime, toTimestamptz, todayISO } from "@/lib/utils"

const NOW = new Date(2026, 8, 18, 10, 0) // 18/09/2026 10:00 local

describe("travelFeeFor", () => {
  it("is free inside the free radius", () => {
    expect(travelFeeFor(0)).toBe(0)
    expect(travelFeeFor(POLICY.freeTravelKm)).toBe(0)
  })

  it("charges per km past the free radius, rounded up to 5.000đ", () => {
    expect(travelFeeFor(6.1)).toBe(10_000) // 1.1 km × 5.000 = 5.500 → 10.000
    expect(travelFeeFor(10.6)).toBe(30_000) // 5.6 km × 5.000 = 28.000 → 30.000
  })

  it("never exceeds the cap", () => {
    expect(travelFeeFor(500)).toBe(POLICY.travelFeeCap)
  })

  it("treats an unknown distance as no fee", () => {
    expect(travelFeeFor(null)).toBe(0)
  })
})

describe("commission and payout", () => {
  it("uses one rounding rule everywhere", () => {
    // 350.000 × 15% = 52.500 → rounded to 53.000, so the payout is 297.000
    expect(commissionFor(350_000)).toBe(53_000)
    expect(payoutFor(350_000)).toBe(297_000)
    expect(commissionFor(350_000) + payoutFor(350_000)).toBe(350_000)
  })

  it("matches the quote for the same price", () => {
    const quote = buildQuote({ servicePrice: 350_000, atHome: false, distanceKm: null, urgent: false })
    expect(quote.commission).toBe(commissionFor(350_000))
    expect(quote.payout).toBe(payoutFor(350_000))
  })
})

describe("buildQuote", () => {
  it("adds travel and urgent fees to the customer total and to the payout", () => {
    const quote = buildQuote({ servicePrice: 300_000, atHome: true, distanceKm: 10.6, urgent: true })
    expect(quote.travelFee).toBe(30_000)
    expect(quote.urgentFee).toBe(POLICY.urgentFee)
    expect(quote.total).toBe(300_000 + 30_000 + POLICY.urgentFee)
    // Fees belong to the freelancer: commission applies to the service price only.
    expect(quote.commission).toBe(commissionFor(300_000))
    expect(quote.payout).toBe(quote.total - quote.commission)
  })

  it("ignores travel distance for studio visits", () => {
    const quote = buildQuote({ servicePrice: 200_000, atHome: false, distanceKm: 20, urgent: false })
    expect(quote.distanceKm).toBeNull()
    expect(quote.travelFee).toBe(0)
    expect(quote.total).toBe(200_000)
  })
})

describe("time windows", () => {
  it("measures hours until the appointment starts", () => {
    expect(hoursUntilStart("2026-09-18", "13:00", NOW)).toBe(3)
    expect(hoursUntilStart("2026-09-17", "10:00", NOW)).toBe(-24)
  })

  it("flags bookings starting inside the urgent window", () => {
    expect(isUrgent("2026-09-18", "12:00", NOW)).toBe(true) // in 2h
    expect(isUrgent("2026-09-18", "14:00", NOW)).toBe(false) // in 4h
    expect(isUrgent("2026-09-17", "09:00", NOW)).toBe(false) // already past
  })

  it("rejects slots inside the minimum lead time", () => {
    expect(isTooSoon("2026-09-18", "10:30", NOW)).toBe(true)
    expect(isTooSoon("2026-09-18", "11:30", NOW)).toBe(false)
  })

  it("keeps helper dates consistent", () => {
    expect(addDays(todayISO(), 0)).toBe(todayISO())
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01")
  })
})

describe("formatResponseTime", () => {
  it("reads in the unit that fits", () => {
    expect(formatResponseTime(40)).toBe("~40 phút")
    expect(formatResponseTime(89)).toBe("~89 phút")
    expect(formatResponseTime(120)).toBe("~2 giờ")
    expect(formatResponseTime(3600)).toBe("~3 ngày")
  })

  it("says nothing when there is nothing to say", () => {
    // A freelancer with no answered bookings has no response time, and showing
    // "~0 phút" would be a claim rather than a fact.
    expect(formatResponseTime(0)).toBeNull()
  })
})

describe("Vietnamese wall-clock time", () => {
  it("keeps a date the same either side of UTC midnight", () => {
    // 2026-09-18T18:30Z is already the 19th in Vietnam.
    expect(localDate("2026-09-18T18:30:00Z")).toBe("2026-09-19")
    expect(localTime("2026-09-18T18:30:00Z")).toBe("01:30")
  })

  it("turns a Vietnamese wall-clock booking into the right instant", () => {
    expect(toTimestamptz("2026-09-21", "15:00")).toBe("2026-09-21T08:00:00.000Z")
  })

  it("does date arithmetic on civil dates, not on instants", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01")
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
  })
})
