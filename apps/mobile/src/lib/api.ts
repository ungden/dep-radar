import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"
import { supabase } from "@/lib/supabase"

export class ApiError extends Error {
  constructor(message: string, readonly code = "UNKNOWN") { super(message) }
}

export async function listPros() {
  const { data, error } = await supabase
    .from("pros")
    .select("id, slug, display_name, title, city, district, avatar_path, rating_avg, rating_count, identity_status")
    .eq("published", true)
    .order("rating_avg", { ascending: false })
    .limit(30)
  if (error) throw new ApiError("Không tải được chuyên viên. Kiểm tra kết nối rồi thử lại.", "NETWORK_OR_QUERY")
  return data
}

// Google sign-in, same as the web. The browser session comes back through the
// dep360:// scheme, which has to be listed under Redirect URLs in Supabase Auth.
export async function signInWithGoogle() {
  const redirectTo = Linking.createURL("auth/callback")
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
  })
  if (error || !data.url) throw new ApiError("Đăng nhập Google chưa khả dụng. Vui lòng thử lại sau.", "OAUTH_UNAVAILABLE")
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== "success") throw new ApiError("Đã huỷ đăng nhập Google.", "CANCELLED")
  const code = new URL(result.url).searchParams.get("code")
  if (!code) throw new ApiError("Chưa đăng nhập được bằng Google. Thử lại nhé.", "NO_CODE")
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) throw new ApiError("Chưa đăng nhập được bằng Google. Thử lại nhé.", "EXCHANGE_FAILED")
}

/** Empty string when the account has no phone number yet (every new Google account). */
export async function myPhone(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return ""
  const { data } = await supabase.from("accounts").select("phone").eq("id", auth.user.id).maybeSingle()
  return data?.phone ?? ""
}

/** Once per account; the database normalises the number and refuses one already in use. */
export async function setMyPhone(phone: string) {
  const { error } = await supabase.rpc("set_my_phone", { p_phone: phone })
  if (error) {
    throw new ApiError(/[ạ-ỹđ]/i.test(error.message) ? error.message : "Không lưu được số điện thoại.", "PHONE_REFUSED")
  }
}
