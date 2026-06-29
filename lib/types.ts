import type { ResearchStage } from "@/lib/content-matrix"

export interface Product {
  id: string
  name: string
  brand: string
  image: string
  description: string
  rating: number
  reviews: number
  sold: string
  price: string
  category: string
  tags: string[]
  affiliate_url: string | null
}

export interface KolSocial {
  platform: string
  handle: string
  followers: string
  url?: string
}

export interface KolReviewHighlight {
  product: string
  verdict: string
  /** "positive" | "mixed" | "negative" */
  sentiment?: "positive" | "mixed" | "negative"
}

export interface Kol {
  id: string
  name: string
  avatar: string
  cover: string
  /** Nền tảng chính (nhiều follower nhất). Các nền tảng khác nằm trong `socials`. */
  platform: string
  handle: string
  followers: string
  recentreview: string
  trustscore: number
  categories: string[]
  verified: boolean

  // ----- Hồ sơ chi tiết (tất cả optional) -----
  /** Giới thiệu dài, nhiều đoạn (ngăn cách bằng \n\n). */
  bio?: string
  /** Tất cả nền tảng KOL hoạt động (gồm cả nền tảng chính). */
  socials?: KolSocial[]
  /** Tên thật / tên khai sinh nếu khác tên hiển thị. */
  realName?: string
  /** Nơi hoạt động chính, vd "TP.HCM", "Hà Nội". */
  basedIn?: string
  /** Mốc bắt đầu làm nội dung làm đẹp, vd "2014". */
  activeSince?: string
  /** Chuyên môn chi tiết hơn categories. */
  specialties?: string[]
  /** Các điểm nổi bật / dấu ấn (bullet). */
  knownFor?: string[]
  /** Phong cách nội dung & cách review. */
  contentStyle?: string
  /** Thương hiệu mỹ phẩm sở hữu/đồng sáng lập, nếu có. */
  ownBrand?: string
  /** Sản phẩm/thương hiệu gắn liền tên tuổi. */
  signatureProducts?: string[]
  /** Ghi chú về độ minh bạch (cách họ disclosure PR/tài trợ). */
  transparencyNote?: string
  /** Một vài review tiêu biểu. */
  reviewHighlights?: KolReviewHighlight[]
}

export interface Review {
  id: string
  kolid: string
  productid: string
  rating: number
  ispr: boolean
  timeago: string
  content: string
  likes: number
  comments: number
}

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author_name: string
  author_avatar: string
  category: string
  tags: string[]
  image: string
  likes: number
  comments: number
  created_at: string
  product_ids: string[]
  hubSlug?: string
  status?: "planned" | "draft" | "published"
  takeaways?: string[]
  faq?: { question: string; answer: string }[]
  sourceNotes?: { label: string; url: string }[]
  medicalDisclaimerLevel?: "none" | "light" | "medical"
  researchStage?: ResearchStage
  userQuestion?: string
  nextArticleSlugs?: string[]
  productGroupKeys?: string[]
  matrixProductIds?: string[]
  kolIds?: string[]
  kolReasons?: Record<string, string>
  relatedNodeKeys?: string[]
}
