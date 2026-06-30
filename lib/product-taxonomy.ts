import type { Product, ProductCategoryKey } from "@/lib/types"

export interface ProductSubcategory {
  key: string
  label: string
  keywords: string[]
}

export interface ProductCategory {
  key: ProductCategoryKey
  label: string
  displayCategory: string
  description: string
  subcategories: ProductSubcategory[]
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    key: "skincare",
    label: "Skincare",
    displayCategory: "Skincare",
    description: "Làm sạch, dưỡng, chống nắng, treatment và phục hồi da mặt.",
    subcategories: [
      { key: "cleanser", label: "Sữa rửa mặt / làm sạch", keywords: ["cleanser", "sữa rửa mặt", "tẩy trang", "micellar", "làm sạch"] },
      { key: "serum", label: "Serum / essence", keywords: ["serum", "essence", "tinh chất", "b5", "vitamin c", "niacinamide"] },
      { key: "moisturizer", label: "Kem dưỡng", keywords: ["kem dưỡng", "moisturizer", "cream", "lotion", "ceramide"] },
      { key: "sunscreen", label: "Kem chống nắng", keywords: ["chống nắng", "sunscreen", "spf", "uv"] },
      { key: "treatment", label: "Treatment", keywords: ["retinol", "bha", "aha", "acid", "treatment", "mụn"] },
    ],
  },
  {
    key: "haircare",
    label: "Haircare",
    displayCategory: "Haircare",
    description: "Gội, xả, ủ, scalp care và styling tóc.",
    subcategories: [
      { key: "shampoo", label: "Dầu gội", keywords: ["dầu gội", "shampoo", "dry shampoo", "gội khô"] },
      { key: "conditioner", label: "Dầu xả", keywords: ["dầu xả", "conditioner"] },
      { key: "hair_mask", label: "Ủ tóc / mask tóc", keywords: ["ủ tóc", "hair mask", "mask tóc", "keratin"] },
      { key: "scalp_care", label: "Scalp care", keywords: ["da đầu", "scalp", "gàu", "rụng tóc"] },
      { key: "styling", label: "Styling", keywords: ["styling", "keo xịt", "wax", "tạo kiểu"] },
    ],
  },
  {
    key: "makeup",
    label: "Makeup",
    displayCategory: "Makeup",
    description: "Base makeup, mắt, môi, má và dụng cụ makeup.",
    subcategories: [
      { key: "foundation", label: "Kem nền / base", keywords: ["foundation", "kem nền", "cushion", "concealer", "fit me"] },
      { key: "lip", label: "Son môi", keywords: ["son", "lip", "lipstick", "tint", "powder kiss"] },
      { key: "eye", label: "Mắt", keywords: ["mascara", "eyeliner", "phấn mắt", "brow"] },
      { key: "cheek", label: "Má / contour", keywords: ["blush", "má hồng", "contour", "bronzer"] },
    ],
  },
  {
    key: "fragrance",
    label: "Fragrance",
    displayCategory: "Perfume",
    description: "Nước hoa, body mist và mùi hương cá nhân.",
    subcategories: [
      { key: "edp", label: "EDP", keywords: ["edp", "eau de parfum", "nước hoa"] },
      { key: "edt", label: "EDT", keywords: ["edt", "eau de toilette"] },
      { key: "body_mist", label: "Body mist", keywords: ["body mist", "mist"] },
    ],
  },
  {
    key: "bodycare",
    label: "Bodycare",
    displayCategory: "Bodycare",
    description: "Dưỡng thể, chống nắng body, làm sạch và khử mùi.",
    subcategories: [
      { key: "body_lotion", label: "Sữa dưỡng thể", keywords: ["body lotion", "sữa dưỡng thể", "vaseline", "gluta"] },
      { key: "body_sunscreen", label: "Chống nắng body", keywords: ["body sunscreen", "chống nắng body", "spf"] },
      { key: "deodorant", label: "Khử mùi", keywords: ["deodorant", "khử mùi", "lăn khử mùi"] },
      { key: "body_wash", label: "Sữa tắm", keywords: ["sữa tắm", "body wash", "shower gel"] },
    ],
  },
  {
    key: "beauty_tools_tech",
    label: "Beauty Tools/Tech",
    displayCategory: "Beauty Tools/Tech",
    description: "Máy rửa mặt, LED, máy sấy, dụng cụ và thiết bị làm đẹp.",
    subcategories: [
      { key: "device", label: "Thiết bị", keywords: ["máy", "device", "led", "foreo", "dryer"] },
      { key: "tool", label: "Dụng cụ", keywords: ["cọ", "brush", "tool", "bông mút", "sponge"] },
    ],
  },
  {
    key: "clinic_treatment",
    label: "Clinic/Treatment",
    displayCategory: "Clinic / Treatment",
    description: "Dịch vụ clinic, peel, laser và treatment chuyên sâu.",
    subcategories: [
      { key: "laser", label: "Laser", keywords: ["laser", "ipl", "pico"] },
      { key: "peel", label: "Peel", keywords: ["peel", "chemical peel"] },
      { key: "injectable", label: "Injectable", keywords: ["botox", "filler", "tiêm"] },
    ],
  },
  {
    key: "nails_lash_brow",
    label: "Nails/Lash/Brow",
    displayCategory: "Nails / Mi / Mày",
    description: "Nail, mi, lông mày và sản phẩm chăm sóc liên quan.",
    subcategories: [
      { key: "nail", label: "Nails", keywords: ["nail", "móng"] },
      { key: "lash", label: "Lash", keywords: ["mi", "lash"] },
      { key: "brow", label: "Brow", keywords: ["mày", "brow"] },
    ],
  },
  {
    key: "men_grooming",
    label: "Men Grooming",
    displayCategory: "Men Grooming",
    description: "Skincare, tóc, râu và grooming cho nam.",
    subcategories: [
      { key: "men_skincare", label: "Skincare nam", keywords: ["men", "nam", "grooming", "skincare nam"] },
      { key: "shaving", label: "Cạo râu", keywords: ["cạo râu", "shaving", "beard"] },
    ],
  },
]

export const PRODUCT_CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((category) => ({
  value: category.key,
  label: category.label,
}))

const LEGACY_CATEGORY_MAP: Record<string, ProductCategoryKey> = {
  skincare: "skincare",
  "chăm sóc da": "skincare",
  makeup: "makeup",
  "trang điểm": "makeup",
  haircare: "haircare",
  "chăm sóc tóc": "haircare",
  perfume: "fragrance",
  fragrance: "fragrance",
  "mùi hương": "fragrance",
  bodycare: "bodycare",
  "body care": "bodycare",
  tools: "beauty_tools_tech",
  supplements: "men_grooming",
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
}

export function getProductCategory(key?: string | null) {
  return PRODUCT_CATEGORIES.find((category) => category.key === key) ?? null
}

export function getProductCategoryLabel(key?: string | null, fallback = "Chưa phân loại") {
  return getProductCategory(key)?.label ?? fallback
}

export function getProductSubcategory(categoryKey?: string | null, subcategoryKey?: string | null) {
  return getProductCategory(categoryKey)?.subcategories.find((subcategory) => subcategory.key === subcategoryKey) ?? null
}

export function getProductSubcategoryLabel(categoryKey?: string | null, subcategoryKey?: string | null, fallback = "Chưa chọn nhóm con") {
  return getProductSubcategory(categoryKey, subcategoryKey)?.label ?? fallback
}

export function deriveProductTaxonomy(product: Pick<Product, "name" | "brand" | "category" | "tags" | "description">): {
  category_key: ProductCategoryKey
  subcategory_key: string
} {
  const legacyKey = LEGACY_CATEGORY_MAP[normalizeText(product.category ?? "")] ?? "skincare"
  const haystack = normalizeText([
    product.name ?? "",
    product.brand ?? "",
    product.category ?? "",
    product.description ?? "",
    ...(product.tags ?? []),
  ].join(" "))
  const category = PRODUCT_CATEGORIES.find((item) => item.key === legacyKey) ?? PRODUCT_CATEGORIES[0]
  const subcategory = category.subcategories.find((item) => item.keywords.some((keyword) => haystack.includes(normalizeText(keyword))))
    ?? category.subcategories[0]

  return { category_key: category.key, subcategory_key: subcategory.key }
}

export function productWithTaxonomy<T extends Product>(product: T): T {
  const derived = deriveProductTaxonomy(product)
  return {
    ...product,
    category_key: product.category_key ?? derived.category_key,
    subcategory_key: product.subcategory_key ?? derived.subcategory_key,
    category: product.category || getProductCategory(derived.category_key)?.displayCategory || "Skincare",
    concern_tags: product.concern_tags ?? [],
    ingredient_tags: product.ingredient_tags ?? [],
    aliases: product.aliases ?? [],
    status: product.status ?? "published",
  }
}

export function productsWithTaxonomy<T extends Product>(products: T[]) {
  return products.map(productWithTaxonomy)
}

export function productMatchesTaxonomy(product: Product, categoryKey: string) {
  if (categoryKey === "all") return true
  const normalized = productWithTaxonomy(product)
  return normalized.category_key === categoryKey
}
