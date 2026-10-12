// @vitest-environment jsdom
import { act, createElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { addDays, todayISO, toTimestamptz } from "@/lib/utils"
import type { AppState } from "@/lib/store"

const mocks = vi.hoisted(() => ({ state: null as unknown as AppState, params: new URLSearchParams(), slots: vi.fn(), quote: vi.fn(), push: vi.fn(), create: vi.fn() }))
vi.mock("next/navigation", () => ({ useParams: () => ({ proId: "qa" }), useSearchParams: () => mocks.params, useRouter: () => ({ push: mocks.push, refresh: vi.fn(), back: vi.fn() }) }))
vi.mock("@/lib/store", async (original) => ({ ...await original<typeof import("@/lib/store")>(), useApp: () => mocks.state }))
vi.mock("@/lib/api/actions", () => ({ bookingQuote: mocks.quote }))
vi.mock("@/lib/client-actions", () => ({ actions: { slotsFor: mocks.slots, createBooking: mocks.create }, useAct: () => vi.fn() }))
vi.mock("@/lib/uploads", () => ({ uploadImage: vi.fn() }))
import BookPage from "@/app/book/[proId]/page"

let root: Root
let host: HTMLDivElement
const button = (label: string) => [...host.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.trim() === label)!
const click = async (label: string) => { await act(async () => { button(label).click() }) }
const quote = { servicePrice: 4800000, distanceKm: null, travelFee: 0, urgentFee: 0, total: 4800000, commissionRate: .1, commission: 480000, payout: 4320000, unitPrice: 4800000, expiresAt: "2099-01-01T00:00:00Z" }

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  window.scrollTo = vi.fn()
  const date = addDays(todayISO(), 1)
  mocks.params = new URLSearchParams({ service: "makeup-bridal", variant: "two", date, time: "09:00", place: "studio", secondDate: addDays(date, 1), secondTime: "10:30" })
  const pro = { id: "qa", uuid: "qa-uuid", name: "QA", city: "Hà Nội", district: "Cầu Giấy", published: true, acceptingJobs: true, homeService: true, studioAddress: "Studio", categories: ["makeup"], areas: [], highlights: [], bio: "", stats: { responseMinutes: 0, completedJobs: 0 }, rating: { average: 0, count: 0 }, identity: "none", maxTravelKm: 15 }
  mocks.state = { session: { role: "customer", name: "QA", phone: "0900000000" }, pros: [pro], proServices: [{ id: "qa:makeup-bridal", proId: "qa", templateId: "makeup-bridal", active: true, prices: { two: 4800000 } }], myServices: [], addresses: [], bookings: [], works: [], reviews: [], vouchers: [], customerAddress: null, blockedAccounts: [] } as unknown as AppState
  mocks.slots.mockResolvedValue({ ok: true, data: [{ startsAt: toTimestamptz(date, "09:00"), time: "09:00" }] })
  mocks.quote.mockResolvedValue({ ok: true, data: quote })
  host = document.createElement("div"); document.body.append(host); root = createRoot(host)
})
afterEach(async () => { await act(async () => root.unmount()); host.remove() })
const render = async () => { await act(async () => { root.render(createElement(BookPage)) }) }

describe("booking recovery", () => {
  it("shows a quote failure and retries without sending an estimated-price booking", async () => {
    mocks.quote.mockResolvedValueOnce({ ok: false, error: "Không xác nhận được tổng tiền." })
    await render()
    expect(host.textContent).toContain("Không xác nhận được tổng tiền.")
    expect(button("Gửi yêu cầu").disabled).toBe(true)
    expect(mocks.create).not.toHaveBeenCalled()
    await click("Thử xác nhận lại giá")
    expect(mocks.quote).toHaveBeenCalledTimes(2)
    expect(button("Gửi yêu cầu").disabled).toBe(false)
    expect((host.querySelector('[aria-label="Ngày buổi thứ hai"]') as HTMLInputElement).value).toBe(mocks.params.get("secondDate"))
  })
  it("clears the failed quote while retrying and waits for a fresh server total", async () => {
    mocks.quote.mockResolvedValueOnce({ ok: false, error: "Giá chưa xác nhận" })
    await render()
    let finish!: (value: { ok: boolean; data: typeof quote }) => void
    mocks.quote.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    await click("Thử xác nhận lại giá")
    expect(host.textContent).not.toContain("Giá chưa xác nhận")
    expect(button("Gửi yêu cầu").disabled).toBe(true)
    await act(async () => { finish({ ok: true, data: quote }) })
    expect(button("Gửi yêu cầu").disabled).toBe(false)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("turns a rejected quote request into a visible recoverable error", async () => {
    mocks.quote.mockRejectedValueOnce(new Error("network"))
    await render()
    expect(host.textContent).toContain("Không xác nhận được tổng tiền. Kiểm tra kết nối và thử lại.")
    await click("Thử xác nhận lại giá")
    expect(button("Gửi yêu cầu").disabled).toBe(false)
  })
  it("distinguishes an availability error from a full calendar and retains the chosen day on retry", async () => {
    mocks.params.delete("time")
    mocks.slots.mockResolvedValueOnce({ ok: false, error: "Không tải được giờ trống." })
    await render(); await click("Tiếp tục")
    expect(host.textContent).toContain("Không tải được giờ trống.")
    expect(host.textContent).not.toContain("đã kín lịch")
    await click("Thử tải lại giờ trống")
    expect(button("09:00")).toBeDefined()
    expect(mocks.slots.mock.calls.map(([input]) => input.date)).toEqual([mocks.params.get("date"), mocks.params.get("date")])
  })
  it("lets a resumed confirmation recover when availability fails", async () => {
    mocks.slots.mockRejectedValueOnce(new Error("network"))
    await render()
    expect(button("Chọn lại giờ").disabled).toBe(false)
    await click("Chọn lại giờ")
    expect(host.textContent).toContain("Không tải được giờ trống")
    await click("Thử tải lại giờ trống")
    expect(button("09:00")).toBeDefined()
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("keeps both dates and exact times in the login return URL", async () => {
    mocks.state = { ...mocks.state, session: null }
    await render(); await click("Gửi yêu cầu")
    const login = new URL(mocks.push.mock.calls[0][0], "http://localhost")
    const resume = new URL(login.searchParams.get("next")!, "http://localhost")
    expect(resume.searchParams.get("secondDate")).toBe(mocks.params.get("secondDate"))
    expect(resume.searchParams.get("secondTime")).toBe("10:30")
    expect(resume.searchParams.get("time")).toBe("09:00")
  })
})
