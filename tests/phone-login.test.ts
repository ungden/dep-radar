import { beforeEach, describe, expect, it, vi } from "vitest"
import { signInWithIdentifier, signUpWithIdentifier } from "@/lib/auth/password"

const { lookup, authUser, signIn, signUp } = vi.hoisted(() => ({
  lookup: vi.fn(), authUser: vi.fn(), signIn: vi.fn(), signUp: vi.fn(),
}))
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: lookup }) }) }),
    auth: { admin: { getUserById: authUser } },
  }),
}))
const client = { auth: { signInWithPassword: signIn, signUp } } as unknown as Parameters<typeof signInWithIdentifier>[0]
const session = { access_token: "test-only" }

beforeEach(() => {
  vi.clearAllMocks()
  lookup.mockReset().mockResolvedValue({ data: { id: "current-owner" }, error: null })
  authUser.mockReset().mockResolvedValue({ data: { user: { email: "stable-internal@sdt.360dep.vn" } }, error: null })
  signIn.mockReset().mockResolvedValue({ data: { session, user: { id: "current-owner" } }, error: null })
  signUp.mockReset().mockResolvedValue({ data: { session, user: { id: "new-owner", identities: [{}] } }, error: null })
})

describe("phone login after number changes", () => {
  it("uses the current owner's internal email for the new number", async () => {
    expect(await signInWithIdentifier(client, "0900000322", "test-password")).toMatchObject({ ok: true, userId: "current-owner" })
    expect(signIn).toHaveBeenCalledWith({ email: "stable-internal@sdt.360dep.vn", password: "test-password" })
  })

  it("does not attempt login with a released phone", async () => {
    lookup.mockResolvedValue({ data: null, error: null })
    expect(await signInWithIdentifier(client, "0900000321", "test-password")).toMatchObject({ ok: false, status: 401 })
    expect(signIn).not.toHaveBeenCalled()
  })

  it("does not use the former phone owner's stand-in email when lookup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    lookup.mockResolvedValue({ data: null, error: { message: "test database offline" } })
    expect(await signInWithIdentifier(client, "0900000321", "test-password")).toMatchObject({ ok: false, status: 503 })
    expect(signIn).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it("refuses entering a legacy internal email as a public login identifier", async () => {
    expect(await signInWithIdentifier(client, "84900000321@sdt.360dep.vn", "test-password")).toMatchObject({ ok: false, status: 401 })
    expect(signIn).not.toHaveBeenCalled()
  })

  it("can register a released number with a fresh internal address", async () => {
    lookup.mockResolvedValue({ data: null, error: null })
    const input = { identifier: "0900000321", password: "test-password", fullName: "Test User" }
    expect(await signUpWithIdentifier(client, input)).toMatchObject({ ok: true })
    expect(await signUpWithIdentifier(client, input)).toMatchObject({ ok: true })
    const first = signUp.mock.calls[0][0]
    const second = signUp.mock.calls[1][0]
    expect(first.email).toMatch(/^[0-9a-f-]{36}@sdt\.360dep\.vn$/)
    expect(first.email).not.toBe(second.email)
    expect(first.options.data.phone).toBe("+84900000321")
  })
})
