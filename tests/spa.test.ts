import { describe, expect, it } from "vitest"
import { getTemplate } from "@/lib/catalog"
import { customerNote } from "@/lib/conduct"
import { isSpa, listingLocationOpen, providerLocationOpen } from "@/lib/launch"
import { partnerProgress, type PartnerSetup } from "@/lib/partner"
import { bedsLeftLabel, hoursSummary, openState, spaAmenities, spaDirectionsLink } from "@/lib/spa"

const hairWash = getTemplate("hair-wash")!

describe("spas", () => {
  it("are open whatever the studio switch says, and may list on-site services", () => {
    const spa = { kind: "spa" as const, homeService: false }
    const artist = { homeService: false }
    expect(isSpa(spa)).toBe(true)
    expect(providerLocationOpen(spa, false)).toBe(true)
    expect(providerLocationOpen(artist, false)).toBe(false)
    expect(hairWash.studioOnly).toBe(true)
    expect(listingLocationOpen(hairWash, spa, false)).toBe(true)
    expect(listingLocationOpen(hairWash, { kind: "artist" }, false)).toBe(false)
  })

  it("sells gội đầu as a 90-minute combo on fixed tiers", () => {
    const combo = hairWash.variants.find((v) => v.id === "combo90")!
    expect(combo.durationMin).toBe(90)
    expect(combo.tiers).toEqual([250_000, 320_000, 450_000])
  })

  it("say whether they are open now, in Vietnam time", () => {
    // Tuesday 10/11/2026, 14:00 in Vietnam (07:00 UTC).
    const at = new Date("2026-11-10T07:00:00Z")
    const hours = [1, 2].map((weekday) => ({ weekday, startMin: 9 * 60, endMin: 21 * 60 }))
    expect(openState(hours, at)).toEqual({ open: true, label: "Đang mở · đến 21:00" })
    expect(openState(hours, new Date("2026-11-10T01:00:00Z")).label).toBe("Mở lúc 9:00")
    expect(openState([], at).label).toBe("Hôm nay nghỉ")
    expect(hoursSummary([0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, startMin: 540, endMin: 1260 })))).toBe("9:00 – 21:00 hằng ngày")
    expect(hoursSummary(hours)).toBe("9:00 – 21:00 · nghỉ CN, T4, T5, T6, T7")
  })

  it("list fixed amenities in their order and link directions to the written address", () => {
    expect(spaAmenities({ amenities: ["tea", "private-room", "made-up"] }).map((a) => a.label)).toEqual(["Phòng riêng", "Trà & nước"])
    expect(spaDirectionsLink({ studioAddress: "88 Trần Quang Diệu", district: "Phường Nhiêu Lộc", city: "TP.HCM" })).toContain(encodeURIComponent("88 Trần Quang Diệu"))
    expect(bedsLeftLabel(2)).toBe("Còn 2 giường")
  })

  it("tell the spa to confirm the time, not to ask where the customer is", () => {
    expect(customerNote({ withMe: 0, overall: 0, spa: true }).text).not.toContain("vị trí")
    expect(customerNote({ withMe: 0, overall: 0 }).text).toContain("vị trí")
  })

  it("count a spa's address as where it serves, never home service", () => {
    const setup = (profile: Partial<NonNullable<PartnerSetup["profile"]>>): PartnerSetup => ({
      profile: { categories: ["hair"], home_service: false, studio_address: null, review_status: "draft", hours_confirmed: false, ...profile } as NonNullable<PartnerSetup["profile"]>,
      services: [{ template_id: "hair-wash", active: true, prices: { "60m": 240_000 } }],
      hours: [],
      workCount: 0,
    })
    const spa = partnerProgress(setup({ kind: "spa", studio_address: "88 Trần Quang Diệu" }))
    expect(spa[1].done).toBe(true)
    expect(spa[2].done).toBe(true)
    const artist = partnerProgress(setup({ kind: "artist" }))
    expect(artist[1].done).toBe(false)
    expect(artist[2].done).toBe(false)
  })
})
