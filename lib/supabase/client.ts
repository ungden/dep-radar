"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"
import { requireBackend } from "./env"

let cached: ReturnType<typeof create> | null = null

function create() {
  const { url, anonKey } = requireBackend()
  return createBrowserClient<Database>(url, anonKey)
}

/** One browser client per tab: it owns the session and its refresh timer. */
export function supabaseBrowser() {
  cached ??= create()
  return cached
}
