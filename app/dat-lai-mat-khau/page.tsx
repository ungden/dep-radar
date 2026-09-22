import type { Metadata } from "next"
import { cookies } from "next/headers"
import Link from "next/link"
import { Logo, PageHeader } from "@/components/ui"
import { RESET_COOKIE } from "@/lib/auth/credentials"
import { supabaseServer } from "@/lib/supabase/server"
import { backendEnabled } from "@/lib/supabase/env"
import { NewPasswordForm } from "./new-password-form"

// Reads the session and the reset cookie, so it can never be a cached page.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  robots: { index: false, follow: false },
}

/** Reached only through the link in a password-reset email (see app/auth/confirm). */
export default async function ResetPasswordPage() {
  let allowed = false
  if (backendEnabled) {
    const supabase = await supabaseServer()
    const { data } = await supabase.auth.getUser()
    const store = await cookies()
    allowed = Boolean(data.user && store.get(RESET_COOKIE)?.value === data.user.id)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <PageHeader back="/login" />
      <Logo size="lg" />
      <h1 className="mt-4 text-2xl font-semibold">Đặt mật khẩu mới</h1>
      {allowed ? (
        <NewPasswordForm />
      ) : (
        <div className="mt-4 space-y-3 text-sm text-ink-soft">
          <p>Link đặt lại mật khẩu đã hết hạn, đã được dùng, hoặc được mở ở trình duyệt khác với nơi bạn yêu cầu.</p>
          <Link href="/login?loi=link" className="font-medium text-rose underline underline-offset-2">
            Yêu cầu link mới
          </Link>
        </div>
      )}
    </div>
  )
}
