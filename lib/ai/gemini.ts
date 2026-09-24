/**
 * One call to Gemini that answers in JSON, shared by identity verification
 * (app/api/identity) and the profile reviewer (lib/ai/review.ts). Server only:
 * it reads GEMINI_API_KEY.
 *
 * Errors carry a kind, because the callers treat them differently: a missing
 * key or a model name that does not exist is a configuration mistake to show
 * the staff, anything else is an outage worth retrying later.
 */

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash"

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } }

export class GeminiError extends Error {
  constructor(
    readonly kind: "no_key" | "model_not_found" | "http" | "empty" | "invalid_json",
    message: string,
  ) {
    super(message)
    this.name = "GeminiError"
  }
}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

/**
 * Sends the parts, returns the parsed JSON (unknown: the caller validates it).
 * `schema` is Gemini's response schema, so the model cannot answer in prose.
 */
export async function generateJson(input: {
  parts: GeminiPart[]
  schema: Record<string, unknown>
  timeoutMs?: number
}): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) throw new GeminiError("no_key", "GEMINI_API_KEY is not set")
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(input.timeoutMs ?? 25_000),
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: input.parts }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: input.schema },
    }),
  })
  if (res.status === 404) throw new GeminiError("model_not_found", `model_not_found:${GEMINI_MODEL}`)
  if (!res.ok) throw new GeminiError("http", `Gemini ${res.status}`)
  const json = await res.json()
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new GeminiError("empty", "Empty response")
  try {
    return JSON.parse(text)
  } catch {
    throw new GeminiError("invalid_json", "invalid_response")
  }
}
