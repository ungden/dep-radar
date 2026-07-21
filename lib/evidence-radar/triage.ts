import { BEAUTY_BRANDS, normalizeBrandName } from "@/lib/brand-registry"
import type { SourcePost, SourcePostContentLane } from "@/lib/types"

const PRODUCT_TERMS = [
  "serum", "kem", "sữa rửa mặt", "sua rua mat", "chống nắng", "chong nang",
  "retinol", "retinal", "toner", "cleanser", "moisturizer", "spf", "son",
  "cushion", "foundation", "tẩy trang", "tay trang", "dưỡng", "duong",
]
const REVIEW_TERMS = ["review", "test", "đã dùng", "da dung", "dùng hết", "dung het", "mua lại", "routine", "so sánh", "top "]
const COMMERCIAL_TERMS = ["affiliate", "giỏ hàng", "gio hang", "livestream", "live sale", "mã giảm", "ma giam", "chốt đơn", "booking", "hợp tác", "hop tac"]
const EXPERT_TERMS = ["bác sĩ", "bac si", "da liễu", "da lieu", "hoạt chất", "hoat chat", "phác đồ", "phac do", "điều trị", "dieu tri", "chống chỉ định"]
const LIFESTYLE_TERMS = ["vlog", "du lịch", "du lich", "outfit", "ăn gì", "an gi", "đi chơi", "di choi"]

function normalize(value: string) {
  return normalizeBrandName(value).replace(/-/g, " ")
}

function hits(text: string, terms: string[]) {
  return terms.reduce((count, term) => count + Number(text.includes(normalize(term))), 0)
}

const BRAND_TERMS = BEAUTY_BRANDS.flatMap((brand) => [brand.name, ...(brand.aliases ?? [])])
  .map(normalize)
  .filter((term) => term.length >= 3)

export interface SourcePostTriage {
  lane: SourcePostContentLane
  priorityScore: number
  reason: string
  shouldAnalyze: boolean
}

export function triageSourcePost(post: Pick<SourcePost, "caption" | "title" | "transcript_text" | "transcription_status" | "vision_fallback_required">): SourcePostTriage {
  const text = normalize([post.title, post.caption, post.transcript_text].filter(Boolean).join(" "))
  const brandHits = BRAND_TERMS.reduce((count, brand) => count + Number(text.includes(brand)), 0)
  const productHits = hits(text, PRODUCT_TERMS)
  const reviewHits = hits(text, REVIEW_TERMS)
  const commercialHits = hits(text, COMMERCIAL_TERMS)
  const expertHits = hits(text, EXPERT_TERMS)
  const lifestyleHits = hits(text, LIFESTYLE_TERMS)

  if (post.transcription_status === "no_speech" || post.vision_fallback_required) {
    return {
      lane: "vision_required",
      priorityScore: Math.min(100, 55 + brandHits * 12 + productHits * 8),
      reason: "Không có lời nói đáng tin; cần kiểm tra tối đa ba frame.",
      shouldAnalyze: brandHits > 0 || productHits > 0,
    }
  }

  if (expertHits > 0 && reviewHits === 0) {
    return {
      lane: "expert_education",
      priorityScore: Math.min(100, 45 + expertHits * 10 + brandHits * 8 + productHits * 5),
      reason: "Nội dung chuyên môn; chỉ tạo product event khi có exact SKU và hành vi trực tiếp.",
      shouldAnalyze: true,
    }
  }

  if (commercialHits > 0 && reviewHits === 0) {
    return {
      lane: "commercial_trend",
      priorityScore: Math.min(100, 35 + commercialHits * 10 + brandHits * 8 + productHits * 5),
      reason: "Tín hiệu thương mại; dùng cho trend, không mặc định là đang dùng hoặc khuyên dùng.",
      shouldAnalyze: brandHits > 0 || productHits > 0,
    }
  }

  if (brandHits > 0 || productHits > 0 || reviewHits > 0) {
    return {
      lane: "product_review",
      priorityScore: Math.min(100, 50 + brandHits * 10 + productHits * 7 + reviewHits * 8),
      reason: "Có tín hiệu brand/sản phẩm/review trong caption hoặc transcript.",
      shouldAnalyze: true,
    }
  }

  return {
    lane: "lifestyle",
    priorityScore: Math.max(5, 20 - lifestyleHits * 3),
    reason: lifestyleHits > 0 ? "Nội dung lifestyle không có tín hiệu sản phẩm beauty." : "Không phát hiện tín hiệu sản phẩm đủ để đưa vào evidence review.",
    shouldAnalyze: false,
  }
}
