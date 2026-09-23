import { describe, expect, it } from "vitest"
import { isPhoneEmail, maskEmail, parseIdentifier, passwordProblem, phoneEmail } from "@/lib/auth/identifier"

describe("parseIdentifier", () => {
  it("reads a Vietnamese mobile number in any usual form", () => {
    expect(parseIdentifier("0912 345 678")).toEqual({ kind: "phone", phone: "+84912345678" })
    expect(parseIdentifier("+84912345678")).toEqual({ kind: "phone", phone: "+84912345678" })
  })
  it("reads an email, lower-cased", () => {
    expect(parseIdentifier(" An@Gmail.com ")).toEqual({ kind: "email", email: "an@gmail.com" })
  })
  it("refuses anything else", () => {
    expect(parseIdentifier("abc").kind).toBe("invalid")
    expect(parseIdentifier("a@b").kind).toBe("invalid")
    expect(parseIdentifier("12345").kind).toBe("invalid")
  })
})

describe("stand-in emails", () => {
  it("are built from the number and recognised", () => {
    expect(phoneEmail("+84912345678")).toBe("84912345678@sdt.360dep.vn")
    expect(isPhoneEmail("84912345678@sdt.360dep.vn")).toBe(true)
    expect(isPhoneEmail("an@gmail.com")).toBe(false)
  })
  it("masks a real address", () => {
    expect(maskEmail("anhnguyen@gmail.com")).toBe("a*****@gmail.com")
  })
})

describe("passwordProblem", () => {
  it("wants 8 characters, not only digits", () => {
    expect(passwordProblem("1234567")).not.toBeNull()
    expect(passwordProblem("12345678")).not.toBeNull()
    expect(passwordProblem("hoa12345")).toBeNull()
  })
})
