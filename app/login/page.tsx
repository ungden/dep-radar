import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Logo, PageHeader } from "@/components/ui"
import { signInWithGoogle } from "@/lib/auth/actions"
import { safeNext } from "@/lib/auth/credentials"
import { googleSignInEnabled } from "@/lib/auth/providers"
import { currentAccount } from "@/lib/supabase/server"
import { GoogleButton } from "./google-button"

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

  const enabled = await googleSignInEnabled()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <PageHeader back />
      <Logo size="lg" />
      <h1 className="mt-8 text-[32px] font-extrabold leading-tight tracking-tight">
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
