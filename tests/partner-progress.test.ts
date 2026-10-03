import { describe, expect, it } from "vitest"
import { appointmentAt } from "@/lib/appointments"
import { partnerProgress, type PartnerSetup } from "@/lib/partner"

const setup: PartnerSetup = {
  profile: { id: "p", slug: "p", display_name: "Đối tác", title: "Thợ nail", bio: "", categories: ["nail"], city: "Hà Nội", district: "Ba Đình", home_service: false, studio_address: null, max_travel_km: 10, equipment: null, avatar_path: null, hours_confirmed: false, terms_accepted_at: null, published: false, accepting_jobs: false, review_status: "draft", review_note: null, identity_status: "none" },
  services: [{ template_id: "nail-gel", active: false, prices: { hand: 250000 } }],
  hours: [{ weekday: 1, startMin: 540, endMin: 1140 }], workCount: 0,
}
describe("saved partner progress", () => {
  it("requires active prices, a service location, confirmed hours and real work", () => {
    expect(partnerProgress(setup).map((s) => s.done)).toEqual([true, false, false, false, false, false])
    const ready = { ...setup, profile: { ...setup.profile!, home_service: true, hours_confirmed: true, review_status: "pending" as const }, services: [{ ...setup.services[0], active: true }], workCount: 1 }
    expect(partnerProgress(ready).map((s) => s.done)).toEqual([true, true, true, true, true, false])
  })
  it("never treats suggested hours or a pending review as approval", () => {
    expect(partnerProgress({ ...setup, profile: null, services: [], hours: [], workCount: 0 }).every((s) => !s.done)).toBe(true)
    expect(partnerProgress({ ...setup, profile: { ...setup.profile!, hours_confirmed: true }, hours: [] })[3].done).toBe(false)
    expect(partnerProgress({ ...setup, profile: { ...setup.profile!, review_status: "approved" } })[5].done).toBe(true)
  })
})


describe("appointment date input", () => {
  it("rejects a date rollover and an impossible time", () => {
    expect(appointmentAt("2026-02-30", "09:00")).toBeNull()
    expect(appointmentAt("2026-10-19", "25:00")).toBeNull()
    expect(appointmentAt("2026-10-19", "09:60")).toBeNull()
  })
  it("keeps valid local time and leap days", () => {
    expect(appointmentAt("2028-02-29", "09:30")).toBe("2028-02-29T02:30:00.000Z")
  })
})
