import * as SecureStore from "expo-secure-store"
import { rpcOptional, supabase, type OptionalResult, type Result, type Row } from "./supabase"

/**
 * Report and block, which the App Store requires of any app where people
 * meet strangers (Guideline 1.2).
 *
 * Reports go into the same `reports` table, the same way, as fileReport() in
 * lib/api/me.ts; the admin queue reads them there.
 *
 * Blocking calls block_user / unblock_user, which are being added to the
 * database in parallel (TODO(db): user_blocks). Whatever the server says, the
 * person is hidden on this phone at once: their threads, profile and posts.
 */
export const REPORT_REASONS = [
  "Hành vi không phù hợp",
  "Nội dung phản cảm hoặc lừa đảo",
  "Chất lượng không như cam kết",
  "Không đến / không liên lạc được",
  "Giá khác với lịch hẹn",
  "Ảnh tác phẩm không phải của họ",
  "Khác",
] as const

export async function fileReport(
  uid: string | null,
  input: { reason: string; detail: string; targetAccountId?: string | null; bookingId?: string | null; workId?: string | null },
): Promise<Result> {
  if (!uid) return { ok: false, error: "Cần đăng nhập." }
  if (input.reason.trim().length < 3) return { ok: false, error: "Chọn lý do báo cáo." }
  const row: Record<string, unknown> = {
    reporter_id: uid,
    target_account_id: input.targetAccountId ?? null,
    booking_id: input.bookingId ?? null,
    reason: input.reason.trim(),
    detail: input.detail.trim().slice(0, 1000),
  }
  if (input.workId) row.work_id = input.workId
  const { error } = await supabase.from("reports").insert(row)
  if (error) return { ok: false, error: "Không gửi được báo cáo. Thử lại nhé." }
  return { ok: true, data: undefined }
}

/** block_user(p_account uuid) / unblock_user(p_account uuid), see 20260924100900_user_blocks.sql. */
function callWithTarget(fn: string, target: string): Promise<OptionalResult> {
  return rpcOptional(fn, { p_account: target })
}

export const blockUser = (target: string) => callWithTarget("block_user", target)
export const unblockUser = (target: string) => callWithTarget("unblock_user", target)

/** Who the caller has blocked (user_blocks: blocker, blocked; readable by the blocker). */
export async function loadServerBlocks(uid: string): Promise<string[]> {
  const { data, error } = await supabase.from("user_blocks").select("blocked").eq("blocker", uid).limit(500)
  if (error || !data) return []
  return (data as { blocked: string }[]).map((r) => r.blocked)
}

const key = (uid: string) => `dep360_blocked_${uid}`

export async function readLocalBlocks(uid: string): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(key(uid))
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}

export async function writeLocalBlocks(uid: string, ids: string[]) {
  // SecureStore holds 2 KB a value: the most recent ~50 blocks is plenty on one phone.
  await SecureStore.setItemAsync(key(uid), JSON.stringify(ids.slice(-50))).catch(() => {})
}
