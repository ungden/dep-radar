import * as Crypto from "expo-crypto"
import * as SecureStore from "expo-secure-store"
import { VIDEO_MAX_BYTES, VIDEO_MAX_MB, VIDEO_MAX_SECONDS, stripVideoLocation } from "@/shared"
import { rpc, rpcOptional, supabase, type OptionalResult, type Result, type Row } from "./supabase"
import { reencodePhoto } from "./works"

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
  input: { reason: string; detail: string; targetAccountId?: string | null; bookingId?: string | null; workId?: string | null; evidencePaths?: string[] },
): Promise<Result> {
  if (!uid) return { ok: false, error: "Cần đăng nhập." }
  if (input.reason.trim().length < 3) return { ok: false, error: "Chọn lý do báo cáo." }
  const row: Record<string, unknown> = {
    reporter_id: uid,
    target_account_id: input.targetAccountId ?? null,
    booking_id: input.bookingId ?? null,
    reason: input.reason.trim(),
    detail: input.detail.trim().slice(0, 2000),
  }
  if (input.workId) row.work_id = input.workId
  if (input.evidencePaths?.length) row.evidence_paths = input.evidencePaths.slice(0, EVIDENCE_MAX)
  const { error } = await supabase.from("reports").insert(row)
  if (error) return { ok: false, error: "Không gửi được báo cáo. Thử lại nhé." }
  return { ok: true, data: undefined }
}

// Evidence ----------------------------------------------------------------------

/** Files per report, the same as reports_evidence_check (20261008100300). */
export const EVIDENCE_MAX = 8

/** What the picker hands over: a photo or a clip on the phone. */
export interface PickedMedia {
  uri: string
  width: number
  height: number
  video: boolean
  /** Milliseconds, for clips. */
  duration?: number | null
}

/**
 * Uploads one piece of evidence to the private `evidence` bucket and returns
 * its path. Photos are re-encoded (smaller, no EXIF or GPS), clips checked for
 * length and size with the place they were filmed removed, as for works.
 */
export async function uploadEvidence(uid: string, media: PickedMedia): Promise<string> {
  if (!media.video) {
    const jpeg = await reencodePhoto(media.uri, media.width, media.height)
    const body = await (await fetch(jpeg)).arrayBuffer()
    const path = `${uid}/${Crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from("evidence").upload(path, body, { contentType: "image/jpeg", upsert: false })
    if (error) throw new Error("Tải ảnh lên không thành công, thử lại nhé.")
    return path
  }
  if (media.duration && media.duration / 1000 > VIDEO_MAX_SECONDS + 0.5) throw new Error(`Clip dài tối đa ${VIDEO_MAX_SECONDS} giây.`)
  const raw = await (await fetch(media.uri)).arrayBuffer()
  if (raw.byteLength > VIDEO_MAX_BYTES) throw new Error(`Clip quá ${VIDEO_MAX_MB} MB. Cắt ngắn hoặc quay ở 1080p nhé.`)
  const { buffer } = stripVideoLocation(raw)
  const mov = media.uri.toLowerCase().endsWith(".mov")
  const path = `${uid}/${Crypto.randomUUID()}.${mov ? "mov" : "mp4"}`
  const { error } = await supabase.storage.from("evidence").upload(path, buffer, { contentType: mov ? "video/quicktime" : "video/mp4", upsert: false })
  if (error) throw new Error("Tải clip lên không thành công. Kiểm tra mạng rồi thử lại nhé.")
  return path
}

export async function removeEvidence(paths: string[]) {
  if (paths.length) await supabase.storage.from("evidence").remove(paths)
}

export interface MyReport {
  id: string
  reason: string
  detail: string
  status: "open" | "reviewing" | "resolved" | "rejected"
  resolution: string | null
  staffQuestion: string | null
  bookingId: string | null
  createdAt: string
  evidence: { path: string; url: string; video: boolean }[]
}

/** The caller's reports with their evidence signed for an hour; no-show disputes have their own place. */
export async function loadMyReports(uid: string): Promise<MyReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, reason, detail, status, resolution, staff_question, booking_id, created_at, evidence_paths")
    .eq("reporter_id", uid)
    .not("reason", "in", "(pro_no_show,no_show_dispute)")
    .order("created_at", { ascending: false })
    .limit(50)
  if (error || !data) return []
  const rows = data as Row[]
  const paths = rows.flatMap((r) => (r.evidence_paths as string[] | null) ?? [])
  const signed = paths.length ? await supabase.storage.from("evidence").createSignedUrls(paths, 60 * 60) : null
  const url = new Map((signed?.data ?? []).flatMap((x) => (x.path && x.signedUrl ? [[x.path, x.signedUrl] as const] : [])))
  return rows.map((r) => ({
    id: String(r.id),
    reason: String(r.reason),
    detail: String(r.detail ?? ""),
    status: r.status as MyReport["status"],
    resolution: (r.resolution as string | null) ?? null,
    staffQuestion: (r.staff_question as string | null) ?? null,
    bookingId: (r.booking_id as string | null) ?? null,
    createdAt: String(r.created_at),
    evidence: ((r.evidence_paths as string[] | null) ?? []).map((p) => ({ path: p, url: url.get(p) ?? "", video: /\.(mp4|mov|webm)$/i.test(p) })),
  }))
}

export const addReportEvidence = (reportId: string, paths: string[], note: string) =>
  rpc("add_report_evidence", { p_report: reportId, p_paths: paths, p_note: note.trim().slice(0, 1000) })

/** Reasons offered on the reports screen, where a report may be about the app itself. */
export const GENERAL_REPORT_REASONS = [
  "Sự cố trong buổi làm",
  "Chất lượng không như cam kết",
  "Hành vi không phù hợp",
  "Không đến / không liên lạc được",
  "Giá khác với lịch hẹn",
  "Lỗi ứng dụng",
  "Thanh toán, ví, phí",
  "Tài khoản, đăng nhập",
  "Góp ý khác",
] as const

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
