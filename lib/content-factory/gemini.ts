import "server-only"

import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import { CONTENT_FACTORY_PROMPT_VERSION, stableHash } from "@/lib/content-factory/policy"
import type {
  ContentJobRecord,
  ContentRiskLevel,
  FactorySource,
  StructuredDraft,
  VerificationResult,
} from "@/lib/content-factory/types"

export const CONTENT_MODEL_LITE = process.env.CONTENT_FACTORY_GEMINI_LITE_MODEL || "gemini-2.5-flash-lite"
export const CONTENT_MODEL_FLASH = process.env.CONTENT_FACTORY_GEMINI_FLASH_MODEL || "gemini-2.5-flash"

export class ContentProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ContentProviderConfigurationError"
  }
}

type UsageMetadata = {
  promptTokenCount?: number
  candidatesTokenCount?: number
  cachedContentTokenCount?: number
}

function modelFor(risk: ContentRiskLevel) {
  return risk === "high" ? CONTENT_MODEL_FLASH : CONTENT_MODEL_LITE
}

function responseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return ""
  const candidates = (payload as { candidates?: unknown[] }).candidates
  if (!Array.isArray(candidates)) return ""
  return candidates.flatMap((candidate) => {
    const parts = (candidate as { content?: { parts?: Array<{ text?: string }> } }).content?.parts
    return Array.isArray(parts) ? parts.map((part) => part.text ?? "") : []
  }).join("")
}

function providerMessage(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { status?: string; message?: string } }
    return [parsed.error?.status, parsed.error?.message].filter(Boolean).join(": ")
  } catch {
    return body.slice(0, 500)
  }
}

let providerPreflight: Promise<void> | null = null

export function isContentProviderConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

export async function assertContentProviderReady(model = CONTENT_MODEL_LITE) {
  if (providerPreflight) return providerPreflight
  providerPreflight = (async () => {
    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) throw new ContentProviderConfigurationError("GEMINI_API_KEY is not configured")
    const normalizedModel = model.replace(/^models\//, "")
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(normalizedModel)}`, {
      method: "GET",
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) {
      throw new ContentProviderConfigurationError(`Gemini provider is not ready (${response.status}): ${providerMessage(await response.text())}`)
    }
  })()
  try {
    await providerPreflight
  } catch (error) {
    providerPreflight = null
    throw error
  }
}

function priceFor(model: string) {
  const isLite = model.includes("lite")
  return {
    inputPerMillion: Number(process.env[isLite ? "CONTENT_FACTORY_LITE_INPUT_USD_PER_M" : "CONTENT_FACTORY_FLASH_INPUT_USD_PER_M"] ?? (isLite ? 0.1 : 0.3)),
    outputPerMillion: Number(process.env[isLite ? "CONTENT_FACTORY_LITE_OUTPUT_USD_PER_M" : "CONTENT_FACTORY_FLASH_OUTPUT_USD_PER_M"] ?? (isLite ? 0.4 : 2.5)),
  }
}

function estimateCost(model: string, usage: UsageMetadata) {
  const price = priceFor(model)
  const uncachedInput = Math.max(0, Number(usage.promptTokenCount ?? 0) - Number(usage.cachedContentTokenCount ?? 0))
  return uncachedInput / 1_000_000 * price.inputPerMillion
    + Number(usage.candidatesTokenCount ?? 0) / 1_000_000 * price.outputPerMillion
}

async function invokeModel<T>(params: {
  job: ContentJobRecord
  stage: "draft" | "verify"
  model: string
  prompt: string
  schema: Record<string, unknown>
  retryNumber: number
}) {
  const supabase = getSupabaseAdmin()
  const idempotencyKey = `${params.job.id}:${params.stage}:${CONTENT_FACTORY_PROMPT_VERSION}:${params.model}`
  const previous = await supabase.from("content_runs").select("status,metadata").eq("idempotency_key", idempotencyKey).maybeSingle()
  if (previous.data?.status === "completed") {
    const output = (previous.data.metadata as { output?: T } | null)?.output
    if (output) return output
  }

  const run = await supabase.from("content_runs").upsert({
    job_id: params.job.id,
    stage: params.stage,
    provider: "google-gemini",
    model: params.model,
    prompt_version: CONTENT_FACTORY_PROMPT_VERSION,
    prompt_hash: stableHash(params.prompt),
    cost_category: "ai_text",
    retry_number: params.retryNumber,
    idempotency_key: idempotencyKey,
    status: "running",
    metadata: { reused: false },
    started_at: new Date().toISOString(),
    finished_at: null,
  }, { onConflict: "idempotency_key" }).select("id").single()
  if (run.error) throw new Error(`Cannot start content model run: ${run.error.message}`)

  try {
    await assertContentProviderReady(params.model)
    const apiKey = process.env.GEMINI_API_KEY?.trim() as string
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model.replace(/^models\//, ""))}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: params.prompt }] }],
        generationConfig: {
          temperature: params.stage === "verify" ? 0 : 0.2,
          maxOutputTokens: params.stage === "verify" ? 8192 : 16384,
          responseMimeType: "application/json",
          responseJsonSchema: params.schema,
        },
      }),
      signal: AbortSignal.timeout(150_000),
    })
    const raw = await response.text()
    if (!response.ok) throw new Error(`Gemini ${params.stage} failed (${response.status}): ${providerMessage(raw)}`)
    const payload = JSON.parse(raw) as { usageMetadata?: UsageMetadata }
    const text = responseText(payload)
    if (!text) throw new Error(`Gemini ${params.stage} returned no text`)
    const output = JSON.parse(text) as T
    const usage = payload.usageMetadata ?? {}
    const actualCost = estimateCost(params.model, usage)
    const completed = await supabase.from("content_runs").update({
      status: "completed",
      input_tokens: Number(usage.promptTokenCount ?? 0),
      output_tokens: Number(usage.candidatesTokenCount ?? 0),
      cached_tokens: Number(usage.cachedContentTokenCount ?? 0),
      estimated_cost_usd: actualCost,
      actual_cost_usd: actualCost,
      metadata: { output },
      finished_at: new Date().toISOString(),
    }).eq("id", run.data.id)
    if (completed.error) throw new Error(`Cannot checkpoint content model output: ${completed.error.message}`)
    return output
  } catch (error) {
    await supabase.from("content_runs").update({
      status: "failed",
      error_code: error instanceof ContentProviderConfigurationError ? "provider_configuration" : "provider_error",
      error_message: error instanceof Error ? error.message : String(error),
      finished_at: new Date().toISOString(),
    }).eq("id", run.data.id)
    throw error
  }
}

const draftSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["title", "slug", "excerpt", "content", "hubSlug", "intent", "contentFormat", "category", "tags", "image", "takeaways", "faq", "medicalDisclaimerLevel", "productIds", "internalLinkSlugs", "claims"],
  properties: {
    title: { type: "string" }, slug: { type: "string" }, excerpt: { type: "string" }, content: { type: "string" },
    hubSlug: { type: "string" }, intent: { type: "string", enum: ["pillar", "problem-solving", "decision", "safety"] },
    contentFormat: { type: "string", enum: ["guide", "checklist", "comparison", "explainer", "review"] },
    category: { type: "string" }, tags: { type: "array", minItems: 3, maxItems: 10, items: { type: "string" } },
    image: { type: "string" }, takeaways: { type: "array", minItems: 3, maxItems: 7, items: { type: "string" } },
    faq: { type: "array", minItems: 2, maxItems: 6, items: { type: "object", additionalProperties: false, required: ["question", "answer"], properties: { question: { type: "string" }, answer: { type: "string" } } } },
    medicalDisclaimerLevel: { type: "string", enum: ["none", "light", "medical"] },
    productIds: { type: "array", items: { type: "string" } }, internalLinkSlugs: { type: "array", maxItems: 8, items: { type: "string" } },
    claims: { type: "array", minItems: 1, maxItems: 40, items: { type: "object", additionalProperties: false, required: ["key", "text", "type", "riskLevel", "sourceUrls"], properties: {
      key: { type: "string" }, text: { type: "string" }, type: { type: "string", enum: ["fact", "product", "safety", "recommendation", "experience"] },
      riskLevel: { type: "string", enum: ["low", "medium", "high"] }, sourceUrls: { type: "array", minItems: 1, items: { type: "string" } },
    } } },
  },
}

const verificationSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["score", "summary", "claims", "unsupportedClaims", "contradictoryClaims", "policyFlags"],
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 }, summary: { type: "string" },
    claims: { type: "array", maxItems: 40, items: { type: "object", additionalProperties: false, required: ["key", "text", "type", "riskLevel", "sourceUrls", "status", "confidence", "note"], properties: {
      key: { type: "string" }, text: { type: "string" }, type: { type: "string", enum: ["fact", "product", "safety", "recommendation", "experience"] },
      riskLevel: { type: "string", enum: ["low", "medium", "high"] }, sourceUrls: { type: "array", items: { type: "string" } },
      status: { type: "string", enum: ["supported", "unsupported", "contradictory", "not_applicable"] }, confidence: { type: "integer", minimum: 0, maximum: 100 }, note: { type: "string" },
    } } },
    unsupportedClaims: { type: "array", items: { type: "string" } }, contradictoryClaims: { type: "array", items: { type: "string" } }, policyFlags: { type: "array", items: { type: "string" } },
  },
}

function sourcesForPrompt(sources: FactorySource[]) {
  return sources.map((source, index) => ({
    id: `S${index + 1}`,
    url: source.url,
    title: source.title,
    publisher: source.publisher,
    tier: source.tier,
    official: source.official,
    regulatorOrProfessional: source.regulatorOrProfessional,
    excerpt: source.excerpt?.slice(0, 5000) ?? "",
  }))
}

export async function generateDraft(params: {
  job: ContentJobRecord
  subject: string
  existingPost?: Record<string, unknown> | null
  ownData: Record<string, unknown>
  sources: FactorySource[]
  existingSlugs: string[]
}) {
  const model = modelFor(params.job.risk_level)
  const prompt = `Bạn là biên tập viên chính của 360dep.vn, một beauty decision engine dựa trên bằng chứng cho người Việt.

Nhiệm vụ: ${params.job.job_type === "refresh" ? "làm mới bài hiện có" : "viết bài mới"} về ${params.subject}.
Risk level: ${params.job.risk_level}. Hub: ${params.job.hub_slug ?? "product-radar"}. Intent: ${params.job.intent ?? "decision"}.

NGUYÊN TẮC BẮT BUỘC:
- Chỉ dùng sự kiện trong OWN_DATA và SOURCE_EXCERPTS. Không suy đoán kết quả cá nhân, giá, tồn kho hoặc mức độ phổ biến.
- Mỗi claim kiểm chứng được phải map tới URL nguồn cụ thể. Phân biệt quan sát creator với khuyến nghị chuyên môn.
- Không bịa review, quote, trải nghiệm, affiliate link hay sản phẩm. Không dùng ngôn ngữ chữa khỏi/cam kết.
- Tạo 900-1.500 từ tiếng Việt, thực dụng, nêu trade-off, ranh giới an toàn và khi nào cần chuyên gia.
- Markdown content không chứa H1, không chèn URL ngoài; UI sẽ render nguồn từ claim map.
- Slug không được trùng EXISTING_SLUGS. Ảnh dùng asset hub, không tạo ảnh sản phẩm/AI.
- ProductIds chỉ được lấy nguyên văn từ OWN_DATA. InternalLinkSlugs chỉ được lấy từ EXISTING_SLUGS.

SUBJECT=${JSON.stringify(params.subject)}
EXISTING_POST=${JSON.stringify(params.existingPost ?? null)}
OWN_DATA=${JSON.stringify(params.ownData)}
SOURCE_EXCERPTS=${JSON.stringify(sourcesForPrompt(params.sources))}
EXISTING_SLUGS=${JSON.stringify(params.existingSlugs)}

Trả về JSON đúng schema.`
  const draft = await invokeModel<StructuredDraft>({ job: params.job, stage: "draft", model, prompt, schema: draftSchema, retryNumber: params.job.attempt_count })
  return { draft, model }
}

export async function verifyDraft(params: { job: ContentJobRecord; draft: StructuredDraft; sources: FactorySource[] }) {
  const model = modelFor(params.job.risk_level)
  const prompt = `Bạn là verifier độc lập của 360dep.vn. Bạn không phải tác giả và phải fail closed.

Đối chiếu từng claim trong DRAFT với SOURCE_EXCERPTS. Một claim chỉ supported khi excerpt trực tiếp hỗ trợ; URL tồn tại không đủ. Đánh dấu contradictory khi nguồn mâu thuẫn. Gắn policyFlags cho medical promise, fake experience/review, affiliate không disclosure, hoặc claim không có nguồn. High-risk chỉ được điểm >=95 khi không còn unsupported/contradictory và có nguồn chuyên môn phù hợp. Không sửa bài, chỉ audit.

DRAFT=${JSON.stringify(params.draft)}
SOURCE_EXCERPTS=${JSON.stringify(sourcesForPrompt(params.sources))}

Trả về JSON đúng schema.`
  const verification = await invokeModel<VerificationResult>({ job: params.job, stage: "verify", model, prompt, schema: verificationSchema, retryNumber: params.job.attempt_count })
  return { verification, model }
}
