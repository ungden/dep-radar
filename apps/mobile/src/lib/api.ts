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

export async function requestSmsOtp(phone: string, fullName: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { data: { full_name: fullName }, channel: "sms" } })
  if (error) throw new ApiError("Không gửi được mã SMS. Vui lòng thử lại sau.", "OTP_UNAVAILABLE")
}

export async function verifySmsOtp(phone: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" })
  if (error) throw new ApiError("Mã xác thực không đúng hoặc đã hết hạn.", "OTP_INVALID")
}
