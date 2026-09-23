import { backendEnabled } from "@/lib/supabase/env"
import { MAX_BODY_BYTES, MESSAGES, parseSmallJson } from "./password-rules"
import { clientIp } from "./throttle"

/**
 * The shared front door of /api/auth/*, the JSON routes the app signs in
 * through (it has no server of its own): a small JSON body and one throttle
 * check. Each route shapes the refusal its own way.
 */
export async function readAuthRequest(
  request: Request,
  throttle: { take(key: string): boolean },
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; status: number; error: string }> {
  if (!backendEnabled) return { ok: false, status: 503, error: "Máy chủ chưa được cấu hình." }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return { ok: false, status: 413, error: "Yêu cầu quá lớn." }
  if (!throttle.take(clientIp(request.headers))) return { ok: false, status: 429, error: MESSAGES.tooMany }
  const parsed = parseSmallJson(await request.text())
  if (!parsed.ok) return { ok: false, status: parsed.status, error: parsed.status === 413 ? "Yêu cầu quá lớn." : "Yêu cầu không hợp lệ." }
  return { ok: true, body: parsed.body }
}
