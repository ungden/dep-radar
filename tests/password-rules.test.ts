import { describe, expect, it } from "vitest"
import {
  MAX_BODY_BYTES,
  MESSAGES,
  authErrorKind,
  checkSignUp,
  newPasswordProblem,
  parseSmallJson,
  stringField,
} from "@/lib/auth/password-rules"
import { clientIp, createThrottle } from "@/lib/auth/throttle"

describe("checkSignUp", () => {
  const good = { fullName: "  Nguyễn   Thị An ", identifier: "0912 345 678", password: "matkhau123" }

  it("accepts a phone number, tidying the name", () => {
    const r = checkSignUp(good)
    expect(r).toEqual({ ok: true, id: { kind: "phone", phone: "+84912345678" }, password: "matkhau123", fullName: "Nguyễn Thị An" })
  })
  it("accepts an email, lower-cased", () => {
    const r = checkSignUp({ ...good, identifier: "An@Gmail.com" })
    expect(r.ok && r.id).toEqual({ kind: "email", email: "an@gmail.com" })
  })
  it("names the field that is wrong", () => {
    expect(checkSignUp({ ...good, fullName: "A" })).toMatchObject({ ok: false, field: "fullName" })
    expect(checkSignUp({ ...good, fullName: "x".repeat(81) })).toMatchObject({ ok: false, field: "fullName" })
    expect(checkSignUp({ ...good, identifier: "12345" })).toMatchObject({ ok: false, field: "identifier", error: MESSAGES.invalidIdentifier })
    expect(checkSignUp({ ...good, password: "1234567" })).toMatchObject({ ok: false, field: "password" })
    expect(checkSignUp({ ...good, password: "12345678" })).toMatchObject({ ok: false, field: "password" })
  })
  it("refuses signing up as a stand-in address", () => {
    expect(checkSignUp({ ...good, identifier: "84912345678@sdt.360dep.vn" })).toMatchObject({ ok: false, field: "identifier" })
  })
})

describe("newPasswordProblem", () => {
  it("caps the length at what bcrypt reads", () => {
    expect(newPasswordProblem("a".repeat(72) + "1")).toMatch(/tối đa 72/)
    expect(newPasswordProblem("a1".repeat(36))).toBeNull()
  })
})

describe("authErrorKind", () => {
  it.each([
    [{ code: "invalid_credentials", status: 400 }, "invalid_credentials"],
    [{ message: "Invalid login credentials", status: 400 }, "invalid_credentials"],
    [{ code: "over_request_rate_limit", status: 429 }, "rate_limited"],
    [{ code: "over_email_send_rate_limit", status: 429 }, "rate_limited"],
    [{ code: "user_already_exists", status: 422 }, "user_exists"],
    [{ code: "email_exists", status: 422 }, "user_exists"],
    [{ message: "User already registered", status: 400 }, "user_exists"],
    [{ code: "unexpected_failure", message: "Database error saving new user", status: 500 }, "db_error"],
    [{ message: "Database error saving new user", status: 500 }, "db_error"],
    [{ code: "same_password", status: 422 }, "same_password"],
    [{ code: "weak_password", status: 422 }, "weak_password"],
    [{ code: "email_address_invalid", status: 400 }, "email_invalid"],
    [{ code: "reauthentication_needed", status: 400 }, "reauth"],
    [{ code: "something_new", status: 500 }, "other"],
  ])("%j → %s", (error, kind) => {
    expect(authErrorKind(error)).toBe(kind)
  })
  it("treats no error as other", () => {
    expect(authErrorKind(null)).toBe("other")
  })
})

describe("parseSmallJson", () => {
  it("reads an object", () => {
    const r = parseSmallJson('{"identifier":"0912345678","password":"x"}')
    expect(r.ok && stringField(r.body, "identifier")).toBe("0912345678")
    expect(r.ok && stringField(r.body, "missing")).toBe("")
  })
  it("refuses anything that is not a JSON object", () => {
    expect(parseSmallJson("not json")).toEqual({ ok: false, status: 400 })
    expect(parseSmallJson("[1,2]")).toEqual({ ok: false, status: 400 })
    expect(parseSmallJson("null")).toEqual({ ok: false, status: 400 })
  })
  it("refuses a body over the limit, counted in bytes", () => {
    // "ệ" is 3 bytes in UTF-8: fewer characters than the limit, more bytes.
    const text = JSON.stringify({ fullName: "ệ".repeat(Math.ceil(MAX_BODY_BYTES / 3)) })
    expect(text.length).toBeLessThan(MAX_BODY_BYTES)
    expect(parseSmallJson(text)).toEqual({ ok: false, status: 413 })
  })
  it("gives a non-string field as empty", () => {
    const r = parseSmallJson('{"password":123}')
    expect(r.ok && stringField(r.body, "password")).toBe("")
  })
})

describe("createThrottle", () => {
  it("allows the limit per window, per key, then resets", () => {
    let t = 0
    const throttle = createThrottle({ limit: 2, windowMs: 1000, now: () => t })
    expect(throttle.take("a")).toBe(true)
    expect(throttle.take("a")).toBe(true)
    expect(throttle.take("a")).toBe(false)
    expect(throttle.take("b")).toBe(true)
    t = 1000
    expect(throttle.take("a")).toBe(true)
  })
})

describe("clientIp", () => {
  it("takes the first forwarded address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4")
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8")
    expect(clientIp(new Headers())).toBe("unknown")
  })
})
