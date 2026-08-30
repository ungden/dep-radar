import "server-only"

import { findBeautyBrand } from "@/lib/brand-registry"
import type { EvidenceClaim, EvidenceRiskFlag, Product, SourcePost } from "@/lib/types"

export const EVIDENCE_PROMPT_VERSION = "evidence-radar-v3-cost-aware-trust-first"
export const EVIDENCE_MODEL = process.env.EVIDENCE_RADAR_GEMINI_MODEL || "gemini-3.5-flash"

export class EvidenceProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EvidenceProviderConfigurationError"
  }
}

const EVENT_TYPES = [
  "mentioned", "unboxed", "used", "reviewed", "recommended", "disliked", "emptied",
  "repurchased", "switched_to", "stopped_using", "live_sold", "sponsored",
] as const

const RISK_FLAGS: EvidenceRiskFlag[] = [
  "ocr_only", "ambiguous_variant", "disclosure_unknown", "repost", "multi_product_bundle",
  "source_unavailable", "product_not_in_catalogue", "contradictory_claim",
]

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function clampScore(value: unknown, max: number) {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(max, Math.round(number))) : 0
}

function providerErrorMessage(rawBody: string) {
  try {
    const parsed = JSON.parse(rawBody) as {
      error?: { message?: string; status?: string; details?: Array<{ reason?: string }> }
    }
    const reason = parsed.error?.details?.find((detail) => detail.reason)?.reason
    return [parsed.error?.status, reason, parsed.error?.message].filter(Boolean).join(": ")
  } catch {
    return rawBody.slice(0, 500)
  }
}

export async function assertEvidenceProviderReady() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new EvidenceProviderConfigurationError("GEMINI_API_KEY is not configured")
  const model = EVIDENCE_MODEL.replace(/^models\//, "")
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`,
    {
      method: "GET",
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(20_000),
    },
  )
  if (!response.ok) {
    const detail = providerErrorMessage(await response.text())
    throw new EvidenceProviderConfigurationError(
      `Gemini provider is not ready (${response.status})${detail ? `: ${detail}` : ""}`,
    )
  }
}

function matchClaimToProduct(claim: EvidenceClaim, products: Product[]) {
  const registeredClaimBrand = findBeautyBrand(claim.brand)?.name ?? claim.brand
  const normalizedClaimBrand = normalize(registeredClaimBrand)
  const claimName = normalize([claim.product_name, claim.variant ?? ""].join(" "))
  const needle = normalize([registeredClaimBrand, claim.product_name, claim.variant ?? ""].join(" "))
  const ranked = products
    .map((product) => {
      const registeredProductBrand = findBeautyBrand(product.brand)?.name ?? product.brand
      const productBrand = normalize(registeredProductBrand)
      if (!normalizedClaimBrand || normalizedClaimBrand !== productBrand) return { product, score: 0 }
      const names = [product.name, ...(product.aliases ?? [])]
      const score = names.reduce((best, candidate) => {
        const normalizedCandidate = normalize(candidate)
        if (!normalizedCandidate) return best
        const combinedCandidate = normalize(`${registeredProductBrand} ${candidate}`)
        if (needle === combinedCandidate || claimName === normalizedCandidate) return Math.max(best, 100)
        if (claimName.includes(normalizedCandidate) || normalizedCandidate.includes(claimName)) return Math.max(best, 88)
        const tokens = normalizedCandidate.split(" ").filter((token) => token.length > 2)
        const overlap = tokens.filter((token) => needle.includes(token)).length
        return Math.max(best, tokens.length ? Math.round(overlap / tokens.length * 70) : 0)
      }, 0)
      return { product, score }
    })
    .sort((a, b) => b.score - a.score)

  if (!ranked[0] || ranked[0].score < 85 || ranked[0].score === ranked[1]?.score) return null
  return ranked[0].product.id
}

function catalogueForPrompt(post: SourcePost, products: Product[]) {
  const sourceText = normalize([post.title, post.caption, post.transcript_text ?? ""].join(" "))
  if (!sourceText) return []

  return products.map((product) => {
    const registeredBrand = findBeautyBrand(product.brand)?.name ?? product.brand
    const brand = normalize(registeredBrand)
    const names = [product.name, ...(product.aliases ?? [])]
    const exactNameMatches = names
      .map(normalize)
      .filter((name) => name.length > 3 && sourceText.includes(name))
      .length
    const brandMatch = Boolean(brand && sourceText.includes(brand))
    return {
      product,
      score: (brandMatch ? 100 : 0) + exactNameMatches * 10,
    }
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ product }) => ({
    id: product.id,
    brand: product.brand,
    name: product.name,
    aliases: product.aliases ?? [],
    }))
}

function responseSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["claims"],
    properties: {
      claims: {
        type: "array",
        maxItems: 30,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "product_name", "brand", "variant", "event_type", "sentiment", "disclosure",
            "usage_context", "evidence_spans", "product_identity_score", "action_evidence_score",
            "source_authenticity_score", "evidence_localization_score", "risk_flags",
          ],
          properties: {
            product_name: { type: "string" },
            brand: { type: "string" },
            variant: { type: ["string", "null"] },
            event_type: { type: "string", enum: [...EVENT_TYPES] },
            sentiment: { type: "string", enum: ["positive", "mixed", "negative", "neutral"] },
            disclosure: { type: "string", enum: ["organic", "pr", "sponsored", "affiliate", "unknown"] },
            usage_context: { type: ["string", "null"] },
            evidence_spans: {
              type: "array",
              minItems: 1,
              maxItems: 6,
              items: {
                type: "object",
                required: ["kind", "value", "timestamp_seconds"],
                properties: {
                  kind: { type: "string", enum: ["quote", "timestamp", "frame", "caption"] },
                  value: { type: "string" },
                  timestamp_seconds: { type: ["number", "null"] },
                },
              },
            },
            product_identity_score: { type: "integer", minimum: 0, maximum: 40 },
            action_evidence_score: { type: "integer", minimum: 0, maximum: 35 },
            source_authenticity_score: { type: "integer", minimum: 0, maximum: 15 },
            evidence_localization_score: { type: "integer", minimum: 0, maximum: 10 },
            risk_flags: { type: "array", items: { type: "string", enum: RISK_FLAGS } },
          },
        },
      },
    },
  }
}

async function mediaInput(post: SourcePost) {
  if (!post.media_url) return []
  if (post.source_platform.toLowerCase().includes("youtube")) {
    return [{ type: "video", uri: post.source_url }]
  }

  try {
    const response = await fetch(post.media_url, { signal: AbortSignal.timeout(20_000) })
    if (!response.ok) return []
    const contentLength = Number(response.headers.get("content-length") || 0)
    // Transcript is not a substitute for visual SKU evidence. Keep the
    // payload bounded and let the collector send sampled media only.
    if (contentLength > 20_000_000) return []
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > 20_000_000) return []
    const mimeType = (response.headers.get("content-type") || "video/mp4").split(";", 1)[0].trim()
    return [{ type: mimeType.startsWith("image/") ? "image" : "video", data: buffer.toString("base64"), mime_type: mimeType }]
  } catch {
    return []
  }
}

function extractGenerateContentText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return ""
  const candidates = (payload as Record<string, unknown>).candidates
  if (!Array.isArray(candidates)) return ""
  for (const candidate of candidates) {
    const content = (candidate as Record<string, unknown>).content
    if (!content || typeof content !== "object") continue
    const parts = (content as Record<string, unknown>).parts
    if (!Array.isArray(parts)) continue
    const text = parts
      .map((part) => (part as Record<string, unknown>).text)
      .filter((value): value is string => typeof value === "string")
      .join("")
    if (text) return text
  }
  return ""
}

async function generateStructuredContent(
  apiKey: string,
  prompt: string,
  media: Array<Record<string, string>>,
) {
  const model = EVIDENCE_MODEL.replace(/^models\//, "")
  const parts: Array<Record<string, unknown>> = media.map((item) => {
    if (item.data) {
      return {
        inlineData: {
          mimeType: item.mime_type || "application/octet-stream",
          data: item.data,
        },
      }
    }
    return {
      fileData: {
        mimeType: item.type === "image" ? "image/jpeg" : "video/mp4",
        fileUri: item.uri,
      },
    }
  })
  parts.push({ text: prompt })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: responseSchema(),
        },
      }),
      signal: AbortSignal.timeout(120_000),
    },
  )
  if (!response.ok) {
    const detail = providerErrorMessage(await response.text())
    throw new Error(
      `Gemini evidence extraction failed (${response.status})${detail ? `: ${detail}` : ""}`,
    )
  }
  return extractGenerateContentText(await response.json())
}

export async function extractEvidenceClaims(post: SourcePost, products: Product[]): Promise<EvidenceClaim[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new EvidenceProviderConfigurationError("GEMINI_API_KEY is not configured")

  const media = await mediaInput(post)
  const prompt = [
    "Bạn là evidence analyst cho KOL/KOC beauty Việt Nam.",
    "Chỉ trích xuất sản phẩm có bằng chứng trực tiếp trong nội dung. Không suy đoán từ comment hoặc đồ vật nền.",
    "Phân biệt rõ sử dụng, review, recommend, unbox, quảng cáo/tài trợ và live bán hàng.",
    "Một review hoặc affiliate link không tự động là đang dùng. Cầm hộp không tự động là used.",
    "Không suy ra organic. Chỉ chọn organic khi creator nói rõ tự mua/không booking hoặc có bằng chứng tương đương; còn lại chọn unknown.",
    "Tên dòng sản phẩm chưa đủ để khẳng định variant, dung tích, màu hoặc nồng độ. Nếu thiếu chi tiết exact SKU phải gắn ambiguous_variant.",
    "Nội dung bác sĩ về hoạt chất/phác đồ không phải recommendation sản phẩm nếu không có hành vi trực tiếp với exact SKU.",
    "Mọi claim phải có quote/caption/frame/timestamp cụ thể. Nếu không chắc variant, gắn ambiguous_variant.",
    "Nếu có video hoặc frame kèm theo, hãy đối chiếu nhãn/bao bì với transcript; transcript không đủ để suy ra variant khi hình ảnh mâu thuẫn.",
    "Chỉ trả về một JSON object có key claims. Không thêm markdown hoặc giải thích ngoài JSON.",
    `JSON contract bắt buộc: ${JSON.stringify(responseSchema())}`,
    `Nguồn: ${post.source_platform} ${post.source_url}`,
    `Tiêu đề: ${post.title}`,
    `Caption: ${post.caption}`,
    `Transcript lời nói: ${post.transcript_text?.trim() || "(không có transcript; chỉ dùng caption/media nếu khả dụng)"}`,
    "Catalogue candidates là shortlist có thể không đầy đủ. Vẫn trích xuất mọi exact SKU có bằng chứng trực tiếp; hệ thống sẽ match lại sau.",
    `Catalogue candidates: ${JSON.stringify(catalogueForPrompt(post, products))}`,
  ].join("\n")

  const text = await generateStructuredContent(apiKey, prompt, media)
  if (!text) throw new Error("Gemini returned no structured evidence output")
  const envelope = JSON.parse(text) as { claims?: Array<Record<string, unknown>> }
  const parsed = envelope.claims
  if (!Array.isArray(parsed)) throw new Error("Gemini evidence output has no claims array")

  return parsed.map((raw) => {
    const identity = clampScore(raw.product_identity_score, 40)
    const action = clampScore(raw.action_evidence_score, 35)
    const source = clampScore(raw.source_authenticity_score, 15)
    const localization = clampScore(raw.evidence_localization_score, 10)
    const claim = {
      ...raw,
      product_name: String(raw.product_name || ""),
      brand: String(raw.brand || ""),
      variant: typeof raw.variant === "string" ? raw.variant : null,
      matched_product_id: null,
      event_type: EVENT_TYPES.includes(raw.event_type as typeof EVENT_TYPES[number]) ? raw.event_type : "mentioned",
      sentiment: ["positive", "mixed", "negative", "neutral"].includes(String(raw.sentiment)) ? raw.sentiment : "neutral",
      disclosure: ["organic", "pr", "sponsored", "affiliate", "unknown"].includes(String(raw.disclosure)) ? raw.disclosure : "unknown",
      usage_context: typeof raw.usage_context === "string" ? raw.usage_context : null,
      evidence_spans: Array.isArray(raw.evidence_spans) ? raw.evidence_spans : [],
      product_identity_score: identity,
      action_evidence_score: action,
      source_authenticity_score: source,
      evidence_localization_score: localization,
      confidence_score: identity + action + source + localization,
      risk_flags: Array.isArray(raw.risk_flags)
        ? raw.risk_flags.filter((flag): flag is EvidenceRiskFlag => RISK_FLAGS.includes(flag as EvidenceRiskFlag))
        : [],
    } as EvidenceClaim
    claim.matched_product_id = matchClaimToProduct(claim, products)
    if (!claim.matched_product_id && !claim.risk_flags.includes("product_not_in_catalogue")) {
      claim.risk_flags.push("product_not_in_catalogue")
    }
    if (claim.disclosure === "unknown" && !claim.risk_flags.includes("disclosure_unknown")) {
      claim.risk_flags.push("disclosure_unknown")
    }
    return claim
  })
}

export function requiresHumanReview(claim: EvidenceClaim, goldenSampleCount: number) {
  if (goldenSampleCount < 500) return true
  return claim.confidence_score < 90 || claim.risk_flags.length > 0
}
