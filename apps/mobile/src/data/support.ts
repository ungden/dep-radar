import { supabase } from "./supabase"

/**
 * The support Zalo the owner set in Admin › Cấu hình (platform_settings is
 * public). A phone-number account resets its password through it. Null until
 * it is set, and the app then points to the help page instead.
 */
export async function loadSupportZalo(): Promise<string | null> {
  const { data, error } = await supabase.from("platform_settings").select("support_zalo").limit(1).maybeSingle()
  const zalo = (data as { support_zalo?: string | null } | null)?.support_zalo?.replace(/\D/g, "")
  return error || !zalo ? null : zalo
}
