import { describe, expect, it } from "vitest"
import { isEmail, parseIdentifier, passwordProblem, safeNext } from "@/lib/auth/credentials"
import { formatPhone, toE164 } from "@/lib/auth/phone"

// Accounts are keyed by phone number: if two spellings of one number normalise
// differently, one person gets two accounts, or two people fight over one. The
// database has the same rules in normalize_vn_phone(); supabase/tests/rules.sql
// checks those.
describe("toE164", () => {
  it.each([
    ["0968112233", "+84968112233"],
    ["0968 112 233", "+84968112233"],
    ["0968.112.233", "+84968112233"],
    ["84968112233", "+84968112233"],
    ["+84968112233", "+84968112233"],
    ["+84 968 112 233", "+84968112233"],
    ["0084968112233", "+84968112233"],
    ["0387654321", "+84387654321"],
    ["0587654321", "+84587654321"],
    ["0787654321", "+84787654321"],
    ["0887654321", "+84887654321"],
  ])("normalises %s", (input, expected) => {
    expect(toE164(input)).toBe(expected)
  })

  it.each([["012345"], ["0168112233"], ["0268112233"], ["096811223"], ["09681122334"], [""], ["abc"]])(
    "refuses %s",
    (input) => {
      expect(toE164(input)).toBeNull()
    },
  )

  it("formats for a Vietnamese reader", () => {
    expect(formatPhone("+84968112233")).toBe("0968 112 233")
  })
})

describe("parseIdentifier", () => {
  it("reads a phone number in any spelling", () => {
    expect(parseIdentifier("0968 112 233")).toEqual({ kind: "phone", phone: "+84968112233" })
  })

  it("reads an email, trimmed and lowercased", () => {
    expect(parseIdentifier("  Thu.Anh@Example.com ")).toEqual({ kind: "email", email: "thu.anh@example.com" })
  })

  it("refuses something that is neither", () => {
    expect(parseIdentifier("thu@")).toBeNull()
    expect(parseIdentifier("12345")).toBeNull()
    expect(parseIdentifier("")).toBeNull()
  })

  it("knows an email", () => {
    expect(isEmail("a@b.vn")).toBe(true)
    expect(isEmail("a@b")).toBe(false)
    expect(isEmail("a b@c.vn")).toBe(false)
  })
})

describe("passwordProblem", () => {
  it("wants at least eight characters", () => {
    expect(passwordProblem("1234567")).toMatch(/ít nhất 8/)
    expect(passwordProblem("12345678")).toBeNull()
  })

  it("counts bytes, not characters, against the 72 bcrypt reads", () => {
    // "ệ" is three bytes in UTF-8: 25 of them is 75 bytes in 25 characters.
    expect(passwordProblem("ệ".repeat(25))).toMatch(/dài quá/)
    expect(passwordProblem("a".repeat(72))).toBeNull()
  })
})

describe("safeNext", () => {
  it("keeps a same-site path", () => {
    expect(safeNext("/studio/onboarding")).toBe("/studio/onboarding")
    expect(safeNext("/bookings?tab=1")).toBe("/bookings?tab=1")
  })

  it("refuses anything that leaves the site", () => {
    expect(safeNext("https://evil.example")).toBe("/")
    expect(safeNext("//evil.example")).toBe("/")
    expect(safeNext("/\\evil.example")).toBe("/")
    expect(safeNext(null, "/login")).toBe("/login")
  })
})
