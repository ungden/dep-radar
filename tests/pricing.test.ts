import { describe, expect, it } from "vitest"
import { POLICY, buildQuote, commissionFor, hoursUntilStart, isTooSoon, isUrgent, payoutFor, travelFeeFor } from "@/lib/pricing"
import { addDays, formatResponseTime, localDate, localTime, toTimestamptz, todayISO } from "@/lib/utils"

const NOW = new Date("2026-09-18T10:00:00+07:00") // 18/09/2026 10:00 in Vietnam

describe("travelFeeFor", () => {
  it("charges 50.000đ below 5 km, including the same area", () => {
    expect(travelFeeFor(0)).toBe(50_000)
    expect(travelFeeFor(2)).toBe(50_000)
    expect(travelFeeFor(4.9)).toBe(50_000)
    expect(travelFeeFor(4.999)).toBe(50_000)
  })

  it("charges 100.000đ from exactly 5 km and caps longer trips", () => {
    for (const km of [5, 6.1, 9, 10, 10.6, 500]) {
      expect(travelFeeFor(km), `${km} km`).toBe(100_000)
    }
  })

  it("does not invent a fee for unknown or invalid distances", () => {
    for (const km of [null, -1, NaN, Infinity, -Infinity]) expect(travelFeeFor(km)).toBe(0)
  })
})

describe("commission and payout", () => {
  it("uses one rounding rule everywhere", () => {
    // New bookings use 20%: 350.000 × 20% = 70.000, leaving 280.000.
    expect(commissionFor(350_000)).toBe(70_000)
    expect(payoutFor(350_000)).toBe(280_000)
    expect(commissionFor(350_000) + payoutFor(350_000)).toBe(350_000)
  })

  it("retains the historical fee when an existing booking supplies its 15% snapshot", () => {
    expect(commissionFor(350_000, .15)).toBe(53_000)
    expect(payoutFor(350_000, .15)).toBe(297_000)
    expect(POLICY.commissionRate).toBe(.2)
  })

  it("still rounds a new fee to whole thousands", () => {
    expect(commissionFor(352_500)).toBe(71_000)
    expect(payoutFor(352_500)).toBe(281_500)
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
    expect(quote.travelFee).toBe(100_000)
    expect(quote.urgentFee).toBe(POLICY.urgentFee)
    expect(quote.total).toBe(300_000 + 100_000 + POLICY.urgentFee)
    // Fees belong to the freelancer: commission applies to the service price only.
    expect(quote.commission).toBe(commissionFor(300_000))
    expect(quote.payout).toBe(quote.total - quote.commission)
  })

  it("adds the near-distance fee without charging commission on it", () => {
    const quote = buildQuote({ servicePrice: 300_000, atHome: true, distanceKm: 4.9, urgent: false })
    expect(quote.total).toBe(350_000)
    expect(quote.travelFee).toBe(50_000)
    expect(quote.commission).toBe(60_000)
    expect(quote.payout).toBe(290_000)
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
