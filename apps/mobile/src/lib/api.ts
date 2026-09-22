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

// Password sign-in, same as the web. The phone number goes to Auth as metadata
// and the database normalises it (normalize_vn_phone in handle_new_user), so this
// app does not keep its own copy of the rules. Signing in by phone number needs
// the server-side lookup the web app has, so here it is email only for now.
export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) throw new ApiError("Sai email hoặc mật khẩu.", "INVALID_CREDENTIALS")
}

export async function signUpWithEmail(input: { fullName: string; phone: string; email: string; password: string }) {
  if (input.password.length < 8) throw new ApiError("Mật khẩu cần ít nhất 8 ký tự.", "WEAK_PASSWORD")
  const { error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { data: { full_name: input.fullName.trim(), phone: input.phone } },
  })
  if (error) {
    throw new ApiError(
      error.code === "user_already_exists" || error.code === "email_exists"
        ? "Email này đã có tài khoản."
        : "Không tạo được tài khoản. Kiểm tra số điện thoại (mỗi số một tài khoản) rồi thử lại.",
      "SIGN_UP_FAILED",
    )
  }
}
