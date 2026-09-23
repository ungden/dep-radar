import { toE164 } from "./format"
import { messageFor, rpc, supabase, type Result } from "./supabase"

/**
 * The small writes, made exactly as lib/api/actions.ts and lib/auth/actions.ts
 * make them: the same tables under the same row level security, or the same
 * RPC with the same arguments.
 */
const signedOut: Result<never> = { ok: false, error: "Cần đăng nhập." }

export async function toggleSavedWork(uid: string | null, workDbId: string, saved: boolean): Promise<Result<boolean>> {
  if (!uid) return signedOut
  if (saved) {
    const { error } = await supabase.from("saved_works").delete().eq("account_id", uid).eq("work_id", workDbId)
    return error ? { ok: false, error: messageFor(error) } : { ok: true, data: false }
  }
  const { error } = await supabase.from("saved_works").insert({ account_id: uid, work_id: workDbId })
  return error ? { ok: false, error: messageFor(error) } : { ok: true, data: true }
}

export async function toggleFollow(uid: string | null, proUuid: string, following: boolean): Promise<Result<boolean>> {
  if (!uid) return signedOut
  if (following) {
    const { error } = await supabase.from("follows").delete().eq("account_id", uid).eq("pro_id", proUuid)
    return error ? { ok: false, error: messageFor(error) } : { ok: true, data: false }
  }
  const { error } = await supabase.from("follows").insert({ account_id: uid, pro_id: proUuid })
  return error ? { ok: false, error: messageFor(error) } : { ok: true, data: true }
}

/** Once per account. The database normalises it and refuses a number already in use. */
export async function setMyPhone(raw: string): Promise<Result<string>> {
  const phone = toE164(raw)
  if (!phone) return { ok: false, error: "Số điện thoại không hợp lệ. Nhập số di động Việt Nam." }
  const { data, error } = await supabase.rpc("set_my_phone", { p_phone: phone })
  if (error) return { ok: false, error: /[ạ-ỹđ]/i.test(error.message) ? error.message : "Không lưu được số điện thoại. Vui lòng thử lại." }
  return { ok: true, data: String(data ?? phone) }
}

/** Customer or Studio. Same column the web's switchRole() writes. */
export async function switchRole(uid: string, role: "customer" | "pro") {
  await supabase.from("accounts").update({ active_role: role }).eq("id", uid)
}

export async function setAcceptingJobs(uid: string, value: boolean): Promise<Result> {
  const { error } = await supabase.from("pros").update({ accepting_jobs: value }).eq("id", uid)
  return error ? { ok: false, error: messageFor(error) } : { ok: true, data: undefined }
}

/**
 * Delete the account (Decree 13/2023, App Store 5.1.1(v)). The same
 * delete_my_account() the web calls (supabase/migrations/*account_deletion*):
 * no arguments; it refuses while a booking is still to happen, with a
 * sentence the screen shows as is.
 *
 * The web then removes the person's files with the service key. The app has
 * no such key; it removes what storage lets the owner remove (their own
 * folder in the public buckets), best effort, before the session ends.
 */
export async function deleteMyAccount(uid: string): Promise<Result> {
  const res = await rpc("delete_my_account", {})
  if (!res.ok) return res
  for (const bucket of ["avatars", "works", "reviews", "videos"]) {
    try {
      const { data } = await supabase.storage.from(bucket).list(uid, { limit: 100 })
      if (data?.length) await supabase.storage.from(bucket).remove(data.map((f) => `${uid}/${f.name}`))
    } catch {
      // The account is already gone; a leftover file is cleaned up by an admin.
    }
  }
  return res
}

export const sendOffer =(jobId: string, price: number, message: string) =>
  rpc<string>("send_offer", { p_job: jobId, p_price: price, p_message: message })

export async function withdrawMyOfferOn(uid: string, jobId: string): Promise<Result> {
  const { data } = await supabase.from("offers").select("id").eq("job_id", jobId).eq("pro_id", uid).maybeSingle()
  const id = (data as { id?: string } | null)?.id
  if (!id) return { ok: false, error: "Bạn chưa báo giá cho yêu cầu này." }
  return rpc("withdraw_offer", { p_offer: id })
}
