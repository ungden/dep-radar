import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Logo, PageHeader } from "@/components/ui"
import { safeNext } from "@/lib/auth/credentials"
import { isPhoneEmail } from "@/lib/auth/identifier"
import { supabaseServer } from "@/lib/supabase/server"
import { EmailForm } from "./email-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Thêm email",
  robots: { index: false, follow: false },
}

/**
 * Right after signing up with a phone number, and from /me until done: an
 * account with only a number has no way to recover a forgotten password.
 */
export default async function AddEmailPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next, "/")
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect(`/login?next=${encodeURIComponent(`/me/email?next=${next}`)}`)
  // Already has a real email: nothing to add here (changing it is not offered).
  if (!isPhoneEmail(data.user.email)) redirect(next)

  return (
    <div className="mx-auto flex max-w-md flex-col pb-10">
      <PageHeader back={next} />
      <Logo size="lg" />
      <h1 className="mt-4 text-[28px] font-bold tracking-tight">Thêm email để lấy lại mật khẩu khi quên</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Tài khoản của bạn đang chỉ có số điện thoại. Có email, khi quên mật khẩu 360dep gửi link đặt lại tới đó. 360dep không gửi
        quảng cáo vào email này.
      </p>
      <EmailForm next={next} pending={data.user.new_email ?? null} />
    </div>
  )
}
