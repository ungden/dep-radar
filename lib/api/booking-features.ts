import { cache } from "react"
import { supabaseServer } from "@/lib/supabase/server"
import { backendEnabled } from "@/lib/supabase/env"

/** Request-scoped configuration; a failed/missing read never opens studio visits. */
export const readStudioBookingOpen = cache(async (): Promise<boolean> => {
  if (!backendEnabled) return false
  const supabase = await supabaseServer()
  const { data, error } = await supabase.from("platform_settings").select("studio_booking_open").eq("id", true).single()
  return !error && data?.studio_booking_open === true
})
