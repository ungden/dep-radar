import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarCheck } from "lucide-react"
import { Logo, PageHeader } from "@/components/ui"
import { getProBySlug } from "@/lib/api/pros"
import { signInWithProvider } from "@/lib/auth/actions"
import { safeNext } from "@/lib/auth/credentials"
import { oauthProviders } from "@/lib/auth/providers"
import { getTemplate } from "@/lib/catalog"
import { currentAccount } from "@/lib/supabase/server"
import { formatDateLong } from "@/lib/utils"
import { AppleButton, GoogleButton } from "./google-button"
import { PasswordForm } from "./password-form"

/**
 * A visitor who chose a service and a time before signing in arrives here
 * with that booking in `next` (app/book/[proId]). Say what they are signing
 * in for, so this is the last step of booking, not a detour.
 */
async function pendingBooking(next: string) {
  const match = next.match(/^\/book\/([^/?#]+)\?(.*)$/)
  if (!match) return null
  const q = new URLSearchParams(match[2])
  const time = q.get("time")
  const date = q.get("date")
  if (!time || !/^\d{2}:\d{2}$/.test(time) || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const pro = await getProBySlug(decodeURIComponent(match[1])).catch(() => null)
  if (!pro) return null
  return { name: pro.name, service: getTemplate(q.get("service") ?? "")?.name ?? null, when: `${time} ${formatDateLong(date)}` }
}

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập 360dep bằng Google, số điện thoại hoặc email để đặt lịch làm đẹp, chụp ảnh, quay clip.",
}

const ERRORS: Record<string, string> = {
  google: "Chưa đăng nhập được bằng Google. Bạn có thể đã huỷ ở bước chọn tài khoản; thử lại nhé.",
  apple: "Chưa đăng nhập được bằng Apple. Thử lại nhé.",
  oauth: "Chưa đăng nhập được. Bạn có thể đã huỷ ở bước chọn tài khoản; thử lại nhé.",
  email: "Link xác nhận email không hoàn tất được ở trình duyệt này. Đăng nhập rồi xem email trong Cài đặt tài khoản.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; role?: string; loi?: string; tao?: string }>
}) {
  const params = await searchParams
  const wantsPro = params.role === "pro"
  const next = params.next ? safeNext(params.next) : wantsPro ? "/studio/onboarding" : "/"

  const account = await currentAccount()
  if (account) {
    if (!account.phone) redirect(`/me/so-dien-thoai?next=${encodeURIComponent(next)}`)
    redirect(wantsPro && account.isPro && !params.next ? "/studio" : next)
  }

  const [providers, booking] = await Promise.all([oauthProviders(), pendingBooking(next)])
  const error = params.loi ? ERRORS[params.loi] : null

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <PageHeader back />
      <Logo size="lg" />
      <h1 className="mt-8 text-[32px] font-bold leading-tight tracking-tight">{wantsPro ? "Trở thành đối tác 360dep" : "Đăng nhập"}</h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        {wantsPro ? (
          <>
            Đăng nhập hoặc tạo tài khoản, rồi mở hồ sơ đối tác miễn phí.{" "}
            <Link href="/doi-tac" className="underline underline-offset-2">
              Cách 360dep làm việc với đối tác
            </Link>
          </>
        ) : (
          "Đặt lịch làm đẹp, chụp ảnh, quay clip với người làm gần bạn."
        )}
      </p>

      {booking && (
        <p className="mt-5 flex gap-3 rounded-[var(--radius-lg)] bg-accent-soft px-4 py-3.5 text-[15px] text-ink">
          <CalendarCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <span>
            <span className="block font-semibold">
              Đăng nhập để gửi lịch với {booking.name} · {booking.when}
            </span>
            {booking.service && <span className="block text-[14px] text-ink-soft">{booking.service}. Lựa chọn của bạn được giữ nguyên.</span>}
          </span>
        </p>
      )}

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-danger-soft px-3.5 py-3 text-[14px] text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-3">
        <form action={signInWithProvider}>
          <input type="hidden" name="provider" value="google" />
          <input type="hidden" name="next" value={next} />
          <GoogleButton disabled={!providers.google} />
        </form>
        {/* Apple appears only once it is switched on in Supabase. */}
        {providers.apple && (
          <form action={signInWithProvider}>
            <input type="hidden" name="provider" value="apple" />
            <input type="hidden" name="next" value={next} />
            <AppleButton />
          </form>
        )}
      </div>

      {!providers.google && (
        <p role="status" className="mt-3 rounded-xl bg-warning-soft px-3.5 py-3 text-[13px] text-ink-soft">
          Đăng nhập bằng Google đang được thiết lập. Bạn vẫn đăng nhập được bằng số điện thoại hoặc email bên dưới.
        </p>
      )}

      <div className="my-6 flex items-center gap-3 text-[13px] text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        hoặc dùng mật khẩu
        <span className="h-px flex-1 bg-line" />
      </div>

      <PasswordForm next={next} initialMode={params.tao === "1" ? "tao-tai-khoan" : "dang-nhap"} googleEnabled={providers.google} />

      <p className="mt-6 text-center text-[13px] leading-relaxed text-muted">
        360dep cần số điện thoại của bạn trước khi đặt lịch: người làm chỉ thấy số này khi đã nhận lịch của bạn, cho tới khi lịch
        kết thúc. Tiếp tục nghĩa là bạn đồng ý để 360dep xử lý tên, email và số điện thoại theo{" "}
        <Link href="/chinh-sach" className="underline">
          chính sách
        </Link>
        .
      </p>
    </div>
  )
}
