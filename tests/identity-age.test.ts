import { describe, expect, it } from "vitest"
import { ageFromCard } from "@/lib/identity-age"

describe("age from the CCCD date of birth", () => {
  it("turns 18 on the birthday itself, not a day before", () => {
    expect(ageFromCard("24/09/2008", "2026-09-24")).toEqual({ adult: true, birthYear: 2008 })
    expect(ageFromCard("25/09/2008", "2026-09-24")).toEqual({ adult: false, birthYear: 2008 })
  })

  it("reads the separators cards and the AI actually produce", () => {
    expect(ageFromCard("1/2/1995", "2026-09-24")).toEqual({ adult: true, birthYear: 1995 })
    expect(ageFromCard("01-02-1995", "2026-09-24")?.adult).toBe(true)
    expect(ageFromCard("01.02.1995", "2026-09-24")?.adult).toBe(true)
  })

  it("keeps nothing it cannot trust", () => {
    expect(ageFromCard("", "2026-09-24")).toBeNull()
    expect(ageFromCard("31/02/2000", "2026-09-24")).toBeNull()
    expect(ageFromCard("1995-02-01", "2026-09-24")).toBeNull()
    expect(ageFromCard("01/01/2030", "2026-09-24")).toBeNull()
  })
})
