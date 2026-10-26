import { afterEach, describe, expect, it, vi } from "vitest"
import { watchStudioBookingSetting } from "@/lib/booking-features"
import { getTemplate, templatesByCategory, partnerTemplatesByCategory } from "@/lib/catalog"
import { providerLocationOpen, serviceLocationOpen } from "@/lib/launch"
import { listedOptions, serviceOffers } from "@/lib/offers"
import { PROS } from "@/lib/data"

afterEach(() => { vi.useRealTimers() })

describe("live studio settings", () => {
  it("opens and closes the studio catalogue and offers without changing code", () => {
    const studio = getTemplate("hair-color")!
    const variant = studio.variants[0]
    const pro = { ...PROS[0], uuid: "studio-provider", homeService: false, published: true, acceptingJobs: true }
    const input = { pros: [pro], proServices: [{ id: "studio", proId: pro.id, templateId: studio.id, active: true, prices: { [variant.id]: variant.minPrice } }], works: [], city: null, vertical: "all" as const }
    for (const open of [false, true, false]) {
      expect(serviceLocationOpen(studio, open)).toBe(open)
      expect(providerLocationOpen(pro, open)).toBe(open)
      expect(templatesByCategory("hair", open).some(t => t.id === studio.id)).toBe(open)
      expect(partnerTemplatesByCategory("hair", open).some(t => t.id === studio.id)).toBe(open)
      expect(listedOptions(studio, input.proServices[0].prices, open).length > 0).toBe(open)
      expect(serviceOffers({ ...input, studioBookingOpen: open }).length > 0).toBe(open)
    }
  })
  it("refreshes on launch, each minute and foreground; failures retain the last value", async () => {
    vi.useFakeTimers()
    let focus = () => {}
    let active = true
    const read = vi.fn<() => Promise<boolean | null>>().mockResolvedValue(false)
    const changed = vi.fn()
    const unsubscribe = vi.fn()
    const stop = watchStudioBookingSetting({ read, onChange: changed, isActive: () => active, subscribeFocus: sync => { focus = sync; return unsubscribe } })
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(false))
    read.mockResolvedValue(true)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(changed).toHaveBeenLastCalledWith(true)
    active = false
    const calls = read.mock.calls.length
    await vi.advanceTimersByTimeAsync(120_000)
    expect(read).toHaveBeenCalledTimes(calls)
    active = true
    read.mockRejectedValue(new Error("offline"))
    focus(); await vi.advanceTimersByTimeAsync(0)
    expect(changed).toHaveBeenLastCalledWith(true)
    read.mockResolvedValue(false)
    focus(); await vi.advanceTimersByTimeAsync(0)
    expect(changed).toHaveBeenLastCalledWith(false)
    stop()
    expect(unsubscribe).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(read).toHaveBeenCalledTimes(calls + 2)
  })
  it("ignores an in-flight response after the screen provider unmounts", async () => {
    let complete!: (v: boolean) => void
    const changed = vi.fn()
    const stop = watchStudioBookingSetting({ read: () => new Promise(resolve => { complete = resolve }), onChange: changed, isActive: () => true, subscribeFocus: () => () => {} })
    stop(); complete(true); await Promise.resolve()
    expect(changed).not.toHaveBeenCalled()
  })
})
