import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Logo, PageHeader } from "@/components/ui"
import { safeNext } from "@/lib/auth/credentials"
import { currentAccount } from "@/lib/supabase/server"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập 360dep bằng số điện thoại hoặc email để đặt lịch hoặc nhận job.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; role?: string; tao?: string; loi?: string }>
}) {
  const params = await searchParams
  const next = params.next ? safeNext(params.next) : null
  const wantsPro = params.role === "pro"

  const account = await currentAccount()
  if (account) {
    redirect(next ?? (wantsPro ? (account.isPro ? "/studio" : "/studio/onboarding") : "/"))
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <PageHeader back />
      <Logo size="lg" />
      <h1 className="mt-4 text-2xl font-semibold">Đăng nhập</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Một tài khoản dùng được cả để đặt lịch và để nhận job. Đăng nhập bằng số điện thoại hoặc email.
      </p>
      <LoginForm
        next={next ?? (wantsPro ? "/studio/onboarding" : null)}
        initialMode={params.tao === "1" || wantsPro ? "signup" : params.loi ? "forgot" : "signin"}
        linkError={params.loi === "link"}
      />
    </div>
  )
}
