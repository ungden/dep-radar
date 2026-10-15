import { describe, expect, it } from "vitest"
import {
  CITIES,
  LEGACY_DISTRICTS,
  WARDS,
  cityOfPoint,
  districtPoint,
  districtsOf,
  isLegacyDistrict,
  placeWords,
  searchWards,
  travelDistanceKm,
  wardOfPoint,
} from "@/lib/geo"
import { LOCATION_BODY_PREFIX, isLocationBody, mapsLink } from "@/lib/chat-location"

// Rough boxes around each city after the 2025 mergers (TP.HCM with Bình Dương
// and Bà Rịa - Vũng Tàu, Đà Nẵng with Quảng Nam), offshore zones left out.
const BOUNDS: Record<string, { lat: [number, number]; lng: [number, number] }> = {
  "Hà Nội": { lat: [20.5, 21.45], lng: [105.25, 106.05] },
  "TP.HCM": { lat: [10.3, 11.55], lng: [106.3, 107.65] },
  "Đà Nẵng": { lat: [14.9, 16.25], lng: [107.2, 108.8] },
}

describe("wards after the 2025 reform", () => {
  it("covers the three cities with today's units, each named with its type, once", () => {
    expect(CITIES).toEqual(["Hà Nội", "TP.HCM", "Đà Nẵng"])
    for (const city of CITIES) {
      const names = districtsOf(city)
      expect(names.length).toBeGreaterThan(80)
      expect(new Set(names).size).toBe(names.length)
      for (const name of names) expect(name).toMatch(/^(Phường|Xã|Đặc khu) \S/)
    }
  })

  it("puts every centre inside its city", () => {
    for (const city of CITIES)
      for (const w of WARDS[city]) {
        const box = BOUNDS[city]
        expect(w.lat, `${city}: ${w.name}`).toBeGreaterThan(box.lat[0])
        expect(w.lat, `${city}: ${w.name}`).toBeLessThan(box.lat[1])
        expect(w.lng, `${city}: ${w.name}`).toBeGreaterThan(box.lng[0])
        expect(w.lng, `${city}: ${w.name}`).toBeLessThan(box.lng[1])
      }
  })

  it("no longer offers a quận, but still prices a row saved with one", () => {
    for (const city of CITIES)
      for (const old of Object.keys(LEGACY_DISTRICTS[city])) {
        expect(districtsOf(city)).not.toContain(old)
        expect(isLegacyDistrict(city, old)).toBe(true)
        expect(districtPoint(city, old)).not.toBeNull()
      }
    expect(travelDistanceKm("TP.HCM", "Quận 1", "TP.HCM", "Quận 7")).toBeGreaterThan(2)
  })

  it("finds a ward by its name without marks, or by the old quận it came from", () => {
    const first = WARDS["TP.HCM"][0]
    const bare = first.name.replace(/^(Phường|Xã|Đặc khu) /, "")
    expect(searchWards("TP.HCM", bare.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d"))[0].name).toBe(first.name)
    // Quận 1 is gone; its wards still come up for it.
    const q1 = searchWards("TP.HCM", "quận 1")
    expect(searchWards("TP.HCM", "Q1")).toEqual(q1)
    expect(q1.length).toBeGreaterThan(0)
    expect(q1.every((w) => /Quận 1\b/.test(`${w.name} ${w.formerly}`))).toBe(true)
    expect(searchWards("Hà Nội", "")).toHaveLength(WARDS["Hà Nội"].length)
    expect(searchWards("Hà Nội", "zzzz không có")).toHaveLength(0)
  })

  it("says a place in full for search", () => {
    const w = WARDS["Hà Nội"][0]
    expect(placeWords("Hà Nội", w.name)).toContain(w.formerly)
  })

  it("matches a point to the nearest ward, and nothing far from the cities", () => {
    for (const city of CITIES) {
      const w = WARDS[city][Math.floor(WARDS[city].length / 2)]
      expect(wardOfPoint([w.lat, w.lng])).toEqual({ city, district: w.name })
      expect(cityOfPoint([w.lat + 0.001, w.lng])).toBe(city)
    }
    expect(wardOfPoint([12.24, 109.19])).toBeNull() // Nha Trang
    expect(wardOfPoint([8.68, 106.6])).toBeNull() // Côn Đảo: no booking travels there
  })
})

describe("a location in chat", () => {
  it("opens Google Maps at the point, as the body older apps show", () => {
    expect(mapsLink(10.7757123, 106.7004987)).toBe("https://www.google.com/maps/search/?api=1&query=10.77571,106.7005")
    expect(isLocationBody(`${LOCATION_BODY_PREFIX}10.77571,106.7005`)).toBe(true)
    expect(isLocationBody("Vị trí nhà em ở hẻm 12")).toBe(false)
  })
})
