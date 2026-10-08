/** Approximate district centroids used to estimate travel distance. */
export const DISTRICT_COORDS: Record<string, Record<string, [number, number]>> = {
  "Hà Nội": {
    "Ba Đình": [21.0341, 105.8142],
    "Hoàn Kiếm": [21.0288, 105.8525],
    "Đống Đa": [21.0181, 105.829],
    "Cầu Giấy": [21.0362, 105.7906],
    "Thanh Xuân": [20.9937, 105.811],
    "Hai Bà Trưng": [21.0059, 105.8573],
    "Tây Hồ": [21.0707, 105.8188],
    "Long Biên": [21.0368, 105.8886],
    "Nam Từ Liêm": [21.012, 105.765],
    "Hà Đông": [20.9714, 105.7788],
  },
  "TP.HCM": {
    "Quận 1": [10.7757, 106.7004],
    "Quận 3": [10.7843, 106.6844],
    "Quận 7": [10.734, 106.7218],
    "Bình Thạnh": [10.8106, 106.7091],
    "Phú Nhuận": [10.7992, 106.6803],
    "Tân Bình": [10.8015, 106.6525],
    "Gò Vấp": [10.8386, 106.6652],
    "Thủ Đức": [10.8497, 106.7717],
  },
  "Đà Nẵng": {
    "Hải Châu": [16.0472, 108.2199],
    "Thanh Khê": [16.0666, 108.1896],
    "Sơn Trà": [16.0864, 108.2437],
    "Ngũ Hành Sơn": [16.0006, 108.2533],
    "Liên Chiểu": [16.0718, 108.15],
  },
}

export const CITIES = Object.keys(DISTRICT_COORDS)
export const districtsOf = (city: string) => Object.keys(DISTRICT_COORDS[city] ?? {})

/** A point on the map, [latitude, longitude]. */
export type LatLng = [number, number]

/** Roads are not straight lines: the straight distance times this is the estimate. */
export const ROAD_FACTOR = 1.35
/**
 * The shortest distance we quote. A person's point is their district's centre,
 * so anything closer than this would be precision we do not have.
 */
export const MIN_ROAD_KM = 2

function straightKm(a: LatLng, b: LatLng) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const roadKm = (a: LatLng, b: LatLng) => Math.round(straightKm(a, b) * ROAD_FACTOR * 10) / 10

export const districtPoint = (city: string, district: string): LatLng | null => DISTRICT_COORDS[city]?.[district] ?? null

/** Distance in km on the road between two districts (null when in different cities). */
export function travelDistanceKm(fromCity: string, fromDistrict: string, toCity: string, toDistrict: string): number | null {
  if (fromCity !== toCity) return null
  const a = districtPoint(fromCity, fromDistrict)
  const b = districtPoint(toCity, toDistrict)
  if (!a || !b) return null
  if (fromDistrict === toDistrict) return MIN_ROAD_KM
  return roadKm(a, b)
}

export const isLatLng = (value: unknown): value is LatLng =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((n) => typeof n === "number" && Number.isFinite(n)) &&
  Math.abs(value[0]) <= 90 &&
  Math.abs(value[1]) <= 180

/** How far from the nearest district centre a point can be and still count as in that city. */
export const CITY_REACH_KM = 40

/** The city a point is in: the one with the nearest district centre, if it is close enough. */
export function cityOfPoint(point: LatLng): string | null {
  let best: { city: string; km: number } | null = null
  for (const [city, districts] of Object.entries(DISTRICT_COORDS)) {
    for (const centre of Object.values(districts)) {
      const km = straightKm(point, centre)
      if (!best || km < best.km) best = { city, km }
    }
  }
  return best && best.km <= CITY_REACH_KM ? best.city : null
}

/**
 * Distance in km on the road from a raw point (the customer's own location)
 * to a district, with the same road factor and floor as `travelDistanceKm`.
 * Null when the district is not on the map or the point is in another city,
 * as `travelDistanceKm` is between cities.
 */
export function distanceFromPointKm(point: LatLng, toCity: string, toDistrict: string): number | null {
  if (!isLatLng(point)) return null
  const b = districtPoint(toCity, toDistrict)
  if (!b || cityOfPoint(point) !== toCity) return null
  return Math.max(MIN_ROAD_KM, roadKm(point, b))
}
