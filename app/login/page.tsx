import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Logo, PageHeader } from "@/components/ui"
import { otpEnabled } from "@/lib/auth/config"
import { backendEnabled } from "@/lib/supabase/env"
import { currentAccount } from "@/lib/supabase/server"
import { DemoLogin } from "./demo-login"
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

  // Without a backend the app is the in-browser demo, which has its own sign-in.
  if (!backendEnabled) {
    return <DemoLogin next={next} role={params.role === "pro" ? "pro" : "customer"} />
  }

  const account = await currentAccount()
  if (account) redirect(next ?? (account.isPro && account.active_role === "pro" ? "/studio" : "/"))

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <PageHeader back />
      <Logo size="lg" />
      <h1 className="mt-4 text-2xl font-semibold">Đăng nhập</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Dùng số điện thoại của bạn. Một số điện thoại là một tài khoản, dùng được cả để đặt lịch và để nhận job.
      </p>
      <PhoneLogin next={next} otpEnabled={otpEnabled} />
    </div>
  )
}
