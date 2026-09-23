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
  "Giá khác với báo giá",
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

// TODO(db): the argument name of block_user / unblock_user is not merged yet.
// Try the likely names in turn; PostgREST answers "no such function" for a
// wrong one, which costs nothing. Keep the first entry in sync with the migration.
const ARG_NAMES = ["p_target", "p_account", "p_user", "p_blocked"]

async function callWithTarget(fn: string, target: string): Promise<OptionalResult> {
  let last: OptionalResult = { ok: false, missing: true, error: "Tính năng này sắp có." }
  for (const name of ARG_NAMES) {
    last = await rpcOptional(fn, { [name]: target })
    if (last.ok || !last.missing) return last
  }
  return last
}

export const blockUser = (target: string) => callWithTarget("block_user", target)
export const unblockUser = (target: string) => callWithTarget("unblock_user", target)

/** Who the caller has blocked, as far as the server knows. Empty until user_blocks exists. */
export async function loadServerBlocks(uid: string): Promise<string[]> {
  const { data, error } = await supabase.from("user_blocks").select("*").limit(500)
  if (error || !data) return []
  const ids = new Set<string>()
  for (const row of data as Row[]) {
    const mine = Object.values(row).includes(uid)
    if (!mine) continue
    for (const key of ["blocked_id", "target_id", "blocked_account_id", "blocked"]) {
      if (typeof row[key] === "string" && row[key] !== uid) ids.add(row[key])
    }
  }
  return [...ids]
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
