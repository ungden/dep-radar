import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Logo, PageHeader } from "@/components/ui"
import { safeNext } from "@/lib/auth/credentials"
import { currentAccount } from "@/lib/supabase/server"
import { PhoneForm } from "./phone-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Số điện thoại",
  robots: { index: false, follow: false },
}

/** The one step after the first Google sign-in: Google never gives a phone number. */
export default async function PhonePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams
  const next = safeNext(rawNext)
  const account = await currentAccount()
  if (!account) redirect(`/login?next=${encodeURIComponent(`/me/so-dien-thoai?next=${next}`)}`)
  if (account.phone) redirect(next)

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <PageHeader back="/" />
      <Logo size="lg" />
      <h1 className="mt-4 text-[28px] font-extrabold tracking-tight">Thêm số điện thoại</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {account.full_name ? `Chào ${account.full_name}. ` : ""}Chuyên viên gọi số này để xác nhận lịch hẹn trước khi
        nhận job, và bạn gọi lại cho họ khi cần. Mỗi số điện thoại chỉ gắn với một tài khoản.
      </p>
      <PhoneForm next={next} />
    </div>
  )
}
