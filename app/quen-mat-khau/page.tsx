import type { Metadata } from "next"
import { Logo, PageHeader } from "@/components/ui"
import { ForgotForm } from "./forgot-form"

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col pb-10">
      <PageHeader back="/login" />
      <Logo size="lg" />
      <h1 className="mt-4 text-[28px] font-bold tracking-tight">Quên mật khẩu</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Nhập số điện thoại hoặc email của tài khoản. 360dep gửi link đặt lại mật khẩu tới email của tài khoản đó.
      </p>
      <ForgotForm />
    </div>
  )
}
