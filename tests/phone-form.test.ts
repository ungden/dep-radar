// @vitest-environment jsdom

import { act, createElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PhoneForm } from "@/app/me/so-dien-thoai/phone-form"

const { save, replace, refresh } = vi.hoisted(() => ({
  save: vi.fn(), replace: vi.fn(), refresh: vi.fn(),
}))
vi.mock("@/lib/auth/actions", () => ({ setMyPhone: save }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }))

let root: Root
let host: HTMLDivElement
let input: HTMLInputElement
let form: HTMLFormElement
let button: HTMLButtonElement

async function enter(phone: string) {
  await act(async () => {
    // Dispatch a real input change, rather than changing React's state directly.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, phone)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

async function submit() {
  await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })) })
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  save.mockReset()
  host = document.createElement("div")
  document.body.append(host)
  root = createRoot(host)
  await act(async () => { root.render(createElement(PhoneForm, { next: "/bookings" })) })
  input = host.querySelector("input")!
  form = host.querySelector("form")!
  button = host.querySelector("button")!
})

afterEach(async () => {
  await act(async () => { root.unmount() })
  host.remove()
})

describe("phone form recovery", () => {
  it("accepts a different number after a duplicate and clears the old error", async () => {
    save.mockResolvedValueOnce({ ok: false, error: "Số điện thoại này đã thuộc một tài khoản khác." })
      .mockResolvedValueOnce({ ok: true })
    await enter("0900000321")
    await submit()
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("tài khoản khác")
    expect(button.disabled).toBe(false)
    expect(input.disabled).toBe(false)
    expect(replace).not.toHaveBeenCalled()

    await enter("0900000322")
    expect(host.querySelector('[role="alert"]')).toBeNull()
    expect(input.getAttribute("aria-invalid")).toBe("false")
    expect(button.disabled).toBe(false)
    await submit()
    expect(save.mock.calls.map(([phone]) => phone)).toEqual(["0900000321", "0900000322"])
    expect(replace).toHaveBeenCalledWith("/bookings")
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("unlocks the form when the server action rejects, then allows a retry", async () => {
    save.mockRejectedValueOnce(new Error("connection lost")).mockResolvedValueOnce({ ok: true })
    await enter("0900000321")
    await submit()
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("Kiểm tra kết nối")
    expect(button.disabled).toBe(false)
    expect(button.textContent).toBe("Lưu và tiếp tục")
    expect(input.disabled).toBe(false)
    await enter("0900000322")
    await submit()
    expect(save).toHaveBeenCalledTimes(2)
    expect(replace).toHaveBeenCalledWith("/bookings")
  })

  it("ignores simultaneous submits and restores editing after a failed request", async () => {
    let finish!: (result: { ok: false; error: string }) => void
    save.mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
      .mockResolvedValueOnce({ ok: true })
    await enter("0900000321")
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })
    expect(save).toHaveBeenCalledOnce()
    expect(button.disabled).toBe(true)
    expect(input.disabled).toBe(true)
    await act(async () => { finish({ ok: false, error: "Số điện thoại này đã thuộc một tài khoản khác." }) })
    expect(input.disabled).toBe(false)
    await enter("0900000322")
    await submit()
    expect(save).toHaveBeenCalledTimes(2)
    expect(replace).toHaveBeenCalledWith("/bookings")
  })
})
