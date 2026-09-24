import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, CalendarCheck, HandCoins, Megaphone, Wallet } from "lucide-react"
import { ButtonLink, PageHeader } from "@/components/ui"
import { CATEGORIES, VERTICALS, categoriesOf } from "@/lib/catalog"
import { POLICY } from "@/lib/pricing"

export const metadata: Metadata = {
  title: { absolute: "Trở thành đối tác 360dep" },
  description: `Thợ làm đẹp, người chụp ảnh, quay clip và người mẫu: mở hồ sơ miễn phí, nhận lịch và nhận việc quanh bạn. 360dep chỉ thu ${Math.round(
    POLICY.commissionRate * 100,
  )}% khi bạn hoàn thành lịch hẹn.`,
  alternates: { canonical: "/doi-tac" },
}

const pct = `${Math.round(POLICY.commissionRate * 100)}%`
const JOIN = "/login?role=pro"

/**
 * The one door to the partner side. Customers are not asked to become partners
 * anywhere else (footer and the last row of /me link here); everything said
 * here is what the product does today (app/chinh-sach, section 14).
 */
export default function PartnerPage() {
  const steps = [
    {
      icon: CalendarCheck,
      title: "Nhận lịch",
      text: "Mở hồ sơ, chọn dịch vụ, đặt giá trong khung chuẩn và giờ làm việc. Khách gần bạn đặt thẳng theo lịch bạn mở; bạn xác nhận trong app.",
    },
    {
      icon: Megaphone,
      title: "Nhận việc",
      text: "Khách đăng yêu cầu, người làm quanh đó được báo. Ai nhận trước được việc. Nhận rồi hai bên mới nhắn tin và thấy số điện thoại của nhau.",
    },
    {
      icon: HandCoins,
      title: `Phí ${pct}, chỉ khi xong việc`,
      text: `Không phí đăng ký, không phí duy trì. Khách trả thẳng cho bạn; khi bạn bấm hoàn thành, 360dep tính ${pct} trên giá dịch vụ. Phí di chuyển và phí đặt gấp thuộc về bạn.`,
    },
    {
      icon: Wallet,
      title: "Trả phí trước đơn tiếp",
      text: "Phí trừ vào ví đối tác. Ví còn âm thì chưa nhận được lịch hay việc mới; nạp bằng chuyển khoản là nhận lại được ngay.",
    },
    {
      icon: BadgeCheck,
      title: "Xác minh danh tính",
      text: "Xác minh bằng CCCD và ảnh chân dung để có dấu đã xác minh và được xếp trước người chưa xác minh. Đăng tin tuyển mẫu và làm dịch vụ người mẫu cần xác minh.",
    },
  ]

  return (
    <div className="mx-auto max-w-2xl pb-10 md:pt-4">
      <PageHeader back="/" />
      <p className="text-[13px] font-semibold uppercase tracking-wide text-accent">360dep Đối tác</p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight md:text-[40px]">Trở thành đối tác 360dep</h1>
      <p className="mt-3 text-[16px] text-ink-soft">
        Dành cho người làm nghề tự do: thợ làm đẹp, người chụp ảnh, quay clip và người mẫu. Nhận khách quanh bạn, tự chủ giá và
        giờ làm.
      </p>
      <ButtonLink href={JOIN} size="lg" className="mt-6 w-full md:w-auto">
        Mở hồ sơ đối tác miễn phí
      </ButtonLink>

      <section className="mt-10">
        <h2 className="text-[20px] font-bold tracking-tight">Cách làm việc</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="flex gap-3.5 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[16px] font-bold">{step.title}</span>
                  <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-soft">{step.text}</span>
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-[20px] font-bold tracking-tight">Nhận những việc gì</h2>
        <ul className="mt-4 space-y-3">
          {VERTICALS.map((vertical) => (
            <li key={vertical.id}>
              <p className="text-[15px] font-semibold">{vertical.label}</p>
              <p className="text-[14px] text-ink-soft">
                {categoriesOf(vertical.id)
                  .map((c) => c.label)
                  .join(", ")}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-muted">{CATEGORIES.length} danh mục, giá đặt trong khung chuẩn của từng dịch vụ.</p>
      </section>

      <section className="mt-10 rounded-[var(--radius-lg)] bg-subtle p-5">
        <h2 className="text-[18px] font-bold tracking-tight">Bắt đầu</h2>
        <p className="mt-1.5 text-[14px] text-ink-soft">
          Đăng nhập hoặc tạo tài khoản, rồi mở hồ sơ: dịch vụ và giá, giờ làm, khu vực, ít nhất một ảnh tác phẩm. Đủ thông tin là bật
          hồ sơ cho khách thấy.
        </p>
        <ButtonLink href={JOIN} className="mt-4">
          Mở hồ sơ đối tác
        </ButtonLink>
        <p className="mt-4 text-[13px] text-muted">
          Chi tiết phí và ví trong{" "}
          <Link href="/chinh-sach" className="underline underline-offset-2">
            chính sách
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
