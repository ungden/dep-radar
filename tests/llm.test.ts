import { afterEach, describe, expect, it, vi } from "vitest"
import { AiError, generateJson, modelName, reviewProvider, toGeminiSchema, type AiSchema } from "@/lib/ai/llm"

const schema: AiSchema = {
  type: "object",
  properties: { decision: { type: "string", enum: ["kept", "hidden"] }, reasons: { type: "array", items: { type: "string" } } },
  required: ["decision", "reasons"],
  additionalProperties: false,
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("provider choice", () => {
  it("prefers OpenAI, falls back to Gemini, else rules", () => {
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("GEMINI_API_KEY", "")
    expect(reviewProvider()).toBeNull()
    expect(modelName()).toBe("rules")
    vi.stubEnv("GEMINI_API_KEY", "g")
    expect(reviewProvider()).toBe("gemini")
    vi.stubEnv("OPENAI_API_KEY", "o")
    expect(reviewProvider()).toBe("openai")
    expect(modelName()).toBe("gpt-6-luna")
  })
})

describe("toGeminiSchema", () => {
  it("upper-cases types and drops additionalProperties", () => {
    expect(toGeminiSchema(schema)).toEqual({
      type: "OBJECT",
      properties: { decision: { type: "STRING", enum: ["kept", "hidden"] }, reasons: { type: "ARRAY", items: { type: "STRING" } } },
      required: ["decision", "reasons"],
    })
  })
})

describe("OpenAI call", () => {
  it("sends a strict json_schema with images as data URLs and parses the answer", async () => {
    vi.stubEnv("OPENAI_API_KEY", "o")
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ output: [{ content: [{ type: "output_text", text: '{"decision":"kept","reasons":[]}' }] }] })),
    )
    vi.stubGlobal("fetch", fetchMock)
    const out = await generateJson({ parts: [{ text: "hi" }, { image: { mimeType: "image/jpeg", data: "AAA" } }], schema, name: "t" })
    expect(out).toEqual({ decision: "kept", reasons: [] })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.text.format).toMatchObject({ type: "json_schema", name: "t", strict: true })
    expect(body.input[0].content[1]).toMatchObject({ type: "input_image", image_url: "data:image/jpeg;base64,AAA" })
  })

  it("turns a refusal into a refused error, not a decision", async () => {
    vi.stubEnv("OPENAI_API_KEY", "o")
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ output: [{ content: [{ type: "refusal", refusal: "no" }] }] }))))
    await expect(generateJson({ parts: [{ text: "x" }], schema, name: "t" })).rejects.toMatchObject({ kind: "refused" })
  })

  it("says a missing key is a configuration problem", async () => {
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("GEMINI_API_KEY", "")
    await expect(generateJson({ parts: [{ text: "x" }], schema, name: "t" })).rejects.toBeInstanceOf(AiError)
  })
})
