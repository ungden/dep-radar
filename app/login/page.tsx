import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarCheck } from "lucide-react"
import { Logo, PageHeader } from "@/components/ui"
import { getProBySlug } from "@/lib/api/pros"
import { signInWithGoogle } from "@/lib/auth/actions"
import { safeNext } from "@/lib/auth/credentials"
import { googleSignInEnabled } from "@/lib/auth/providers"
import { getTemplate } from "@/lib/catalog"
import { currentAccount } from "@/lib/supabase/server"
import { formatDateLong } from "@/lib/utils"
import { GoogleButton } from "./google-button"

/**
 * A visitor who chose a service and a time before signing in arrives here
 * with that booking in `next` (app/book/[proId]). Say what they are signing
 * in for, so the Google screen is the last step of booking, not a detour.
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
  description: "Đăng nhập 360dep bằng tài khoản Google để đặt lịch hoặc nhận khách.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; role?: string; loi?: string }>
}) {
  const params = await searchParams
  const wantsPro = params.role === "pro"
  const next = params.next ? safeNext(params.next) : wantsPro ? "/studio/onboarding" : "/"

  const account = await currentAccount()
  if (account) {
    if (!account.phone) redirect(`/me/so-dien-thoai?next=${encodeURIComponent(next)}`)
    redirect(wantsPro && account.isPro && !params.next ? "/studio" : next)
  }

  const [enabled, booking] = await Promise.all([googleSignInEnabled(), pendingBooking(next)])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <PageHeader back />
      <Logo size="lg" />
      <h1 className="mt-8 text-[32px] font-bold leading-tight tracking-tight">
        {wantsPro ? "Nhận khách trên 360dep" : "Đăng nhập"}
      </h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        {wantsPro
          ? "Thợ làm đẹp, người chụp ảnh, quay clip, người mẫu: mở hồ sơ miễn phí, tự đặt giá trong khung chuẩn, chỉ trả hoa hồng khi hoàn thành lịch hẹn."
          : "Dùng tài khoản Google của bạn. Một tài khoản dùng được cả để đặt lịch và để nhận khách."}
      </p>
      {wantsPro && (
        <ul className="mt-5 space-y-2 text-[15px]">
          {["Không phí đăng ký, không phí duy trì", "Khách gần bạn đặt thẳng theo lịch bạn mở", "Xác minh danh tính để được xếp trước"].map((t) => (
            <li key={t} className="flex gap-2.5">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
              {t}
            </li>
          ))}
        </ul>
      )}

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

      {params.loi === "google" && (
        <p role="alert" className="mt-5 rounded-xl bg-danger-soft px-3.5 py-3 text-[14px] text-danger">
          Chưa đăng nhập được bằng Google. Bạn có thể đã huỷ ở bước chọn tài khoản; thử lại nhé.
        </p>
      )}

      <form action={signInWithGoogle} className="mt-8">
        <input type="hidden" name="next" value={next} />
        <GoogleButton disabled={!enabled} />
      </form>

      {!enabled && (
        <p role="status" className="mt-3 rounded-xl bg-warning-soft px-3.5 py-3 text-[13px] text-ink-soft">
          Đăng nhập bằng Google đang được thiết lập. Vui lòng quay lại sau ít phút.
        </p>
      )}

      <p className="mt-6 text-center text-[13px] leading-relaxed text-muted">
        Lần đầu đăng nhập, 360dep sẽ hỏi số điện thoại của bạn: người làm gọi số đó để xác nhận lịch hẹn. Tiếp tục
        nghĩa là bạn đồng ý để 360dep xử lý tên, email và số điện thoại theo{" "}
        <Link href="/chinh-sach" className="underline">
          chính sách
        </Link>
        .
      </p>
    </div>
  )
}
