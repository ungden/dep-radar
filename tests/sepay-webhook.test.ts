import { afterEach, describe, expect, it, vi } from "vitest"

const rpc = vi.hoisted(() => vi.fn())
vi.mock("@/lib/supabase/server", () => ({ supabaseAdmin: () => ({ rpc }) }))
import { POST } from "@/app/api/payments/sepay/route"

const webhook = (id: number, accountNumber = "123456789") => new Request("http://localhost/api/payments/sepay", {
  method: "POST", headers: { authorization: "Apikey test-only", "content-type": "application/json" },
  body: JSON.stringify({ id, accountNumber, transferType: "in", transferAmount: 150_000, content: "Unknown memo" }),
})
afterEach(() => { vi.unstubAllEnvs(); rpc.mockReset() })

describe("SePay webhook acknowledgement", () => {
  it("returns a retryable response when the database cannot record the transfer", async () => {
    vi.stubEnv("SEPAY_WEBHOOK_KEY", "test-only")
    rpc.mockResolvedValue({ error: { code: "08006" }, data: null })
    const response = await POST(webhook(100))
    expect(response.status).toBe(500)
    expect(rpc).toHaveBeenCalledWith("record_marketplace_transfer", expect.objectContaining({ p_ref: "sepay:100", p_account: "123456789" }))
  })
  it("ignores SePay's test delivery without touching the ledger", async () => {
    vi.stubEnv("SEPAY_WEBHOOK_KEY", "test-only")
    expect((await POST(webhook(0))).status).toBe(200)
    expect(rpc).not.toHaveBeenCalled()
  })
})
