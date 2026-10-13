import { describe, expect, it } from "vitest"
import { offAppHint } from "@/lib/conduct"

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
