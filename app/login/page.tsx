import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Logo, PageHeader } from "@/components/ui"
import { otpEnabled } from "@/lib/auth/config"
import { currentAccount } from "@/lib/supabase/server"
import { PhoneLogin } from "./phone-login"

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập dep360 bằng số điện thoại để đặt lịch hoặc nhận job.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; role?: string }>
}) {
  const params = await searchParams
  const next = params.next?.startsWith("/") ? params.next : null
  const wantsPro = params.role === "pro"

  const account = await currentAccount()
  if (account) {
    redirect(next ?? (wantsPro ? (account.isPro ? "/studio" : "/studio/onboarding") : "/"))
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <PageHeader back />
      <Logo size="lg" />
      <h1 className="mt-4 text-2xl font-semibold">Đăng nhập</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Dùng số điện thoại của bạn. Một số điện thoại là một tài khoản, dùng được cả để đặt lịch và để nhận job.
      </p>
      <PhoneLogin next={next ?? (wantsPro ? "/studio/onboarding" : null)} otpEnabled={otpEnabled} />
    </div>
  )
}
