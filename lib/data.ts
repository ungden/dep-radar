import { isEvidenceRadarSchemaReady, isSupabaseSchemaReady, supabase } from "@/lib/supabase"
import { getPublishedEditorialPost, getPublishedEditorialPosts } from "@/lib/editorial"
import { deriveCreatorProductState, isPublicEvidenceEvent } from "@/lib/evidence-radar/state-engine"
import { REAL_KOLS } from "@/lib/kols-data"
import { productsWithTaxonomy, productWithTaxonomy } from "@/lib/product-taxonomy"
import { RESEARCHED_PRODUCTS } from "@/lib/product-research"
import { SAMPLE_CREATOR_PRODUCT_EVENTS, SAMPLE_PRODUCT_OFFERS } from "@/lib/timeline-data"
import type { CommunityReview, CreatorEvidenceItem, CreatorProductEvent, CreatorProductState, Kol, Post, Product, ProductOffer, Review } from "@/lib/types"

// Toàn bộ hồ sơ KOL/KOC đã xác minh nằm trong REAL_KOLS; hồ sơ mơ hồ bị loại khỏi public registry.
export const SAMPLE_KOLS: Kol[] = REAL_KOLS

export const EDITORIAL_AUTHOR_NAME = "360dep.vn Beauty Desk"
export const EDITORIAL_AUTHOR_AVATAR = "/brand/icon-192.png"

export const SAMPLE_PRODUCTS: Product[] = productsWithTaxonomy([
  { id: "1", name: "Hyaluronic Acid 2% + B5 Serum", brand: "The Ordinary", image: "/images/products/the-ordinary-hyaluronic-acid-2-b5.jpg", rating: 4.7, reviews: 0, sold: "Đang cập nhật", price: "300.000đ", category: "Skincare", category_key: "skincare", subcategory_key: "serum", concern_tags: ["da thiếu nước", "phục hồi", "da khô"], ingredient_tags: ["hyaluronic acid", "panthenol", "ceramides"], aliases: ["The Ordinary Hyaluronic Acid", "TO HA B5"], tags: ["HA", "B5", "Cấp ẩm"], affiliate_url: null, description: "Serum cấp ẩm có hyaluronic acid và B5, hợp routine phục hồi khi da thiếu nước hoặc cần lớp serum tối giản trước kem dưỡng." },
  { id: "2", name: "Fit Me Matte + Poreless Foundation", brand: "Maybelline New York", image: "/images/products/maybelline-fit-me-matte-poreless-foundation.jpg", rating: 4.5, reviews: 0, sold: "Đang cập nhật", price: "180.000đ", category: "Makeup", category_key: "makeup", subcategory_key: "foundation", concern_tags: ["nền", "da dầu", "lỗ chân lông"], ingredient_tags: ["oil-free"], aliases: ["Maybelline Fit Me"], tags: ["Foundation", "Drugstore", "Da dầu"], affiliate_url: null, description: "Kem nền drugstore finish matte tự nhiên, phù hợp da thường đến dầu và ngân sách học sinh sinh viên." },
  { id: "3", name: "Sensibio H2O Micellar Water", brand: "Bioderma", image: "/images/products/bioderma-sensibio-h2o-micellar-water.jpg", rating: 4.8, reviews: 0, sold: "Đang cập nhật", price: "320.000đ", category: "Skincare", category_key: "skincare", subcategory_key: "cleanser", concern_tags: ["làm sạch", "da nhạy cảm", "tẩy trang"], ingredient_tags: ["micellar technology"], aliases: ["Bioderma Sensibio", "Sensibio H2O"], tags: ["Micellar", "Da nhạy cảm", "Không cần rửa lại"], affiliate_url: null, description: "Nước tẩy trang micellar cho da nhạy cảm, dùng để làm sạch makeup, bụi mịn và kem chống nắng nhẹ trong routine tối giản." },
  { id: "4", name: "Powder Kiss Lip + Cheek Mousse", brand: "MAC Cosmetics", image: "/images/products/mac-powder-kiss-lip-cheek-mousse.jpg", rating: 4.7, reviews: 0, sold: "Đang cập nhật", price: "720.000đ", category: "Makeup", category_key: "makeup", subcategory_key: "lip", concern_tags: ["son lì", "má hồng", "môi khô"], ingredient_tags: ["mousse texture"], aliases: ["MAC Powder Kiss Liquid", "MAC Powder Kiss Mousse"], tags: ["Soft matte", "Lip & cheek", "Prestige"], affiliate_url: null, description: "Son/má dạng mousse hazy matte, dùng cho môi và má khi muốn hiệu ứng blur mềm thay vì lớp lì khô." },
  { id: "5", name: "Perfect Serum Original", brand: "Mise-en-Scene", image: "/images/products/mise-en-scene-perfect-serum-original.jpg", rating: 4.6, reviews: 0, sold: "Đang cập nhật", price: "250.000đ", category: "Haircare", category_key: "haircare", subcategory_key: "styling", concern_tags: ["tóc khô xơ", "frizz", "tóc nhuộm"], ingredient_tags: ["argan oil", "camellia oil"], aliases: ["Mise en Scene Perfect Serum"], tags: ["Hair serum", "K-beauty", "Tóc khô"], affiliate_url: null, description: "Serum dưỡng tóc K-beauty cho tóc khô xơ, giúp giảm rối, thêm bóng và làm mềm phần đuôi tóc sau tạo kiểu." },
  { id: "6", name: "Hydrating Facial Cleanser", brand: "CeraVe", image: "/images/products/cerave-hydrating-facial-cleanser.jpg", rating: 4.8, reviews: 0, sold: "Đang cập nhật", price: "380.000đ", category: "Skincare", category_key: "skincare", subcategory_key: "cleanser", concern_tags: ["da khô", "da nhạy cảm", "làm sạch"], ingredient_tags: ["ceramides", "hyaluronic acid"], aliases: ["CeraVe Hydrating Cleanser"], tags: ["Dịu nhẹ", "Ceramide", "Không hương liệu"], affiliate_url: null, description: "Sữa rửa mặt dịu nhẹ cho da thường đến khô, làm sạch mà không khiến da căng rát." },
  { id: "7", name: "Miss Dior Eau de Parfum", brand: "Dior Beauty", image: "/images/products/miss-dior-eau-de-parfum.jpg", rating: 4.8, reviews: 0, sold: "Đang cập nhật", price: "3.950.000đ", category: "Perfume", category_key: "fragrance", subcategory_key: "edp", concern_tags: ["nước hoa nữ", "mùi hẹn hò", "lưu hương"], ingredient_tags: ["centifolia rose", "lily of the valley"], aliases: ["Miss Dior EDP"], tags: ["EDP", "Floral", "Luxury"], affiliate_url: null, description: "Nước hoa nữ floral luxury với cảm giác tươi, mềm và nữ tính, làm anchor cho nhóm fragrance hẹn hò hoặc quà tặng." },
  { id: "8", name: "Gluta-Hya Serum Burst Lotion Dewy Radiance", brand: "Vaseline", image: "/images/products/vaseline-gluta-hya-dewy-radiance-lotion.jpg", rating: 4.5, reviews: 0, sold: "Đang cập nhật", price: "140.000đ", category: "Bodycare", category_key: "bodycare", subcategory_key: "body_lotion", concern_tags: ["body sáng da", "da khô", "bodycare"], ingredient_tags: ["glutaglow", "hyaluron", "niacinamide"], aliases: ["Vaseline Gluta-Hya Dewy"], tags: ["Body lotion", "Gluta-Hya", "Dewy"], affiliate_url: null, description: "Sữa dưỡng thể dạng serum burst, thấm nhanh, hỗ trợ da body ẩm mượt và nhìn sáng khỏe hơn trong routine hằng ngày." },
  ...RESEARCHED_PRODUCTS,
])

const CURATED_LEGACY_PRODUCTS = new Map(SAMPLE_PRODUCTS.slice(0, 8).map((product) => [product.id, product]))
const PUBLIC_AFFILIATE_PRODUCT_IDS = new Set(
  SAMPLE_PRODUCT_OFFERS
    .filter((offer) => isPublicAffiliateUrl(offer.affiliate_url))
    .map((offer) => offer.product_id)
)

function isPublicAffiliateUrl(url?: string | null) {
  return Boolean(url?.startsWith("https://s.shopee.vn/"))
}

function hasPublicAffiliate(product: Product) {
  return isPublicAffiliateUrl(product.affiliate_url) || PUBLIC_AFFILIATE_PRODUCT_IDS.has(product.id)
}

function isPublicCreatorEvidenceEvent(event: CreatorProductEvent) {
  const sourcePlatform = event.source_platform.toLowerCase()
  return !sourcePlatform.includes("seed") && !sourcePlatform.includes("internal") && !event.source_url?.startsWith("/blog/")
}

const PUBLIC_CREATOR_PRODUCT_EVENTS = SAMPLE_CREATOR_PRODUCT_EVENTS
  .filter(isPublicCreatorEvidenceEvent)
  .filter(isPublicEvidenceEvent)

export const SAMPLE_CREATOR_EVIDENCE_ITEMS: CreatorEvidenceItem[] = PUBLIC_CREATOR_PRODUCT_EVENTS.slice(0, 4).map((event) => ({
  id: `evidence-${event.id}`,
  creator_id: event.creator_id,
  source_platform: event.source_platform,
  source_url: event.source_url,
  source_post_id: event.source_post_id ?? null,
  published_at: event.event_date,
  observed_at: event.observed_at,
  source_title: event.source_title,
  source_excerpt: event.source_excerpt,
  raw_text: event.source_excerpt,
  media_url: event.media_url ?? null,
  status: "published",
  candidate_product_ids: [event.product_id],
  candidate_product_names: [],
  researcher_note: event.evidence_note,
}))

export const SAMPLE_REVIEWS: Review[] = []

function legacyAffiliateOffer(product: Product): ProductOffer | null {
  if (!product.affiliate_url) return null
  return {
    id: `legacy-affiliate-${product.id}`,
    product_id: product.id,
    marketplace: "shopee",
    shop_name: "Shopee affiliate",
    seller_url: null,
    affiliate_url: product.affiliate_url,
    price_snapshot: product.price,
    stock_status: "unknown",
    is_preferred: true,
    last_checked_at: "2026-06-30T00:00:00Z",
  }
}

function mergeOffers(offers: ProductOffer[], products: Product[] = SAMPLE_PRODUCTS) {
  const legacyOffers = products.map(legacyAffiliateOffer).filter((offer): offer is ProductOffer => Boolean(offer))
  const seen = new Set<string>()
  return [...offers, ...legacyOffers]
    .filter((offer) => {
      if (seen.has(offer.id)) return false
      seen.add(offer.id)
      return true
    })
    .sort((a, b) => {
      if (a.is_preferred !== b.is_preferred) return Number(b.is_preferred) - Number(a.is_preferred)
      if (Boolean(a.affiliate_url) !== Boolean(b.affiliate_url)) return Number(Boolean(b.affiliate_url)) - Number(Boolean(a.affiliate_url))
      return b.last_checked_at.localeCompare(a.last_checked_at)
    })
}

function mergeTimelineEvents(events: CreatorProductEvent[]) {
  const seen = new Set<string>()
  return events
    .filter((event) => {
      const key = [
        event.creator_id,
        event.product_id,
        event.event_type,
        event.event_date,
        event.source_excerpt,
      ].join("|")
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => b.event_date.localeCompare(a.event_date) || b.observed_at.localeCompare(a.observed_at))
}

const ALL_FALLBACK_TIMELINE_EVENTS = mergeTimelineEvents([
  ...PUBLIC_CREATOR_PRODUCT_EVENTS,
])

export const SAMPLE_POSTS: Post[] = [
  {
    id: "p1",
    title: "Top serum cấp ẩm phục hồi đáng cân nhắc 2026",
    slug: "top-5-serum-phuc-hoi-da-2026",
    excerpt: "Tổng hợp các serum phục hồi được cộng đồng skincare Việt yêu thích sau nhiều tuần dùng thực tế.",
    content: "Serum cấp ẩm và phục hồi là nhóm đáng cân nhắc khi da thiếu nước, bong nhẹ hoặc đang cần routine ít biến số.\n\nThe Ordinary Hyaluronic Acid 2% + B5 là lựa chọn dễ hiểu trong nhóm HA/B5: tập trung cấp ẩm, hỗ trợ cảm giác da mềm hơn và dễ layer trước kem dưỡng. Các lựa chọn có ceramide, panthenol hoặc HA cũng đáng cân nhắc nếu da dễ căng rát.\n\nĐiều quan trọng là chọn routine tối giản, chống nắng đều và cho da đủ thời gian phục hồi thay vì thay sản phẩm liên tục.",
    author_name: EDITORIAL_AUTHOR_NAME,
    author_avatar: EDITORIAL_AUTHOR_AVATAR,
    category: "Review Sản Phẩm",
    tags: ["Serum", "Phục hồi da", "Review"],
    image: "/images/products/the-ordinary-hyaluronic-acid-2-b5.jpg",
    likes: 342,
    comments: 56,
    created_at: "2026-04-10T08:00:00Z",
    product_ids: ["1"],
  },
  {
    id: "p2",
    title: "Hướng dẫn chọn kem chống nắng cho từng loại da",
    slug: "huong-dan-chon-kem-chong-nang",
    excerpt: "Kem chống nắng không chỉ là SPF. Kết cấu, finish và độ hợp da mới quyết định bạn có dùng đều không.",
    content: "Da dầu thường hợp kem chống nắng dạng gel, fluid hoặc finish ráo. Da khô nên ưu tiên công thức có thành phần cấp ẩm.\n\nDa nhạy cảm cần thử sản phẩm trên vùng nhỏ trước, tránh đổi quá nhiều sản phẩm cùng lúc. Một sản phẩm tốt là sản phẩm bạn có thể dùng đủ lượng mỗi ngày.\n\nKhi hoạt động ngoài trời, hãy thoa lại sau vài giờ và kết hợp mũ, kính, khẩu trang để bảo vệ da tốt hơn.",
    author_name: EDITORIAL_AUTHOR_NAME,
    author_avatar: EDITORIAL_AUTHOR_AVATAR,
    category: "Chăm Sóc Da",
    tags: ["Chống nắng", "SPF", "Da dầu", "Da khô"],
    image: "/images/hero-sunscreen.png",
    likes: 518,
    comments: 73,
    created_at: "2026-04-08T10:30:00Z",
    product_ids: ["6"],
  },
  {
    id: "p3",
    title: "Drugstore makeup haul dưới 500K",
    slug: "drugstore-makeup-haul-duoi-500k",
    excerpt: "Những món makeup giá dễ chịu nhưng đủ dùng cho một layout hằng ngày gọn đẹp.",
    content: "Một layout drugstore hợp lý nên bắt đầu từ nền mỏng nhẹ, son dễ tán và mascara không lem.\n\nMaybelline Fit Me là lựa chọn quen thuộc cho da dầu vì độ che phủ vừa phải và finish lì. Khi phối với son velvet hoặc tint, tổng thể vẫn tươi mà không quá dày.\n\nMẹo nhỏ là đầu tư vào dụng cụ tán nền tốt, vì cùng một sản phẩm nhưng cách apply có thể tạo khác biệt lớn.",
    author_name: EDITORIAL_AUTHOR_NAME,
    author_avatar: EDITORIAL_AUTHOR_AVATAR,
    category: "Trang Điểm",
    tags: ["Drugstore", "Makeup haul", "Tiết kiệm"],
    image: "/images/hero-makeup.png",
    likes: 267,
    comments: 41,
    created_at: "2026-04-06T14:00:00Z",
    product_ids: ["2", "4"],
  },
  {
    id: "p4",
    title: "Skincare routine cho da dầu mụn",
    slug: "skincare-routine-da-dau-mun",
    excerpt: "Routine 5 bước cơ bản, tập trung vào làm sạch, phục hồi và chống nắng đều đặn.",
    content: "Da dầu mụn không cần routine quá nhiều bước. Làm sạch dịu nhẹ, dưỡng ẩm vừa đủ và chống nắng ổn định thường hiệu quả hơn việc liên tục thêm treatment.\n\nNếu dùng BHA hoặc retinoid, hãy tăng tần suất chậm và theo dõi phản ứng của da. Khi da kích ứng, ưu tiên phục hồi trước.\n\nMột routine tốt là routine bạn duy trì được trong nhiều tuần, có ghi chú phản ứng và điều chỉnh từ từ.",
    author_name: EDITORIAL_AUTHOR_NAME,
    author_avatar: EDITORIAL_AUTHOR_AVATAR,
    category: "Skincare Routine",
    tags: ["Da dầu mụn", "Routine", "BHA"],
    image: "/images/products/bioderma-sensibio-h2o-micellar-water.jpg",
    likes: 489,
    comments: 67,
    created_at: "2026-04-04T09:00:00Z",
    product_ids: ["1", "3", "6"],
  },
  {
    id: "p5",
    title: "Giảm rối cho mái tóc hư tổn sau tẩy nhuộm",
    slug: "giai-cuu-toc-hu-ton-sau-tay-nhuom",
    excerpt: "Ba bước phục hồi tóc đơn giản tại nhà cho tóc khô xơ, dễ rối và thiếu bóng.",
    content: "Sau tẩy nhuộm, tóc thường mất độ ẩm và dễ gãy hơn. Hãy giảm nhiệt, ưu tiên dầu gội dịu nhẹ và thêm bước dưỡng phần thân đuôi tóc.\n\nSerum dưỡng tóc như Mise-en-Scene Perfect Serum Original giúp giảm ma sát, giảm rối và tạo độ bóng ở phần đuôi tóc. Tránh dùng nhiệt quá thường xuyên nếu tóc đang yếu.\n\nKiên trì trong 4 đến 8 tuần sẽ cho kết quả rõ hơn so với đổi sản phẩm liên tục.",
    author_name: EDITORIAL_AUTHOR_NAME,
    author_avatar: EDITORIAL_AUTHOR_AVATAR,
    category: "Chăm Sóc Tóc",
    tags: ["Tóc hư tổn", "Nhuộm tóc", "Phục hồi"],
    image: "/images/products/mise-en-scene-perfect-serum-original.jpg",
    likes: 198,
    comments: 32,
    created_at: "2026-04-02T16:00:00Z",
    product_ids: ["5"],
  },
  {
    id: "p6",
    title: "So sánh sữa dưỡng thể trắng da hot hiện nay",
    slug: "so-sanh-sua-duong-the-trang-da",
    excerpt: "Nhìn vào kết cấu, độ thấm, cảm giác sau bôi và hiệu quả dưỡng sáng theo thời gian.",
    content: "Sữa dưỡng thể dưỡng sáng nên được đánh giá theo độ thấm, khả năng cấp ẩm và trải nghiệm dùng hằng ngày.\n\nVaseline Gluta-Hya có texture nhẹ, hợp thời tiết nóng ẩm. Những sản phẩm có SPF tiện cho ban ngày nhưng vẫn không thay thế chống nắng chuyên dụng khi phơi nắng lâu.\n\nDưỡng body cần đều đặn. Hiệu quả thường đến từ việc dùng đủ lượng và duy trì nhiều tuần.",
    author_name: EDITORIAL_AUTHOR_NAME,
    author_avatar: EDITORIAL_AUTHOR_AVATAR,
    category: "Mẹo Làm Đẹp",
    tags: ["Body lotion", "Trắng da", "So sánh"],
    image: "/images/products/vaseline-gluta-hya-dewy-radiance-lotion.jpg",
    likes: 371,
    comments: 48,
    created_at: "2026-03-30T11:00:00Z",
    product_ids: ["8"],
  },
]

const EDITORIAL_PUBLISHED_POSTS = getPublishedEditorialPosts()
const ALL_FALLBACK_POSTS: Post[] = [...EDITORIAL_PUBLISHED_POSTS, ...SAMPLE_POSTS]

function normalizeEditorialPost(post: Post): Post {
  return {
    ...post,
    author_name: EDITORIAL_AUTHOR_NAME,
    author_avatar: EDITORIAL_AUTHOR_AVATAR,
  }
}

function mergePosts(primary: Post[], fallback: Post[]) {
  const seen = new Set<string>()
  return [...primary, ...fallback]
    .filter((post) => {
      const key = post.slug || post.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(normalizeEditorialPost)
}

function mergeProducts(primary: Product[], fallback: Product[]) {
  const seen = new Set<string>()
  return [...primary, ...fallback].filter((product) => {
    if (seen.has(product.id)) return false
    seen.add(product.id)
    return true
  })
}

async function fromSupabase<T>(query: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  if (!isSupabaseSchemaReady) return fallback
  try {
    const { data, error } = await query
    if (error || data == null) return fallback
    return data
  } catch {
    return fallback
  }
}

export async function getProducts() {
  const products = await fromSupabase<Product[]>(
    supabase.from("radar_products").select("*").order("name"),
    SAMPLE_PRODUCTS
  )
  return productsWithTaxonomy(mergeProducts(products, SAMPLE_PRODUCTS))
    .map((product) => CURATED_LEGACY_PRODUCTS.get(product.id) ?? product)
    .filter((product) => product.status !== "pending" && product.status !== "archived")
    .filter(hasPublicAffiliate)
}

export async function getProductOffers(filters: { productId?: string } = {}) {
  const products = filters.productId
    ? SAMPLE_PRODUCTS.filter((product) => product.id === filters.productId)
    : SAMPLE_PRODUCTS
  const fallback = mergeOffers(
    SAMPLE_PRODUCT_OFFERS.filter((offer) => !filters.productId || offer.product_id === filters.productId),
    products
  )

  if (!isSupabaseSchemaReady) return fallback

  let query = supabase.from("product_offers").select("*")
  if (filters.productId) query = query.eq("product_id", filters.productId)
  const offers = await fromSupabase<ProductOffer[]>(query, fallback)
  return mergeOffers(offers, products)
}

export async function getPreferredProductOffer(product: Product) {
  const offers = await getProductOffers({ productId: product.id })
  return offers.find((offer) => offer.is_preferred && offer.affiliate_url)
    ?? offers.find((offer) => offer.affiliate_url)
    ?? offers.find((offer) => offer.is_preferred)
    ?? offers[0]
    ?? legacyAffiliateOffer(product)
    ?? null
}

export async function getProduct(id: string) {
  const fallback = SAMPLE_PRODUCTS.find((product) => product.id === id) ?? null
  const curatedLegacyProduct = fallback ? CURATED_LEGACY_PRODUCTS.get(fallback.id) : null
  if (curatedLegacyProduct) {
    const publicLegacyProduct = productWithTaxonomy(curatedLegacyProduct)
    return hasPublicAffiliate(publicLegacyProduct) ? publicLegacyProduct : null
  }

  const product = await fromSupabase<Product | null>(
    supabase.from("radar_products").select("*").eq("id", id).maybeSingle(),
    fallback
  )
  const publicProduct = product ? productWithTaxonomy(CURATED_LEGACY_PRODUCTS.get(product.id) ?? product) : null
  return publicProduct && hasPublicAffiliate(publicProduct) ? publicProduct : null
}

export async function getCreatorEvidenceItems(filters: { creatorId?: string; status?: string } = {}) {
  const fallback = SAMPLE_CREATOR_EVIDENCE_ITEMS.filter((item) => {
    if (filters.creatorId && item.creator_id !== filters.creatorId) return false
    if (filters.status && item.status !== filters.status) return false
    return true
  })

  if (!isSupabaseSchemaReady) return fallback

  let query = supabase.from("creator_evidence_items").select("*").order("observed_at", { ascending: false })
  if (filters.creatorId) query = query.eq("creator_id", filters.creatorId)
  if (filters.status) query = query.eq("status", filters.status)
  return fromSupabase<CreatorEvidenceItem[]>(query, fallback)
}

const HUB_PRODUCT_CATEGORIES: Record<string, string[]> = {
  "da-mat": ["Skincare"],
  "tri-mun": ["Skincare"],
  "sang-da-chong-nang": ["Skincare", "Bodycare"],
  "ingredient-radar": ["Skincare"],
  "product-radar": ["Skincare", "Makeup", "Bodycare", "Haircare", "Perfume"],
  bodycare: ["Bodycare"],
  "toc-da-dau": ["Haircare"],
  makeup: ["Makeup"],
  "mui-huong": ["Perfume", "Bodycare"],
  "nam-gioi": ["Skincare", "Haircare"],
  "clinic-treatment": ["Skincare"],
  "beauty-lifestyle": ["Skincare", "Bodycare"],
  "nails-mi-long-may": ["Makeup"],
  "beauty-tech": ["Skincare", "Haircare"],
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
}

function scoreProductForPost(product: Product, post: Post, explicitRank: number | null) {
  const postText = normalizeText([
    post.title,
    post.excerpt,
    post.content,
    post.category,
    post.hubSlug,
    ...(post.tags ?? []),
  ].join(" "))
  const productText = normalizeText([
    product.name,
    product.brand,
    product.category,
    product.description,
    ...(product.tags ?? []),
  ].join(" "))
  const hubCategories = post.hubSlug ? HUB_PRODUCT_CATEGORIES[post.hubSlug] ?? [] : []
  let score = explicitRank == null ? 0 : 1000 - explicitRank

  if (hubCategories.some((category) => normalizeText(category) === normalizeText(product.category))) score += 80
  if (normalizeText(post.category) === normalizeText(product.category)) score += 70
  if (postText.includes(normalizeText(product.category))) score += 30
  if (postText.includes(normalizeText(product.brand))) score += 12

  for (const tag of product.tags ?? []) {
    const normalizedTag = normalizeText(tag)
    if (postText.includes(normalizedTag)) score += 24
  }

  for (const tag of post.tags ?? []) {
    const normalizedTag = normalizeText(tag)
    if (productText.includes(normalizedTag)) score += 18
  }

  score += Math.min(product.rating, 5)
  score += Math.min(product.reviews / 1000, 5)
  return score
}

export async function getPostProductRecommendations(post: Post, limit = 3) {
  const products = await getProducts()
  const explicitIds = post.product_ids ?? []
  const explicitRank = new Map(explicitIds.map((id, index) => [id, index]))

  return products
    .map((product) => ({
      product,
      score: scoreProductForPost(product, post, explicitRank.get(product.id) ?? null),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
    .slice(0, limit)
    .map((item) => item.product)
}

export async function getKols() {
  return fromSupabase<Kol[]>(
    supabase.from("kols").select("*").order("trustscore", { ascending: false }),
    SAMPLE_KOLS
  )
}

export async function getKol(id: string) {
  const fallback = SAMPLE_KOLS.find((kol) => kol.id === id) ?? null
  return fromSupabase<Kol | null>(
    supabase.from("kols").select("*").eq("id", id).maybeSingle(),
    fallback
  )
}

export async function getReviews(filters: { productId?: string; kolId?: string } = {}) {
  const fallback = SAMPLE_REVIEWS.filter((review) => {
    if (filters.productId && review.productid !== filters.productId) return false
    if (filters.kolId && review.kolid !== filters.kolId) return false
    return true
  })

  if (!isSupabaseSchemaReady) return fallback

  let query = supabase.from("reviews").select("*")
  if (filters.productId) query = query.eq("productid", filters.productId)
  if (filters.kolId) query = query.eq("kolid", filters.kolId)
  return fromSupabase<Review[]>(query, fallback)
}

export async function getCommunityReviews(filters: { productId?: string; userId?: string } = {}) {
  if (!isSupabaseSchemaReady) return [] as CommunityReview[]

  let query = supabase
    .from("user_ratings")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters.productId) query = query.eq("product_id", filters.productId)
  if (filters.userId) {
    query = query.eq("user_id", filters.userId)
  } else {
    query = query.eq("status", "approved")
  }

  return fromSupabase<CommunityReview[]>(query, [])
}

export async function getCreatorProductEvents(filters: { productId?: string; creatorId?: string } = {}) {
  const fallback = ALL_FALLBACK_TIMELINE_EVENTS.filter((event) => {
    if (filters.productId && event.product_id !== filters.productId) return false
    if (filters.creatorId && event.creator_id !== filters.creatorId) return false
    return true
  })

  if (!isSupabaseSchemaReady) return fallback

  let query = supabase.from("creator_product_events").select("*")
  if (filters.productId) query = query.eq("product_id", filters.productId)
  if (filters.creatorId) query = query.eq("creator_id", filters.creatorId)
  const events = await fromSupabase<CreatorProductEvent[]>(query, fallback)
  return mergeTimelineEvents(events).filter(isPublicEvidenceEvent)
}

export async function getCreatorProductStates(filters: { productId?: string; creatorId?: string } = {}) {
  const grouped = new Map<string, CreatorProductEvent[]>()
  for (const event of PUBLIC_CREATOR_PRODUCT_EVENTS) {
    if (filters.productId && event.product_id !== filters.productId) continue
    if (filters.creatorId && event.creator_id !== filters.creatorId) continue
    const key = `${event.creator_id}|${event.product_id}`
    grouped.set(key, [...(grouped.get(key) ?? []), event])
  }
  const fallback = Array.from(grouped.entries()).map(([key, events]) => {
    const [creatorId, productId] = key.split("|")
    const derived = deriveCreatorProductState(events)
    return {
      creator_id: creatorId,
      product_id: productId,
      state: derived.state,
      state_confidence: derived.stateConfidence,
      last_confirmed_at: derived.lastConfirmedAt,
      expires_at: derived.expiresAt,
      evidence_count: derived.evidenceCount,
      last_event_id: derived.lastEventId,
      computed_at: new Date().toISOString(),
    } satisfies CreatorProductState
  })

  if (!isEvidenceRadarSchemaReady) return fallback
  let query = supabase.from("creator_product_states").select("*").gte("state_confidence", 70)
  if (filters.productId) query = query.eq("product_id", filters.productId)
  if (filters.creatorId) query = query.eq("creator_id", filters.creatorId)
  return fromSupabase<CreatorProductState[]>(query, fallback)
}

export async function getPosts() {
  const posts = await fromSupabase<Post[]>(
    supabase.from("posts").select("*").order("created_at", { ascending: false }),
    ALL_FALLBACK_POSTS
  )
  return mergePosts(posts, EDITORIAL_PUBLISHED_POSTS)
}

export async function getPost(id: string) {
  const fallback = ALL_FALLBACK_POSTS.find((post) => post.id === id || post.slug === id) ?? getPublishedEditorialPost(id)
  if (!isSupabaseSchemaReady) return fallback ? normalizeEditorialPost(fallback) : null

  const byId = await fromSupabase<Post | null>(
    supabase.from("posts").select("*").eq("id", id).maybeSingle(),
    null
  )
  if (byId) return normalizeEditorialPost(byId)

  const post = await fromSupabase<Post | null>(
    supabase.from("posts").select("*").eq("slug", id).maybeSingle(),
    fallback
  )
  return post ? normalizeEditorialPost(post) : null
}

export async function getRelatedPosts(category: string, currentId: string, limit = 2) {
  const fallback = ALL_FALLBACK_POSTS
    .filter((post) => post.category === category && post.id !== currentId)
    .slice(0, limit)

  const posts = await fromSupabase<Post[]>(
    supabase
      .from("posts")
      .select("id, title, image, category, created_at, slug, excerpt, content, author_name, author_avatar, tags, likes, comments, product_ids")
      .eq("category", category)
      .neq("id", currentId)
      .limit(limit),
    fallback
  )
  return posts.map(normalizeEditorialPost)
}

export async function searchAll(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return { products: [], posts: [], kols: [] }

  const fallback = {
    products: SAMPLE_PRODUCTS.filter((product) =>
      [product.name, product.brand, product.category, ...product.tags].some((field) =>
        field.toLowerCase().includes(normalized)
      )
    ),
    posts: ALL_FALLBACK_POSTS.filter((post) =>
      [post.title, post.excerpt, post.author_name, post.category, ...post.tags].some((field) =>
        field.toLowerCase().includes(normalized)
      )
    ),
    kols: SAMPLE_KOLS.filter((kol) =>
      [kol.name, kol.handle, kol.platform, ...kol.categories].some((field) =>
        field.toLowerCase().includes(normalized)
      )
    ),
  }

  if (!isSupabaseSchemaReady) return fallback

  const pattern = `%${query}%`
  try {
    const [productsRes, postsRes, kolsRes] = await Promise.all([
      supabase.from("radar_products").select("*").or(`name.ilike.${pattern},brand.ilike.${pattern},category.ilike.${pattern}`).limit(12),
      supabase.from("posts").select("*").or(`title.ilike.${pattern},excerpt.ilike.${pattern},category.ilike.${pattern}`).limit(12),
      supabase.from("kols").select("*").or(`name.ilike.${pattern},handle.ilike.${pattern},platform.ilike.${pattern}`).limit(12),
    ])

    return {
      products: (productsRes.data as Product[] | null) ?? fallback.products,
      posts: mergePosts((postsRes.data as Post[] | null) ?? [], fallback.posts).slice(0, 12),
      kols: (kolsRes.data as Kol[] | null) ?? fallback.kols,
    }
  } catch {
    return fallback
  }
}
