import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Logo, PageHeader } from "@/components/ui"
import { safeNext } from "@/lib/auth/credentials"
import { currentAccount, supabaseServer } from "@/lib/supabase/server"
import { PhoneForm } from "./phone-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Số điện thoại",
  robots: { index: false, follow: false },
}

/**
 * The one step after a first sign-in with Google, Apple or an email: none of
 * them gives a phone number. (A phone sign-up already has one.)
 */
export default async function PhonePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams
  const next = safeNext(rawNext)
  const account = await currentAccount()
  if (!account) redirect(`/login?next=${encodeURIComponent(`/me/so-dien-thoai?next=${next}`)}`)
  if (account.phone) redirect(next)
  const { data } = await (await supabaseServer()).auth.getUser()
  const hasPassword = Boolean(data.user?.identities?.some((i) => i.provider === "email"))

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <PageHeader back="/" />
      <Logo size="lg" />
      <h1 className="mt-4 text-[28px] font-bold tracking-tight">Thêm số điện thoại</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {account.full_name ? `Chào ${account.full_name}. ` : ""}Người làm chỉ thấy số này khi đã nhận lịch của bạn và lịch
        chưa kết thúc, để hai bên liên hệ khi cần.{" "}
        {hasPassword ? "Bạn cũng đăng nhập được bằng số này và mật khẩu. " : ""}Mỗi số điện thoại chỉ gắn với một tài khoản.
      </p>
      <PhoneForm next={next} />
    </div>
  )
}
