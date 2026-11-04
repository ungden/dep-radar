import { describe, expect, it } from "vitest"
import { cartDefaultQuantity, cartItems, cartMinutes, cartOrder, cartProblem, foldCartLines, toggleCartLine, type BookedLine, type CartLine } from "@/lib/service-cart"
import type { PriceQuote } from "@/lib/types"

const line = (templateId: string, variantId: string, quantity = 1): CartLine => ({ templateId, variantId, quantity })
const gel = line("nail-gel", "hand")
const removal = line("nail-removal", "remove")
const catEye = line("nail-design", "cat-eye", 10)

describe("what a cart may hold", () => {
  it("takes services that do not overlap, with add-ons on top", () => {
    expect(cartProblem([removal, gel, catEye])).toBeNull()
  })

  it("refuses an empty cart and more than ten lines", () => {
    expect(cartProblem([])).toContain("ít nhất")
    expect(cartProblem(Array.from({ length: 11 }, () => gel))).toContain("tối đa 10")
  })

  it("refuses two services that both polish the nails", () => {
    expect(cartProblem([gel, line("nail-extension", "tips")])).toContain("sơn móng")
  })

  it("refuses two packages of one service", () => {
    expect(cartProblem([removal, line("nail-removal", "remove-tips")])).toContain("một gói")
  })

  it("refuses an add-on with no main service of its kind", () => {
    expect(cartProblem([catEye])).toContain("dịch vụ chính")
    expect(cartProblem([line("makeup-daily", "basic"), catEye])).toBeTruthy()
  })
})

describe("tapping a service", () => {
  const lines = (result: ReturnType<typeof toggleCartLine>) => ("lines" in result ? result.lines : [])

  it("adds it, with a whole hand for what is priced per finger", () => {
    expect(cartDefaultQuantity("nail-design", "cat-eye")).toBe(10)
    expect(lines(toggleCartLine([gel], "nail-design", "cat-eye"))).toEqual([gel, catEye])
  })

  it("replaces another package of the same service", () => {
    expect(lines(toggleCartLine([removal], "nail-removal", "remove-tips")).map((l) => l.variantId)).toEqual(["remove-tips"])
  })

  it("takes the add-ons away with the last main service of their kind", () => {
    expect(lines(toggleCartLine([gel, catEye], "nail-gel", "hand"))).toEqual([])
    expect(lines(toggleCartLine([gel, removal, catEye], "nail-gel", "hand"))).toEqual([removal, catEye])
  })

  it("says why when it cannot be added", () => {
    expect(toggleCartLine([gel], "nail-extension", "tips")).toEqual({ problem: expect.stringContaining("sơn móng") })
  })
})

describe("the order and length of an appointment", () => {
  it("puts add-ons after the main services, whatever the order chosen", () => {
    expect(cartOrder([catEye, removal, gel])).toEqual([removal, gel, catEye])
    expect(cartItems([catEye, gel]).map((i) => i.template)).toEqual(["nail-gel", "nail-design"])
  })

  it("adds up the minutes", () => {
    expect(cartMinutes([removal, gel])).toBe(65)
  })
})

describe("one appointment on screen", () => {
  const quote = (servicePrice: number, travelFee = 0): PriceQuote => ({
    servicePrice,
    distanceKm: null,
    travelFee,
    urgentFee: 0,
    total: servicePrice + travelFee,
    commissionRate: 0.2,
    commission: servicePrice / 5,
    payout: servicePrice + travelFee - servicePrice / 5,
  })
  const booking = (id: string, cartParentId: string | null, price: number, travelFee = 0) => ({
    id,
    cartParentId,
    serviceName: id,
    variantLabel: "Gói",
    quantity: 1,
    durationMin: 30,
    startsAt: `2026-11-06T0${id.length}:00:00Z`,
    endsAt: `2026-11-06T0${id.length}:30:00Z`,
    quote: quote(price, travelFee),
    lines: undefined as BookedLine[] | undefined,
  })

  it("folds the lines into the main booking, time and money", () => {
    const [folded, other] = foldCartLines([booking("a", null, 100_000, 20_000), booking("bb", "a", 50_000), booking("ccc", "a", 30_000), booking("z", null, 10_000)])
    expect(folded.lines?.map((l) => l.id)).toEqual(["a", "bb", "ccc"])
    expect(folded.variantLabel).toBe("Gói + 2 món")
    expect(folded.durationMin).toBe(90)
    expect(folded.endsAt).toBe("2026-11-06T03:30:00Z")
    expect(folded.quote).toMatchObject({ servicePrice: 180_000, travelFee: 20_000, total: 200_000, commission: 36_000, payout: 164_000 })
    expect(other.lines).toBeUndefined()
  })

  it("keeps a line whose main booking is not in the list", () => {
    expect(foldCartLines([booking("bb", "a", 50_000)]).map((b) => b.id)).toEqual(["bb"])
  })
})
