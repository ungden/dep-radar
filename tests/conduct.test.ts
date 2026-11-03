import { describe, expect, it } from "vitest"
import { CHAT_ASKS, customerNote, needsConductNote, offAppHint } from "@/lib/conduct"

describe("offAppHint", () => {
  it("stays quiet for ordinary booking talk", () => {
    expect(offAppHint("Mình ở tầng 3, chị đến lúc 9 giờ nhé")).toBeNull()
    expect(offAppHint("Em làm màu nude được không ạ?")).toBeNull()
  })
  it("flags moving the chat to another app", () => {
    expect(offAppHint("Kết bạn Zalo với em nha")).toMatch(/ngoài 360đẹp/)
    expect(offAppHint("ib facebook mình nhé")).toMatch(/ngoài 360đẹp/)
  })
  it("flags money before the job, ahead of off-app talk", () => {
    expect(offAppHint("Chị chuyển khoản trước giúp em")).toMatch(/Không chuyển tiền trước/)
    expect(offAppHint("đặt cọc 100k qua zalo nhé")).toMatch(/Không chuyển tiền trước/)
    expect(offAppHint("gửi em stk")).toMatch(/Không chuyển tiền trước/)
  })
})

describe("needsConductNote", () => {
  it("shows the healthy-services rule only where it is at risk", () => {
    expect(needsConductNote("massage")).toBe(true)
    expect(needsConductNote("model-photo")).toBe(true)
    expect(needsConductNote("model-video")).toBe(true)
    expect(needsConductNote("makeup")).toBe(false)
    expect(needsConductNote("nail")).toBe(false)
    expect(needsConductNote("photophone")).toBe(false)
    expect(needsConductNote(null)).toBe(false)
  })
})

describe("customerNote", () => {
  it("tells a partner whether the customer is new, and never to take money first", () => {
    expect(customerNote({ withMe: 0, overall: 0 })).toMatchObject({ regular: false, title: "Khách đặt lần đầu" })
    expect(customerNote({ withMe: 0, overall: 4 }).title).toContain("Khách mới với bạn")
    expect(customerNote({ withMe: 3, overall: 4 })).toMatchObject({ regular: true, title: "Khách quen, đã đặt bạn 3 lần" })
    for (const words of [customerNote({ withMe: 0, overall: 0 }).text, CHAT_ASKS.location, CHAT_ASKS.confirm("14:00")]) {
      expect(offAppHint(words ?? "")).toBeNull()
    }
  })
})
