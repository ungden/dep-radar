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
  const { data } = await (await supabaseServer()).auth.getUser()
  const hasPassword = Boolean(data.user?.identities?.some((i) => i.provider === "email"))

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <PageHeader back={account.phone ? "/me/cai-dat" : "/"} />
      <Logo size="lg" />
      <h1 className="mt-4 text-[28px] font-bold tracking-tight">{account.phone ? "Đổi số điện thoại" : "Thêm số điện thoại"}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {account.full_name ? `Chào ${account.full_name}. ` : ""}
        {account.phone ? "" : "Đặt lịch, đăng yêu cầu và mở hồ sơ đối tác cần số điện thoại để khách và người làm liên lạc với nhau sau khi ghép lịch. "}
        Bên kia chỉ thấy số này khi lịch đã được nhận và chưa kết thúc.{" "}
        {hasPassword ? "Bạn cũng đăng nhập được bằng số này và mật khẩu. " : ""}Mỗi số điện thoại chỉ gắn với một tài khoản.
      </p>
      <PhoneForm next={next} currentPhone={account.phone} />
    </div>
  )
}
