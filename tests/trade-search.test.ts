import { describe, expect, it } from "vitest"
import { CATEGORIES, getTemplate } from "@/lib/catalog"
import { categoryTerms, matchesQuery, normalize } from "@/lib/search"
import { excludes, landingDescription, landingTitle, personWord, placeLabel, priceBand } from "@/lib/trade"

const cat = (id: string) => CATEGORIES.find((c) => c.id === id)!

describe("landing titles fit the trade", () => {
  it("says 'tại nhà' only for beauty", () => {
    expect(landingTitle(cat("nail"), "Hà Nội")).toBe("Nail tại nhà Hà Nội")
    expect(landingTitle(cat("hair"), "Hà Nội")).toBe("Làm tóc tại nhà Hà Nội")
    expect(landingTitle(cat("photophone"), "Hà Nội")).toBe("Chụp ảnh điện thoại ở Hà Nội")
    expect(landingTitle(cat("model-photo"), "Hà Nội")).toBe("Thuê mẫu ảnh ở Hà Nội")
    for (const c of CATEGORIES.filter((c) => c.vertical !== "beauty")) {
      expect(landingTitle(c, "Đà Nẵng")).not.toContain("tại nhà")
      expect(landingDescription(c, "Đà Nẵng", 5)).not.toContain("tại nhà")
    }
  })
})

describe("trade words", () => {
  it("names the person by trade, and generically when trades mix", () => {
    expect(personWord(["nail"])).toBe("chuyên viên")
    expect(personWord(["photophone", "camera"])).toBe("người chụp")
    expect(personWord(["model-photo"])).toBe("mẫu")
    expect(personWord(["makeup", "photophone"])).toBe("người làm")
  })

  it("describes where a service happens", () => {
    expect(placeLabel(getTemplate("photo-phone")!)).toBe("Tại địa điểm bạn chọn")
    expect(placeLabel(getTemplate("hair-color")!)).toBe("Tại studio")
    expect(placeLabel(getTemplate("nail-gel")!, { homeService: true })).toBe("Tại nhà bạn")
  })

  it("tells an exclusion from an inclusion", () => {
    expect(excludes("Không bao gồm makeup & người chụp")).toBe(true)
    expect(excludes("Khăn nóng")).toBe(false)
  })

  it("gives the catalogue price band", () => {
    expect(priceBand(getTemplate("photo-phone")!)).toEqual([120_000, 900_000])
  })
})

describe("search", () => {
  it("ignores accents and word order", () => {
    expect(normalize("Chụp điện thoại")).toBe("chup dien thoai")
    expect(matchesQuery("Nail thiết kế · Ba Đình", "ba dinh nail")).toBe(true)
    expect(matchesQuery("Nail thiết kế", "makeup")).toBe(false)
    expect(matchesQuery("anything", "  ")).toBe(true)
  })

  it("finds the new trades by category label and service name", () => {
    expect(matchesQuery(categoryTerms("model-video"), "livestream")).toBe(true)
    expect(matchesQuery(categoryTerms("photophone"), "photo tour")).toBe(true)
    expect(matchesQuery(categoryTerms("product-photo"), "chup san pham")).toBe(true)
    expect(matchesQuery(categoryTerms("model-photo"), "nguoi mau")).toBe(true)
  })
})
