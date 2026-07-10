import type { CreatorProductEventType, CreatorProductStateValue, EvidenceRiskFlag } from "@/lib/types"

export interface GoldenEvidenceCase {
  id: string
  creatorId: string
  scenario: string
  text: string
  expectedEvent: CreatorProductEventType
  expectedState: CreatorProductStateValue
  expectedProductId: string | null
  riskFlags: EvidenceRiskFlag[]
  synthetic: true
}

const BASE_CASES: Omit<GoldenEvidenceCase, "id" | "creatorId">[] = [
  { scenario: "explicit-current-routine", text: "Đây là serum mình đang dùng trong routine tối nay.", expectedEvent: "used", expectedState: "current", expectedProductId: "1", riskFlags: [], synthetic: true },
  { scenario: "repurchased", text: "Mình đã mua lại chai này lần thứ ba.", expectedEvent: "repurchased", expectedState: "current", expectedProductId: "1", riskFlags: [], synthetic: true },
  { scenario: "review-only", text: "Video này review ưu nhược điểm sau khi test.", expectedEvent: "reviewed", expectedState: "reviewed_only", expectedProductId: "2", riskFlags: [], synthetic: true },
  { scenario: "sponsored", text: "Nội dung được tài trợ, dùng mã giảm giá của mình.", expectedEvent: "sponsored", expectedState: "promoted_only", expectedProductId: "3", riskFlags: [], synthetic: true },
  { scenario: "live-sale", text: "Chốt đơn ngay trong phiên live hôm nay.", expectedEvent: "live_sold", expectedState: "promoted_only", expectedProductId: "4", riskFlags: [], synthetic: true },
  { scenario: "background-only", text: "Sản phẩm chỉ xuất hiện mờ ở phía sau.", expectedEvent: "mentioned", expectedState: "unknown", expectedProductId: null, riskFlags: ["ocr_only", "ambiguous_variant"], synthetic: true },
  { scenario: "unboxing", text: "Mở hộp PR package, chưa dùng thử.", expectedEvent: "unboxed", expectedState: "unknown", expectedProductId: "5", riskFlags: [], synthetic: true },
  { scenario: "negative", text: "Mình đã dùng nhưng sản phẩm không hợp da.", expectedEvent: "disliked", expectedState: "disliked", expectedProductId: "6", riskFlags: [], synthetic: true },
  { scenario: "stopped", text: "Mình đã ngừng dùng và chuyển sang sản phẩm khác.", expectedEvent: "stopped_using", expectedState: "past", expectedProductId: "7", riskFlags: [], synthetic: true },
  { scenario: "ambiguous-bundle", text: "Cả set này có nhiều chai gần giống nhau.", expectedEvent: "mentioned", expectedState: "unknown", expectedProductId: null, riskFlags: ["ambiguous_variant", "multi_product_bundle"], synthetic: true },
]

/**
 * Deterministic 500-case synthetic contract suite covering 50 creators.
 * It protects rules and schemas; it does not count toward the real 500-post pilot gate.
 */
export const SYNTHETIC_GOLDEN_CASES: GoldenEvidenceCase[] = Array.from({ length: 50 }, (_, creatorIndex) =>
  BASE_CASES.map((base, scenarioIndex) => ({
    ...base,
    id: `synthetic-${creatorIndex + 1}-${scenarioIndex + 1}`,
    creatorId: `synthetic-creator-${creatorIndex + 1}`,
  }))
).flat()
