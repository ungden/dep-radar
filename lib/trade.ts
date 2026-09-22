import { CATEGORIES, getVertical, verticalOf } from "./catalog"
import type { Category, CategoryId, ServiceTemplate, VerticalId } from "./types"

/**
 * Words that depend on the trade. A makeup artist is "chuyên viên", someone
 * with a camera is "người chụp", a model is "mẫu"; a page that mixes them says
 * "người làm". Shared by web and native, so the two never disagree.
 */

export function tradesOf(categories: readonly CategoryId[]): VerticalId[] {
  return [...new Set(categories.map(verticalOf))]
}

/** What to call the person behind these categories. */
export function personWord(categories: readonly CategoryId[]): string {
  const trades = tradesOf(categories)
  return trades.length === 1 ? getVertical(trades[0]).person : "người làm"
}

/**
 * How people search for a category, which is not always its label: nobody
 * types "Tóc tại nhà", they type "làm tóc tại nhà"; "Mẫu ảnh" is hired, so
 * the search is "thuê mẫu ảnh".
 */
const PHRASE: Partial<Record<CategoryId, string>> = {
  hair: "Làm tóc",
  "lash-brow": "Làm mi & mày",
  photophone: "Chụp ảnh điện thoại",
  camera: "Chụp ảnh máy ảnh",
  "short-video": "Quay clip ngắn",
  "product-photo": "Chụp ảnh sản phẩm",
  "model-photo": "Thuê mẫu ảnh",
  "model-video": "Thuê mẫu clip & livestream",
}

export const categoryPhrase = (category: Pick<Category, "id" | "label">) => PHRASE[category.id] ?? category.label

/**
 * "Nail tại nhà Hà Nội" for beauty, which comes to the customer's home;
 * "Chụp ảnh điện thoại ở Hà Nội" for photo and models, which happen wherever
 * the customer picks, so "tại nhà" would be wrong.
 */
export function landingTitle(category: Category, city: string) {
  const phrase = categoryPhrase(category)
  return category.vertical === "beauty" ? `${phrase} tại nhà ${city}` : `${phrase} ở ${city}`
}

export function landingDescription(category: Category, city: string, freeTravelKm: number) {
  const phrase = categoryPhrase(category).toLowerCase()
  if (category.vertical === "beauty")
    return `Đặt ${phrase} tại nhà ở ${city}. Xem tác phẩm thật, giá niêm yết theo khung chuẩn, khách không trả phí nền tảng, miễn phí di chuyển trong ${freeTravelKm} km.`
  if (category.vertical === "photo")
    return `${categoryPhrase(category)} ở ${city}: xem ảnh thật, giá theo gói rõ ràng, chụp tại địa điểm bạn chọn. Khách không trả phí nền tảng.`
  return `${categoryPhrase(category)} ở ${city}: mẫu đã xác minh danh tính, giá theo giờ rõ ràng, làm việc tại địa điểm bạn chọn. Khách không trả phí nền tảng.`
}

export const categoriesInTrade = (vertical: VerticalId | "all") =>
  vertical === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.vertical === vertical)

/** Lowest and highest price the catalogue allows for a service, over all its options. */
export function priceBand(template: Pick<ServiceTemplate, "variants">): [number, number] | null {
  if (!template.variants.length) return null
  return [Math.min(...template.variants.map((v) => v.minPrice)), Math.max(...template.variants.map((v) => v.maxPrice))]
}

/** Where a service happens, in the words a customer uses. */
export function placeLabel(template: Pick<ServiceTemplate, "onLocation" | "studioOnly">, pro?: { homeService: boolean; studioAddress?: string }) {
  if (template.onLocation) return "Tại địa điểm bạn chọn"
  if (template.studioOnly) return "Tại studio"
  if (!pro) return "Tại nhà bạn hoặc tại studio"
  if (pro.homeService) return pro.studioAddress ? "Tại nhà bạn hoặc tại studio" : "Tại nhà bạn"
  return "Tại studio"
}

/** A line of "what's included" that is really what is not ("Không bao gồm makeup"). */
export const excludes = (line: string) => /^không\b/i.test(line.trim())
