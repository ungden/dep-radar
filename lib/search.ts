import { CATALOG, categoryLabel, getVertical, verticalOf } from "./catalog"
import type { CategoryId } from "./types"

/** Lower case, no accents, "đ" as "d": "Chụp điện thoại" matches "chup dien thoai". */
export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
}

/**
 * Every word of the query has to appear somewhere in the text, in any order:
 * "nail ba dinh" finds a nail artist in Ba Đình even though the two words are
 * in different fields.
 */
export function matchesQuery(haystack: string, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const text = normalize(haystack)
  return words.every((w) => text.includes(w))
}

/** The words a category is found by: its label, its trade, and the names of its services. */
export function categoryTerms(category: CategoryId) {
  const names = CATALOG.filter((t) => t.category === category).map((t) => t.name)
  return [categoryLabel(category), getVertical(verticalOf(category)).label, ...names].join(" ")
}
