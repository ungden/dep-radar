/**
 * One call to a vision model that answers in JSON, whichever provider is set.
 * Server only: it reads the keys.
 *
 * OpenAI (OPENAI_API_KEY, model OPENAI_MODEL, default gpt-6-luna) is the
 * reviewer of partner profiles and posts. Gemini (GEMINI_API_KEY) is kept for
 * identity verification only: OpenAI's models decline to say whether a selfie
 * and the photo on an ID card are the same person, which is the whole check.
 *
 * Errors carry a kind, because the callers treat them differently: a missing
 * key or a model name that does not exist is a configuration mistake to show
 * the staff, a refusal is an answer, anything else is an outage worth retrying.
 */

export type AiProvider = "openai" | "gemini"

export type AiPart = { text: string } | { image: { mimeType: string; data: string } }

/** A JSON Schema in the subset both providers accept: objects with every field required, strings, enums, arrays. */
export type AiSchema = {
  type: "object"
  properties: Record<string, { type: "string"; enum?: string[] } | { type: "array"; items: { type: "string" } } | { type: "boolean" } | { type: "number" }>
  required: string[]
  additionalProperties: false
}

export class AiError extends Error {
  constructor(
    readonly kind: "no_key" | "model_not_found" | "http" | "empty" | "invalid_json" | "refused",
    message: string,
  ) {
    super(message)
    this.name = "AiError"
  }
}

const OPENAI_MODEL = () => process.env.OPENAI_MODEL?.trim() || "gpt-6-luna"
const GEMINI_MODEL = () => process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash"

const hasKey = (p: AiProvider) =>
  Boolean((p === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY)?.trim())

/** The provider for reviews: OpenAI when its key is set, else Gemini, else none. */
export function reviewProvider(): AiProvider | null {
  if (hasKey("openai")) return "openai"
  if (hasKey("gemini")) return "gemini"
  return null
}

export const aiConfigured = (provider: AiProvider | null = reviewProvider()) => Boolean(provider && hasKey(provider))

/** What is written in the log as the model that decided. */
export function modelName(provider: AiProvider | null = reviewProvider()): string {
  if (provider === "openai") return OPENAI_MODEL()
  if (provider === "gemini") return GEMINI_MODEL()
  return "rules"
}

/** Sends the parts, returns the parsed JSON (unknown: the caller validates it). */
export async function generateJson(input: {
  parts: AiPart[]
  schema: AiSchema
  /** A short name for the schema (OpenAI requires one). */
  name: string
  provider?: AiProvider | null
  timeoutMs?: number
}): Promise<unknown> {
  const provider = input.provider === undefined ? reviewProvider() : input.provider
  if (!provider || !hasKey(provider)) throw new AiError("no_key", "no AI key is set")
  return provider === "openai" ? openai(input) : gemini(input)
}

async function openai(input: { parts: AiPart[]; schema: AiSchema; name: string; timeoutMs?: number }) {
  const model = OPENAI_MODEL()
  const content = input.parts.map((p) =>
    "text" in p
      ? { type: "input_text", text: p.text }
      : { type: "input_image", image_url: `data:${p.image.mimeType};base64,${p.image.data}`, detail: "low" },
  )
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(input.timeoutMs ?? 25_000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY!.trim()}` },
    body: JSON.stringify({
      model,
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: input.name, schema: input.schema, strict: true } },
      store: false,
    }),
  })
  if (res.status === 404) throw new AiError("model_not_found", `model_not_found:${model}`)
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    if (res.status === 400 && /model/i.test(body) && /(does not exist|not found|invalid)/i.test(body)) {
      throw new AiError("model_not_found", `model_not_found:${model}`)
    }
    throw new AiError("http", `OpenAI ${res.status}`)
  }
  const json = await res.json()
  const parts: { type?: string; text?: string; refusal?: string }[] = (json?.output ?? []).flatMap(
    (o: { content?: unknown[] }) => (Array.isArray(o?.content) ? o.content : []),
  )
  const refusal = parts.find((c) => c.type === "refusal")
  if (refusal) throw new AiError("refused", refusal.refusal || "refused")
  const text = (typeof json?.output_text === "string" && json.output_text) || parts.find((c) => c.type === "output_text")?.text
  if (!text) throw new AiError("empty", "Empty response")
  try {
    return JSON.parse(text)
  } catch {
    throw new AiError("invalid_json", "invalid_response")
  }
}

/** Gemini wants its own schema dialect: upper-case types, no additionalProperties. */
export function toGeminiSchema(schema: AiSchema): Record<string, unknown> {
  const convert = (s: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = { type: String(s.type).toUpperCase() }
    if (s.enum) out.enum = s.enum
    if (s.items) out.items = convert(s.items as Record<string, unknown>)
    if (s.properties) {
      out.properties = Object.fromEntries(
        Object.entries(s.properties as Record<string, Record<string, unknown>>).map(([k, v]) => [k, convert(v)]),
      )
    }
    if (s.required) out.required = s.required
    return out
  }
  return convert(schema as unknown as Record<string, unknown>)
}

async function gemini(input: { parts: AiPart[]; schema: AiSchema; timeoutMs?: number }) {
  const model = GEMINI_MODEL()
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(input.timeoutMs ?? 25_000),
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY!.trim() },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: input.parts.map((p) => ("text" in p ? { text: p.text } : { inlineData: p.image })),
        },
      ],
      generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: toGeminiSchema(input.schema) },
    }),
  })
  if (res.status === 404) throw new AiError("model_not_found", `model_not_found:${model}`)
  if (!res.ok) throw new AiError("http", `Gemini ${res.status}`)
  const json = await res.json()
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new AiError("empty", "Empty response")
  try {
    return JSON.parse(text)
  } catch {
    throw new AiError("invalid_json", "invalid_response")
  }
}
