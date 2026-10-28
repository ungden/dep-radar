// @vitest-environment jsdom

import { act, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { KtvNetwork } from "@/app/studio/network/network"
import { McnDashboard } from "@/app/mcn/dashboard/workspace"
import { McnAdminDesk } from "@/app/admin/mcn/desk"
import type { McnCommission, McnMembership, McnOrganization, McnWorkspace } from "@/lib/mcn-types"

const api = vi.hoisted(() => ({
  mcnAdminReport: vi.fn(), scheduleMcnPolicy: vi.fn(), cancelMcnPolicy: vi.fn(),
  applyMcn: vi.fn(), reviewMcn: vi.fn(), inviteMcnPro: vi.fn(), respondMcnInvitation: vi.fn(), leaveMcn: vi.fn(),
  removeMcnPro: vi.fn(), saveMcnSupport: vi.fn(), recordMcnPayout: vi.fn(), reverseMcnCommission: vi.fn(), refresh: vi.fn(),
}))
vi.mock("@/lib/api/mcn", () => api)
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: api.refresh, push: vi.fn(), back: vi.fn() }) }))
vi.mock("@/components/require-session", () => ({ RequireSession: ({ children }: { children: ReactNode }) => <>{children}</> }))

const organization: McnOrganization = {
  id: "org-a", name: "Network kiểm thử", legalName: "Công ty kiểm thử", taxId: "1234567890", contactPhone: "0900000001",
  city: "Hà Nội", description: "Hướng dẫn hồ sơ và hỗ trợ chất lượng dịch vụ.", status: "approved", reviewNote: null,
  createdAt: "2026-10-01T00:00:00Z", isOwner: false, bankName: "Ngân hàng kiểm thử", bankAccount: "123456789", bankHolder: "CONG TY KIEM THU",
}
const invitation: McnMembership = {
  id: "invite-a", organizationId: organization.id, organizationName: organization.name, proId: "pro-a", proSlug: "ktv-a", proName: "KTV kiểm thử",
  city: "Hà Nội", status: "invited", invitedAt: "2026-10-28T00:00:00Z", expiresAt: "2026-11-04T00:00:00Z", joinedAt: null, endedAt: null,
  supportNote: "", nextFollowUp: null, published: true, acceptingJobs: true, completedJobs: 2, rating: 5, isMine: true,
}
const earning: McnCommission = {
  id: "earning-a", organizationId: organization.id, organizationName: organization.name, bookingCode: "BOOKINGA", proName: "KTV kiểm thử",
  servicePrice: 5000000, commission: 1000000, amount: 200000, platformAmount: 800000, completedAt: "2026-10-01T00:00:00Z",
  availableAt: "2026-10-08T00:00:00Z", status: "held", eligible: true, holdReason: null, payoutId: null, paidAt: null, adjustmentReason: null, recoveredAt: null,
}
function workspace(overrides: Partial<McnWorkspace> = {}): McnWorkspace {
  return { available: true, error: null, isAdmin: false, isPro: true, organizations: [organization], memberships: [invitation], commissions: [], payouts: [], ...overrides }
}

let root: Root
let host: HTMLDivElement
async function render(children: ReactNode) { await act(async () => root.render(children)) }
function button(text: string, within: ParentNode = host) {
  const found = [...within.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.trim() === text)
  if (!found) throw new Error(`Button not found: ${text}`)
  return found
}
async function click(element: HTMLElement) { await act(async () => element.click()) }
async function enter(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}
async function submit(form: HTMLFormElement) { await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) }) }

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  Object.values(api).forEach((mock) => mock.mockReset())
  api.mcnAdminReport.mockResolvedValue({ok:false,error:"Report unavailable in this fixture"})
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
  host = document.createElement("div")
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
})

describe("KTV network consent", () => {
  it("requires consent, passes the exact invitation, and keeps server errors recoverable", async () => {
    let finish!: (result: { ok: false; error: string }) => void
    api.respondMcnInvitation.mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
      .mockResolvedValueOnce({ ok: true, data: "invite-a" })
    await render(<KtvNetwork workspace={workspace()} />)
    expect(host.textContent).toContain(organization.description)
    await click(button("Xem & xác nhận"))
    const dialog = host.querySelector<HTMLDialogElement>("dialog[open]")!
    const accept = button("Đồng ý gia nhập", dialog)
    expect(accept.disabled).toBe(true)
    await click(accept)
    expect(api.respondMcnInvitation).not.toHaveBeenCalled()
    await click(dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')!)
    expect(accept.disabled).toBe(false)
    await click(accept)
    expect(api.respondMcnInvitation).toHaveBeenCalledExactlyOnceWith("invite-a", true)
    expect(button("Đang xác nhận…", dialog).disabled).toBe(true)
    await act(async () => { finish({ ok: false, error: "Lời mời cần được cập nhật." }) })
    expect(dialog.querySelector('[role="alert"]')?.textContent).toContain("Lời mời cần được cập nhật.")
    expect(button("Đồng ý gia nhập", dialog).disabled).toBe(false)
    await click(button("Đồng ý gia nhập", dialog))
    expect(api.respondMcnInvitation).toHaveBeenCalledTimes(2)
    expect(api.refresh).toHaveBeenCalledOnce()
    expect(dialog.open).toBe(false)
  })

  it("does not offer joining a suspended network or a second network while already active", async () => {
    await render(<KtvNetwork workspace={workspace({ organizations: [{ ...organization, status: "suspended" }] })} />)
    expect(button("Xem & xác nhận").disabled).toBe(true)
    expect(host.textContent).toContain("Network hiện chưa hoạt động")
    await render(<KtvNetwork workspace={workspace({ memberships: [invitation, { ...invitation, id: "active-a", status: "active", joinedAt: "2026-10-01T00:00:00Z" }] })} />)
    expect(button("Xem & xác nhận").disabled).toBe(true)
    expect(api.respondMcnInvitation).not.toHaveBeenCalled()
    api.leaveMcn.mockResolvedValueOnce({ ok: true, data: "active-a" })
    await click(button("Rời network"))
    await click(button("Xác nhận rời network"))
    expect(api.leaveMcn).toHaveBeenCalledExactlyOnceWith("active-a")
  })
})

describe("MCN owner invitations", () => {
  it("sends the exact trimmed slug once while pending, preserves errors, and allows retry", async () => {
    let finish!: (result: { ok: false; error: string }) => void
    api.inviteMcnPro.mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
      .mockResolvedValueOnce({ ok: true, data: "new-invite" })
    await render(<McnDashboard workspace={workspace({ organizations: [{ ...organization, isOwner: true }], memberships: [] })} />)
    const input = host.querySelector<HTMLInputElement>('input[placeholder="VD: nguyen-thi-lan"]')!
    await enter(input, "  nguyen-thi-lan  ")
    const form = input.closest("form")!
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })
    expect(api.inviteMcnPro).toHaveBeenCalledExactlyOnceWith("org-a", "nguyen-thi-lan")
    expect(button("Gửi lời mời").disabled).toBe(true)
    await act(async () => { finish({ ok: false, error: "KTV chưa mở hồ sơ." }) })
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("KTV chưa mở hồ sơ.")
    expect(input.value).toBe("  nguyen-thi-lan  ")
    expect(button("Gửi lời mời").disabled).toBe(false)
    await submit(form)
    expect(api.inviteMcnPro).toHaveBeenCalledTimes(2)
    expect(input.value).toBe("")
    expect(api.refresh).toHaveBeenCalledOnce()
    expect(host.querySelector('[role="alert"]')).toBeNull()
  })

  it("unlocks after a transport failure without claiming that an invite was sent", async () => {
    api.inviteMcnPro.mockRejectedValueOnce(new Error("transport failure"))
    await render(<McnDashboard workspace={workspace({ organizations: [{ ...organization, isOwner: true }], memberships: [] })} />)
    const input = host.querySelector<HTMLInputElement>('input[placeholder="VD: nguyen-thi-lan"]')!
    await enter(input, "ktv-a")
    await submit(input.closest("form")!)
    expect(button("Gửi lời mời").disabled).toBe(false)
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("Tải lại để kiểm tra kết quả")
    expect(api.refresh).not.toHaveBeenCalled()
  })
})

describe("MCN payout confirmation", () => {
  it("requires transfer consent and passes the frozen IDs and actual amount when eligibility changes", async () => {
    let finish!: (result: { ok: false; error: string }) => void
    api.recordMcnPayout.mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const initial = workspace({ isAdmin: true, commissions: [earning] })
    await render(<McnAdminDesk workspace={initial} />)
    const all = [...host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find((input) => input.parentElement?.textContent?.includes("Chọn tất cả"))!
    await click(all)
    await click(button("Kiểm tra & ghi nhận 200.000đ"))
    const dialog = host.querySelector<HTMLDialogElement>("dialog[open]")!
    const transferredAmount = dialog.querySelector<HTMLInputElement>('input[type="number"]')!
    const reference = dialog.querySelector<HTMLInputElement>('input[autocomplete="off"]')!
    await enter(reference, "BANK-TRANSFER-0001")
    expect(transferredAmount.value).toBe("200000")
    expect(button("Ghi nhận đã chuyển tiền", dialog).disabled).toBe(true)
    await click(dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')!)
    expect(button("Ghi nhận đã chuyển tiền", dialog).disabled).toBe(false)
    await enter(transferredAmount, "140000")
    expect(button("Ghi nhận đã chuyển tiền", dialog).disabled).toBe(true)
    await enter(transferredAmount, "200000")
    // A server refresh after the bank transfer now reports a hold. Never silently
    // drop that selected booking or reinterpret the amount already transferred.
    await render(<McnAdminDesk workspace={{ ...initial, commissions: [{ ...earning, eligible: false, holdReason: "Đang xử lý khiếu nại" }] }} />)
    expect(transferredAmount.value).toBe("200000")
    await submit(dialog.querySelector("form")!)
    expect(api.recordMcnPayout).toHaveBeenCalledExactlyOnceWith("org-a", ["earning-a"], "BANK-TRANSFER-0001", "", 200000)
    expect(button("Đang ghi nhận…", dialog).disabled).toBe(true)
    await act(async () => { finish({ ok: false, error: "Điều kiện đối soát đã thay đổi. Kiểm tra lại." }) })
    expect(dialog.querySelector('[role="alert"]')?.textContent).toContain("Điều kiện đối soát đã thay đổi")
    expect(api.refresh).not.toHaveBeenCalled()
    expect(dialog.open).toBe(true)
  })
})


describe("MCN dashboard",()=>{
 it("shows report errors without blocking the settlement desk",async()=>{
  await render(<McnAdminDesk workspace={workspace({isAdmin:true})}/>);
  expect(host.textContent).toContain("Report unavailable in this fixture");
  expect(host.textContent).toContain("Ghi nhận chuyển khoản đối soát");
 });
 it("shows consolidated period metrics and accounting exports",async()=>{
  api.mcnAdminReport.mockResolvedValue({ok:true,data:{policy:{feeShareRate:.2,holdDays:7,minimumPayout:100000},policies:[],events:[],daily:[],networks:[{
   id:organization.id,name:organization.name,status:'approved',active:2,invited:4,joined:2,activated:1,working:1,created:3,cancelled:1,no_shows:0,reported:1,completed:2,revenue:1000000,fee:200000,earned:40000,paid:20000,eligible:200000,held:40000,recovery:50000
  }]}});
  await render(<McnAdminDesk workspace={workspace({isAdmin:true})}/>);
  expect(host.textContent).toContain('50.0%');
  const links=[...host.querySelectorAll<HTMLAnchorElement>('a[href^="/admin/mcn/export?"]')];
  expect(links).toHaveLength(4);
  expect(links.map(a=>new URL(a.href).searchParams.get('kind'))).toEqual(['networks','commissions','payouts','events']);
  expect(host.textContent).toContain('150.000');
 });
});
