import "react-native-url-polyfill/auto"
import { AppState } from "react-native"
import * as SecureStore from "expo-secure-store"
import { createClient } from "@supabase/supabase-js"

/**
 * The app talks to Supabase with the publishable (anon) key only. Every write
 * goes through the same RPCs and row level security as the web; there is no
 * service-role key anywhere in this bundle, and there must never be one.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""

/** False when .env is missing: the app says so instead of crashing. */
export const backendConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY)

/**
 * The session lives in the Keychain / Keystore. SecureStore refuses values
 * over 2 KB and a Supabase session is bigger, so it is stored in chunks.
 */
const CHUNK = 1800
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, "_")

const storage = {
  async getItem(key: string) {
    const k = safeKey(key)
    const count = Number(await SecureStore.getItemAsync(`${k}.n`))
    if (!count) return SecureStore.getItemAsync(k)
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${k}.${i}`)))
    return parts.some((p) => p === null) ? null : parts.join("")
  },
  async setItem(key: string, value: string) {
    const k = safeKey(key)
    await storage.removeItem(key)
    const parts = value.match(new RegExp(`[\\s\\S]{1,${CHUNK}}`, "g")) ?? [""]
    await Promise.all(parts.map((part, i) => SecureStore.setItemAsync(`${k}.${i}`, part)))
    await SecureStore.setItemAsync(`${k}.n`, String(parts.length))
  },
  async removeItem(key: string) {
    const k = safeKey(key)
    const count = Number(await SecureStore.getItemAsync(`${k}.n`))
    await Promise.all(Array.from({ length: count || 0 }, (_, i) => SecureStore.deleteItemAsync(`${k}.${i}`)))
    await SecureStore.deleteItemAsync(`${k}.n`)
    await SecureStore.deleteItemAsync(k)
  },
}

export const supabase = createClient(SUPABASE_URL || "https://invalid.localhost", SUPABASE_KEY || "missing", {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE: Google hands back a one-time code through dep360://auth/callback.
    flowType: "pkce",
  },
})

// Refresh the token only while the app is on screen.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh()
  else supabase.auth.stopAutoRefresh()
})

export type Row = Record<string, any>

/** One row from a join, which PostgREST returns as an object or a one-item array. */
export const one = (v: unknown): Row => (Array.isArray(v) ? ((v[0] ?? {}) as Row) : ((v ?? {}) as Row))

/**
 * Tries the richest select first and falls back when a column is not there
 * yet. Columns like works.kind or bookings.delivery_* are being added in
 * parallel with this app; a missing one must not blank a screen.
 */
export async function selectWithFallback<T = Row>(
  label: string,
  run: (columns: string) => PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>,
  columns: string[],
): Promise<T[]> {
  let lastError: string | null = null
  for (const cols of columns) {
    const { data, error } = await run(cols)
    if (!error) return (data ?? []) as T[]
    lastError = error.message
    // Only a missing column is worth retrying with fewer columns.
    if (!/column|does not exist|schema cache/i.test(error.message)) break
  }
  console.warn(`${label} failed:`, lastError)
  throw new Error("Không tải được dữ liệu. Kiểm tra kết nối rồi thử lại.")
}

/** Postgres messages our RPCs raise are written in Vietnamese for people; anything else is not. */
export function messageFor(error: { message?: string } | null | undefined, fallback = "Có lỗi xảy ra, vui lòng thử lại.") {
  const raw = error?.message?.trim()
  if (!raw) return fallback
  if (/^(duplicate key|permission denied|JWT|new row violates|invalid input)/i.test(raw)) return fallback
  return /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩậắằẵặẹẻẽếềểệỉịọỏốồổộớờởợụủứừửữựỳỵỷỹ]/i.test(raw) ? raw : fallback
}

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string }

export async function rpc<T = void>(fn: string, args: Record<string, unknown>): Promise<Result<T>> {
  if (!backendConfigured) return { ok: false, error: "App chưa được cấu hình máy chủ." }
  const { data, error } = await supabase.rpc(fn, args)
  if (error) return { ok: false, error: messageFor(error) }
  return { ok: true, data: data as T }
}

/**
 * An RPC that is being added to the database in parallel with this app
 * (block_user, register_push_token, ...). "Missing" means PostgREST has no
 * function by that name and those arguments yet: the caller hides the feature
 * or says so kindly instead of showing a raw error.
 */
export type OptionalResult<T = void> = { ok: true; data: T } | { ok: false; missing: boolean; error: string }

export function isMissingFunction(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  return error.code === "PGRST202" || error.code === "42883" || /could not find the function|function .* does not exist/i.test(error.message ?? "")
}

export async function rpcOptional<T = void>(fn: string, args: Record<string, unknown>): Promise<OptionalResult<T>> {
  if (!backendConfigured) return { ok: false, missing: false, error: "App chưa được cấu hình máy chủ." }
  const { data, error } = await supabase.rpc(fn, args)
  if (isMissingFunction(error)) return { ok: false, missing: true, error: "Tính năng này sắp có. Bạn thử lại sau nhé." }
  if (error) return { ok: false, missing: false, error: messageFor(error) }
  return { ok: true, data: data as T }
}
