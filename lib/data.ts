import { isSupabaseSchemaReady, supabase } from "@/lib/supabase"
import { getPublishedEditorialPost, getPublishedEditorialPosts } from "@/lib/editorial"
import { REAL_KOLS } from "@/lib/kols-data"
import type { Kol, Post, Product, Review } from "@/lib/types"

// Toàn bộ hồ sơ KOL/KOC (100 người) nằm trong REAL_KOLS; id "1"–"6" được giữ để reviews tham chiếu qua kolid.
export const SAMPLE_KOLS: Kol[] = REAL_KOLS

export const SAMPLE_PRODUCTS: Product[] = [
  { id: "1", name: "Tinh chất phục hồi da B5 GoodnDoc", brand: "GoodnDoc", image: "/images/product-b5-serum.png", rating: 4.8, reviews: 1240, sold: "8,500+", price: "350.000đ", category: "Skincare", tags: ["Phục hồi", "Cấp ẩm"], affiliate_url: null, description: "Phục hồi hàng rào bảo vệ da, cấp ẩm sâu và làm dịu da nhạy cảm. Phù hợp cho da treatment hoặc cần phục hồi sau mụn." },
  { id: "2", name: "Kem nền Maybelline Fit Me Matte + Poreless", brand: "Maybelline", image: "/images/product-foundation.png", rating: 4.5, reviews: 3500, sold: "15,000+", price: "180.000đ", category: "Makeup", tags: ["Kiềm dầu", "Drugstore"], affiliate_url: null, description: "Kem nền kiềm dầu, che phủ lỗ chân lông và tạo lớp nền mịn lì tự nhiên cho da dầu, da hỗn hợp thiên dầu." },
  { id: "3", name: "Nước tẩy trang L'Oreal Micellar Water 3-in-1", brand: "L'Oreal", image: "/images/product-micellar.png", rating: 4.9, reviews: 5200, sold: "20,000+", price: "150.000đ", category: "Skincare", tags: ["Làm sạch sâu", "Da nhạy cảm"], affiliate_url: null, description: "Nước tẩy trang 3 trong 1 giúp làm sạch lớp trang điểm, bụi bẩn và bã nhờn mà không gây khô rát." },
  { id: "4", name: "Son kem lì MAC Powder Kiss Liquid Lipcolour", brand: "MAC", image: "/images/product-lipstick.png", rating: 4.7, reviews: 890, sold: "3,200+", price: "650.000đ", category: "Makeup", tags: ["Lì", "Mềm môi"], affiliate_url: null, description: "Son kem lì kết cấu xốp mịn như nhung, lên màu chuẩn, tạo hiệu ứng blur thời thượng và không làm khô môi." },
  { id: "5", name: "Dầu gội khô Batiste Dry Shampoo", brand: "Batiste", image: "/images/product-dry-shampoo.png", rating: 4.6, reviews: 2100, sold: "10,000+", price: "120.000đ", category: "Haircare", tags: ["Làm sạch nhanh", "Tiện lợi"], affiliate_url: null, description: "Giải pháp cứu nguy cho tóc bết trong một phút, hút dầu thừa và trả lại độ bồng bềnh nhẹ nhàng." },
  { id: "6", name: "Sữa rửa mặt Cerave Hydrating Cleanser", brand: "Cerave", image: "/images/product-cleanser.png", rating: 4.8, reviews: 4100, sold: "12,000+", price: "380.000đ", category: "Skincare", tags: ["Dịu nhẹ", "Cấp ẩm"], affiliate_url: null, description: "Sữa rửa mặt không tạo bọt, bổ sung ceramides và hyaluronic acid để làm sạch nhẹ mà vẫn giữ ẩm." },
  { id: "7", name: "Nước hoa nữ Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", image: "/images/product-perfume.png", rating: 4.9, reviews: 650, sold: "1,500+", price: "2.500.000đ", category: "Perfume", tags: ["Quyến rũ", "Lưu hương lâu"], affiliate_url: null, description: "Hương xạ hương quyến rũ kết hợp hoa hồng và đào, lưu hương lâu, phù hợp cho những dịp đặc biệt." },
  { id: "8", name: "Sữa dưỡng thể Vaseline Gluta-Hya", brand: "Vaseline", image: "/images/product-body-lotion.png", rating: 4.5, reviews: 1800, sold: "6,000+", price: "140.000đ", category: "Bodycare", tags: ["Trắng da", "Thấm nhanh"], affiliate_url: null, description: "Sữa dưỡng thể dạng serum mỏng nhẹ, thấm nhanh, hỗ trợ dưỡng sáng và cấp ẩm cho da body." },
]

export const SAMPLE_REVIEWS: Review[] = [
  { id: "r1", kolid: "1", productid: "1", rating: 5, ispr: false, timeago: "2 giờ trước", content: "Phục hồi da rất ổn, thấm nhanh và không bết dính. Hợp với da đang treatment.", likes: 342, comments: 45 },
  { id: "r2", kolid: "2", productid: "2", rating: 4, ispr: true, timeago: "5 giờ trước", content: "Độ che phủ ổn, kiềm dầu tốt nhưng xuống tone hơi nhanh. Phù hợp học sinh sinh viên.", likes: 128, comments: 12 },
  { id: "r3", kolid: "3", productid: "3", rating: 5, ispr: false, timeago: "1 ngày trước", content: "Sạch sâu, không rát mắt, giá tốt. Một lựa chọn tẩy trang drugstore đáng mua.", likes: 890, comments: 102 },
  { id: "r4", kolid: "4", productid: "4", rating: 4, ispr: true, timeago: "2 ngày trước", content: "Màu son lên chuẩn, chất son mềm mịn. Độ bám màu ở mức trung bình.", likes: 456, comments: 38 },
]

export const SAMPLE_POSTS: Post[] = [
  {
    id: "p1",
    title: "Top 5 serum phục hồi da tốt nhất 2026",
    slug: "top-5-serum-phuc-hoi-da-2026",
    excerpt: "Tổng hợp các serum phục hồi được cộng đồng skincare Việt yêu thích sau nhiều tuần dùng thực tế.",
    content: "Serum phục hồi da là nhóm sản phẩm đáng đầu tư khi hàng rào bảo vệ da yếu, da bong tróc hoặc đang dùng treatment.\n\nB5 GoodnDoc nổi bật nhờ kết cấu dễ chịu, thấm nhanh và cấp ẩm vừa đủ. Các lựa chọn có ceramide và hyaluronic acid cũng rất đáng cân nhắc nếu da thiếu nước hoặc nhạy cảm.\n\nĐiều quan trọng là chọn routine tối giản, chống nắng đều và cho da đủ thời gian phục hồi thay vì thay sản phẩm liên tục.",
    author_name: "Hà Linh Official",
    author_avatar: "/images/kol-halinh.png",
    category: "Review Sản Phẩm",
    tags: ["Serum", "Phục hồi da", "Review"],
    image: "/images/product-b5-serum.png",
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
    author_name: "Trinh Phạm",
    author_avatar: "/images/kol-trinh.png",
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
    author_name: "Góc Của Rư",
    author_avatar: "/images/kol-ru.png",
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
    author_name: "Call Me Duy",
    author_avatar: "/images/kol-duy.png",
    category: "Skincare Routine",
    tags: ["Da dầu mụn", "Routine", "BHA"],
    image: "/images/product-micellar.png",
    likes: 489,
    comments: 67,
    created_at: "2026-04-04T09:00:00Z",
    product_ids: ["1", "3", "6"],
  },
  {
    id: "p5",
    title: "Giải cứu mái tóc hư tổn sau tẩy nhuộm",
    slug: "giai-cuu-toc-hu-ton-sau-tay-nhuom",
    excerpt: "Ba bước phục hồi tóc đơn giản tại nhà cho tóc khô xơ, dễ rối và thiếu bóng.",
    content: "Sau tẩy nhuộm, tóc thường mất độ ẩm và dễ gãy hơn. Hãy giảm tần suất gội, ưu tiên dầu gội dịu nhẹ và thêm bước ủ tóc hằng tuần.\n\nTinh dầu dưỡng ở phần đuôi tóc giúp giảm ma sát và tạo độ bóng. Tránh dùng nhiệt quá thường xuyên nếu tóc đang yếu.\n\nKiên trì trong 4 đến 8 tuần sẽ cho kết quả rõ hơn so với đổi sản phẩm liên tục.",
    author_name: "Bồng Bềnh",
    author_avatar: "/images/kol-bong.png",
    category: "Chăm Sóc Tóc",
    tags: ["Tóc hư tổn", "Nhuộm tóc", "Phục hồi"],
    image: "/images/product-dry-shampoo.png",
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
    author_name: "Hà Linh Official",
    author_avatar: "/images/kol-halinh.png",
    category: "Mẹo Làm Đẹp",
    tags: ["Body lotion", "Trắng da", "So sánh"],
    image: "/images/product-body-lotion.png",
    likes: 371,
    comments: 48,
    created_at: "2026-03-30T11:00:00Z",
    product_ids: ["8"],
  },
]

const EDITORIAL_PUBLISHED_POSTS = getPublishedEditorialPosts()
const ALL_FALLBACK_POSTS: Post[] = [...EDITORIAL_PUBLISHED_POSTS, ...SAMPLE_POSTS]

function mergePosts(primary: Post[], fallback: Post[]) {
  const seen = new Set<string>()
  return [...primary, ...fallback].filter((post) => {
    const key = post.slug || post.id
    if (seen.has(key)) return false
    seen.add(key)
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
  return fromSupabase<Product[]>(
    supabase.from("radar_products").select("*").order("name"),
    SAMPLE_PRODUCTS
  )
}

export async function getProduct(id: string) {
  const fallback = SAMPLE_PRODUCTS.find((product) => product.id === id) ?? null
  return fromSupabase<Product | null>(
    supabase.from("radar_products").select("*").eq("id", id).maybeSingle(),
    fallback
  )
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

export async function getPosts() {
  const posts = await fromSupabase<Post[]>(
    supabase.from("posts").select("*").order("created_at", { ascending: false }),
    ALL_FALLBACK_POSTS
  )
  return mergePosts(posts, EDITORIAL_PUBLISHED_POSTS)
}

export async function getPost(id: string) {
  const fallback = ALL_FALLBACK_POSTS.find((post) => post.id === id || post.slug === id) ?? getPublishedEditorialPost(id)
  if (!isSupabaseSchemaReady) return fallback

  const byId = await fromSupabase<Post | null>(
    supabase.from("posts").select("*").eq("id", id).maybeSingle(),
    null
  )
  if (byId) return byId

  return fromSupabase<Post | null>(
    supabase.from("posts").select("*").eq("slug", id).maybeSingle(),
    fallback
  )
}

export async function getRelatedPosts(category: string, currentId: string, limit = 2) {
  const fallback = ALL_FALLBACK_POSTS
    .filter((post) => post.category === category && post.id !== currentId)
    .slice(0, limit)

  return fromSupabase<Post[]>(
    supabase
      .from("posts")
      .select("id, title, image, category, created_at, slug, excerpt, content, author_name, author_avatar, tags, likes, comments, product_ids")
      .eq("category", category)
      .neq("id", currentId)
      .limit(limit),
    fallback
  )
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
