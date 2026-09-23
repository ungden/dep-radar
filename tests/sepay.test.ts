import { describe, expect, it } from "vitest"
import { checkApiKey, memoCandidates, parseSepay } from "@/lib/payments/sepay"
import { payMemo } from "@/lib/connection"

describe("checkApiKey", () => {
  it("is off without a configured key, whatever the request says", () => {
    expect(checkApiKey("Apikey secret", undefined)).toBe("off")
    expect(checkApiKey("Apikey secret", "  ")).toBe("off")
  })

  it("accepts the key in SePay's header format", () => {
    expect(checkApiKey("Apikey s3cret-KEY", "s3cret-KEY")).toBe("ok")
    expect(checkApiKey("apikey   s3cret-KEY  ", "s3cret-KEY")).toBe("ok")
  })

  it("refuses a missing, wrong or differently shaped header", () => {
    expect(checkApiKey(null, "s3cret")).toBe("denied")
    expect(checkApiKey("", "s3cret")).toBe("denied")
    expect(checkApiKey("Bearer s3cret", "s3cret")).toBe("denied")
    expect(checkApiKey("Apikey s3creX", "s3cret")).toBe("denied")
    expect(checkApiKey("Apikey s3cret-longer", "s3cret")).toBe("denied")
    expect(checkApiKey("s3cret", "s3cret")).toBe("denied")
  })
})

const sample = {
  id: 92704,
  gateway: "Vietcombank",
  transactionDate: "2026-09-23 14:02:37",
  accountNumber: "0123499999",
  code: null,
  content: `CT DEN:123 ${payMemo("AB23CD")} chuyen tien`,
  transferType: "in",
  transferAmount: 250000,
  accumulated: 19077000,
  subAccount: null,
  referenceCode: "MBVCB.3278907687",
  description: "",
}

describe("memoCandidates", () => {
  it("puts the freelancer's code first, clean", () => {
    expect(memoCandidates("CT DEN:123 NAP AB23CD chuyen tien")).toEqual(["NAP AB23CD", "CT DEN:123 NAP AB23CD chuyen tien"])
    expect(memoCandidates("nap ab23cd")).toEqual(["NAP AB23CD", "nap ab23cd"])
  })

  it("does not let the interbank word NAPAS hide the real code", () => {
    const memo = "IBFT NAPAS2479 NAP AB23CD"
    expect(memoCandidates(memo)).toEqual(["NAP AS2479", "NAP AB23CD", memo])
  })

  it("still passes a memo with no clean code on as it came", () => {
    expect(memoCandidates("chuyen tien an trua")).toEqual(["chuyen tien an trua"])
    expect(memoCandidates("NAPAB23CDXYZ")).toEqual(["NAPAB23CDXYZ"])
  })
})

describe("parseSepay", () => {
  it("reads a transfer in, with SePay's id as the reference", () => {
    expect(parseSepay(sample)).toEqual({ kind: "in", ref: "sepay:92704", content: sample.content, amount: 250000 })
  })

  it("falls back to the description when the content is empty", () => {
    const tx = parseSepay({ ...sample, content: "", description: "NAP AB23CD" })
    expect(tx).toMatchObject({ kind: "in", content: "NAP AB23CD" })
  })

  it("ignores money going out and amounts that are not a positive whole number", () => {
    expect(parseSepay({ ...sample, transferType: "out" }).kind).toBe("ignore")
    expect(parseSepay({ ...sample, transferType: undefined }).kind).toBe("ignore")
    expect(parseSepay({ ...sample, transferAmount: 0 }).kind).toBe("ignore")
    expect(parseSepay({ ...sample, transferAmount: -5000 }).kind).toBe("ignore")
    expect(parseSepay({ ...sample, transferAmount: 1000.5 }).kind).toBe("ignore")
  })

  it("accepts an amount sent as a string", () => {
    expect(parseSepay({ ...sample, transferAmount: "500000" })).toMatchObject({ kind: "in", amount: 500000 })
  })

  it("rejects what is not a SePay transaction", () => {
    expect(parseSepay(null).kind).toBe("invalid")
    expect(parseSepay("hello").kind).toBe("invalid")
    expect(parseSepay({ ...sample, id: undefined }).kind).toBe("invalid")
  })
})
