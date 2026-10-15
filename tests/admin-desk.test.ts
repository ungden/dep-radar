import { describe, expect, it } from "vitest"
import { fold } from "@/app/admin/desk-shared"
import { TABS, isTab } from "@/app/admin/tabs"

describe("admin desk", () => {
  it("opens only known panels from ?tab=", () => {
    expect(isTab("overview")).toBe(true)
    expect(isTab("reviews")).toBe(true)
    expect(isTab("../me")).toBe(false)
    expect(isTab(undefined)).toBe(false)
    expect(new Set(TABS).size).toBe(TABS.length)
  })

  it("finds names without Vietnamese marks", () => {
    expect(fold("Dương Thị Hoà")).toBe("duong thi hoa")
    expect(fold("ĐẸP")).toBe("dep")
    expect(fold("Nguyễn Ánh").includes(fold("nguyen anh"))).toBe(true)
  })
})
