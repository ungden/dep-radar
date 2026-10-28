import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BadgeCheck, CalendarCheck, HandCoins, Megaphone, Wallet } from "lucide-react"
import { CategoryIcon } from "@/components/category-icon"
import { ButtonLink, PageHeader } from "@/components/ui"
import { CATEGORY_TINTS } from "@/lib/design/category-icons"
import { HERO_PHOTOS } from "@/lib/design/photos"
import { cn } from "@/lib/utils"
import { IDENTITY_VERIFICATION_OPEN } from "@/lib/launch"
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
      text: "Mở hồ sơ, chọn dịch vụ, chọn mức giá có sẵn cho từng gói và giờ làm việc, rồi gửi duyệt. Khi được duyệt và bật nhận khách, khách gần bạn đặt theo lịch bạn mở; bạn xác nhận trong app.",
    },
    {
      icon: Megaphone,
      title: "Nhận việc",
      text: "Khách đăng yêu cầu, người làm quanh đó được báo. Ai nhận trước được việc. Nhận rồi hai bên mới nhắn tin và thấy số điện thoại của nhau.",
    },
    {
      icon: HandCoins,
      title: `Phí ${pct}, chỉ khi xong việc`,
      text: `Không phí đăng ký, không phí duy trì. Khách trả thẳng cho bạn; khi lịch hoàn thành, 360dep tính ${pct} trên giá dịch vụ vào ví của bạn. Phí di chuyển và phí đặt gấp thuộc về bạn.`,
    },
    {
      icon: Wallet,
      title: "Trả phí trước đơn tiếp",
      text: "Phí trừ vào ví đối tác. Ví còn âm thì chưa nhận được lịch hay việc mới; nạp bằng chuyển khoản là nhận lại được ngay.",
    },
    {
      icon: BadgeCheck,
      title: "Xác minh danh tính",
      text: IDENTITY_VERIFICATION_OPEN
        ? "Xác minh bằng CCCD và ảnh chân dung để có dấu đã xác minh và được xếp trước người chưa xác minh. Đăng tin tuyển mẫu và làm dịch vụ người mẫu cần xác minh."
        : "Sắp mở: xác minh bằng CCCD và ảnh chân dung để có dấu đã xác minh. Dịch vụ người mẫu và tin tuyển mẫu mở cùng lúc với xác minh.",
    },
  ]

  return (
    <div className="mx-auto max-w-5xl pb-10 md:pt-4">
      <PageHeader back="/" />
      <section className="relative -mx-4 overflow-hidden bg-ink text-white sm:mx-0 sm:rounded-[var(--radius-xl)]">
        <Image src={HERO_PHOTOS.beauty} alt="" fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="relative px-5 py-10 md:max-w-[62%] md:px-12 md:py-16">
          <p className="eyebrow text-highlight">360đẹp Đối tác</p>
          <h1 className="mt-3 text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] md:text-[52px]">Nhận khách quanh bạn, tự chủ giờ làm</h1>
          <p className="mt-4 text-body text-white/85 md:text-lead">
            Dành cho người làm nghề tự do: thợ làm đẹp, người chụp ảnh, quay clip và người mẫu. Chọn mức giá có sẵn cho từng gói, chỉ trả phí {pct} khi xong việc.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href={JOIN} size="lg" variant="highlight">
              Mở hồ sơ đối tác miễn phí <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <Link href="/chinh-sach" className="text-body font-semibold text-white underline underline-offset-4">Xem phí & chính sách</Link>
          </div>
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">Ảnh minh hoạ</span>
      </section>

      <section className="mt-12">
        <p className="eyebrow">Cách làm việc</p>
        <h2 className="mt-1.5 text-[24px] font-extrabold tracking-tight md:text-[30px]">Rõ việc, rõ phí từ ngày đầu</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <li key={step.title} className={cn("rounded-[var(--radius-lg)] border border-line bg-surface p-5", i >= 3 && "md:col-span-1")}>
                <span className="flex size-11 items-center justify-center rounded-full bg-highlight-soft text-ink">
                  <Icon className="size-5" />
                </span>
                <span className="mt-4 block text-lead font-bold tracking-tight">{step.title}</span>
                <span className="mt-1.5 block text-body leading-relaxed text-ink-soft">{step.text}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="mt-12">
        <p className="eyebrow">Nhận những việc gì</p>
        <h2 className="mt-1.5 text-[24px] font-extrabold tracking-tight md:text-[30px]">{CATEGORIES.length} danh mục, 3 ngành</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {VERTICALS.map((vertical) => (
            <div key={vertical.id} className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
              <p className="text-lead font-bold">{vertical.label}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {categoriesOf(vertical.id).map((c) => (
                  <li key={c.id} className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-label font-bold" style={{ background: CATEGORY_TINTS[c.id].bg, color: CATEGORY_TINTS[c.id].fg }}>
                    <CategoryIcon id={c.id} className="size-4" />
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-meta text-muted">Mỗi gói có đúng 3 mức giá có sẵn, bạn chọn mức hợp với tay nghề.</p>
      </section>

      <section className="mt-12 rounded-[var(--radius-xl)] border border-line bg-surface p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8">
        <div className="max-w-xl">
          <p className="eyebrow">Dành cho tổ chức & cộng đồng nghề</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Bạn đang phát triển một đội ngũ KTV?</h2>
          <p className="mt-3 text-body leading-relaxed text-ink-soft">Hợp tác MCN cùng 360đẹp để tuyển chọn, hướng dẫn và đồng hành cùng KTV. Network nhận phần chia từ phí của sàn, KTV không đóng thêm phí MCN.</p>
        </div>
        <ButtonLink href="/mcn" variant="outline" className="mt-5 shrink-0 md:mt-0">Tìm hiểu network MCN <ArrowRight className="size-4" aria-hidden /></ButtonLink>
      </section>

      <section className="mt-12 rounded-[var(--radius-xl)] bg-highlight-soft p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-10">
        <div className="max-w-xl">
          <h2 className="font-display text-[26px] font-semibold leading-tight tracking-tight md:text-[32px]">Bắt đầu trong sáu bước</h2>
          <p className="mt-2 text-body text-ink-soft">
            Đăng nhập hoặc tạo tài khoản, rồi lưu đủ sáu bước: nghề, dịch vụ và giá, nơi phục vụ, giờ làm, tác phẩm và xác nhận chính sách.
            Gửi hồ sơ để duyệt; khi được duyệt, bật nhận khách mới lúc bạn sẵn sàng.
          </p>
          <p className="mt-3 text-meta text-muted">
            Chi tiết phí và ví trong{" "}
            <Link href="/chinh-sach" className="underline underline-offset-2">
              chính sách
            </Link>
            .
          </p>
        </div>
        <ButtonLink href={JOIN} size="lg" variant="dark" className="mt-5 shrink-0 md:mt-0">
          Mở hồ sơ đối tác
        </ButtonLink>
      </section>
    </div>
  )
}
