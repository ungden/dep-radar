import type { Metadata } from "next"
import { Logo, PageHeader } from "@/components/ui"
import { ResetForm } from "./reset-form"

export const metadata: Metadata = {
  title: "Đặt mật khẩu mới",
  robots: { index: false, follow: false },
}

/** Where the "Quên mật khẩu" email lands (lib/auth/password.ts, requestPasswordReset). */
export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col pb-10">
      <PageHeader back="/login" />
      <Logo size="lg" />
      <h1 className="mt-4 text-[28px] font-bold tracking-tight">Đặt mật khẩu mới</h1>
      <ResetForm />
    </div>
  )
}
