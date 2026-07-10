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
  category_key?: ProductCategoryKey | null
  subcategory_key?: string | null
  concern_tags?: string[]
  ingredient_tags?: string[]
  aliases?: string[]
  status?: ProductStatus | null
}

export type ProductStatus = "published" | "pending" | "archived"

export type ProductCategoryKey =
  | "skincare"
  | "haircare"
  | "makeup"
  | "fragrance"
  | "bodycare"
  | "beauty_tools_tech"
  | "clinic_treatment"
  | "nails_lash_brow"
  | "men_grooming"

export interface ProductOffer {
  id: string
  product_id: string
  marketplace: "shopee" | "lazada" | "tiktok_shop" | "official" | "other"
  shop_name: string
  seller_url: string | null
  affiliate_url: string | null
  price_snapshot: string | null
  stock_status: "in_stock" | "out_of_stock" | "unknown"
  is_preferred: boolean
  last_checked_at: string
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

export interface CommunityReview {
  id: string
  user_id: string
  product_id: string
  rating: number
  review: string | null
  status: "pending" | "approved" | "rejected"
  reviewer_alias: string | null
  skin_type: string | null
  usage_duration: string | null
  purchase_source: string | null
  would_repurchase: boolean | null
  proof_url: string | null
  linked_kol_id: string | null
  reviewer_relation: string | null
  helpful_count: number
  created_at: string
  updated_at: string
}

export type CreatorProductEventType =
  | "first_seen"
  | "mentioned"
  | "unboxed"
  | "used"
  | "reviewed"
  | "recommended"
  | "disliked"
  | "emptied"
  | "repurchased"
  | "switched_to"
  | "stopped_using"
  | "live_sold"
  | "sponsored"

export type CreatorProductSentiment = "positive" | "mixed" | "negative" | "neutral"
export type CreatorProductDisclosure = "organic" | "pr" | "sponsored" | "affiliate" | "unknown"
export type CreatorProductConfidence = "high" | "medium" | "low"
export type CreatorEvidenceStatus = "new" | "needs_product_match" | "ready_to_publish" | "published" | "rejected"

export interface CreatorEvidenceItem {
  id: string
  creator_id: string
  source_platform: string
  source_url: string | null
  source_post_id: string | null
  published_at: string | null
  observed_at: string
  source_title: string
  source_excerpt: string
  raw_text: string | null
  media_url: string | null
  status: CreatorEvidenceStatus
  candidate_product_ids: string[]
  candidate_product_names: string[]
  researcher_note: string | null
  source_post_ref?: string | null
  extracted_claims?: EvidenceClaim[]
  confidence_score?: number | null
  model_name?: string | null
  prompt_version?: string | null
  evidence_spans?: EvidenceSpan[]
  risk_flags?: EvidenceRiskFlag[]
  requires_human_review?: boolean
  review_reason?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreatorProductEvent {
  id: string
  creator_id: string
  product_id: string
  evidence_id?: string | null
  event_type: CreatorProductEventType
  event_date: string
  observed_at: string
  source_platform: string
  source_url: string | null
  source_post_id?: string | null
  source_title: string
  source_excerpt: string
  media_url?: string | null
  sentiment: CreatorProductSentiment
  disclosure: CreatorProductDisclosure
  usage_context: string | null
  evidence_note: string
  confidence: CreatorProductConfidence
  confidence_score?: number | null
  verification_status?: "pending" | "verified" | "rejected"
  verified_by?: string | null
  verified_at?: string | null
  valid_until?: string | null
}

export type CreatorAccountPriority = "a" | "b" | "c"

export interface CreatorAccount {
  id: string
  creator_id: string
  platform: string
  profile_url: string
  external_account_id: string | null
  priority_tier: CreatorAccountPriority
  crawl_interval_minutes: number
  cursor: string | null
  last_polled_at: string | null
  next_poll_at: string
  last_error: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

export type SourcePostAnalysisStatus = "pending" | "queued" | "processing" | "ready" | "failed" | "ignored"

export interface SourcePost {
  id: string
  creator_account_id: string
  creator_id: string
  source_platform: string
  external_post_id: string | null
  source_url: string
  published_at: string | null
  observed_at: string
  title: string
  caption: string
  media_url: string | null
  media_metadata: Record<string, unknown>
  raw_payload: Record<string, unknown>
  content_hash: string
  analysis_status: SourcePostAnalysisStatus
  analysis_attempts: number
  last_error: string | null
  raw_media_expires_at: string
  created_at?: string
  updated_at?: string
}

export type EvidenceRiskFlag =
  | "ocr_only"
  | "ambiguous_variant"
  | "disclosure_unknown"
  | "repost"
  | "multi_product_bundle"
  | "source_unavailable"
  | "product_not_in_catalogue"
  | "contradictory_claim"

export interface EvidenceSpan {
  kind: "quote" | "timestamp" | "frame" | "caption"
  value: string
  timestamp_seconds?: number | null
}

export interface EvidenceClaim {
  product_name: string
  brand: string
  variant: string | null
  matched_product_id: string | null
  event_type: CreatorProductEventType
  sentiment: CreatorProductSentiment
  disclosure: CreatorProductDisclosure
  usage_context: string | null
  evidence_spans: EvidenceSpan[]
  product_identity_score: number
  action_evidence_score: number
  source_authenticity_score: number
  evidence_localization_score: number
  confidence_score: number
  risk_flags: EvidenceRiskFlag[]
}

export type CreatorProductStateValue =
  | "current"
  | "recently_used"
  | "past"
  | "reviewed_only"
  | "promoted_only"
  | "disliked"
  | "unknown"

export interface CreatorProductState {
  creator_id: string
  product_id: string
  state: CreatorProductStateValue
  state_confidence: number
  last_confirmed_at: string | null
  expires_at: string | null
  evidence_count: number
  last_event_id: string | null
  computed_at: string
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
