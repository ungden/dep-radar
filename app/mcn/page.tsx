import { getMcnPolicy } from "@/lib/api/mcn"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, Handshake, ShieldCheck, Users, Wallet } from "lucide-react"
import { ButtonLink, Card, PageHeader } from "@/components/ui"
import { POLICY, commissionFor } from "@/lib/pricing"
import { formatPrice } from "@/lib/utils"

export const metadata: Metadata = {
  title: "MCN · Cùng phát triển đội ngũ KTV",
  description: "Hợp tác cùng 360đẹp để tuyển chọn, hướng dẫn và hỗ trợ KTV. Chia sẻ doanh thu minh bạch, KTV tự nguyện gia nhập và giữ quyền quản lý công việc.",
  alternates: { canonical: "/mcn" },
}

const steps = [
  ["01", "Đăng ký network", "Gửi thông tin tổ chức, người phụ trách và kế hoạch hỗ trợ KTV. 360đẹp xét duyệt trước khi network bắt đầu mời thành viên."],
  ["02", "KTV đồng ý gia nhập", "Mời bằng mã hồ sơ KTV. Mỗi người tự xem điều khoản và xác nhận trong tài khoản của mình; chỉ tham gia một network tại một thời điểm."],
  ["03", "Hỗ trợ để cùng phát triển", "Theo dõi thành viên, hướng dẫn hoàn thiện hồ sơ và lưu ghi chú chăm sóc. KTV trực tiếp quản lý lịch, giá, nhận việc và tiền của mình."],
  ["04", "Đối soát phần được chia", "Hoa hồng tính theo từng lịch hẹn. Sau thời gian giữ của chính sách tại lúc đặt, tính từ khi hoàn thành, phí đã được thu và không còn tranh chấp mở, sàn đối soát và chuyển khoản cho network."],
] as const

export const dynamic = "force-dynamic"
export default async function McnPage() {
  const policy = await getMcnPolicy()
  const feePercent = Math.round(POLICY.commissionRate * 100)
  const mcnPercent = feePercent * policy.feeShareRate
  const exampleCommission = commissionFor(500000)
  const mcn = Math.round(exampleCommission * policy.feeShareRate)
  const exampleSplit = {mcn, platform: exampleCommission - mcn}
  return (
    <div className="mx-auto max-w-5xl pb-12 md:pt-4">
      <PageHeader back="/doi-tac" />
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] bg-ink px-6 py-10 text-white md:px-12 md:py-14">
        <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10" />
        <div aria-hidden className="absolute -bottom-32 -right-10 size-96 rounded-full border border-highlight/20" />
        <div className="relative max-w-2xl">
          <p className="eyebrow text-highlight">360đẹp · Đối tác phát triển</p>
          <h1 className="mt-4 font-display text-[36px] font-semibold leading-[1.12] tracking-tight md:text-[52px]">Cùng xây một đội ngũ làm nghề tốt.</h1>
          <p className="mt-5 max-w-xl text-body leading-relaxed text-white/80 md:text-lead">Bạn tuyển chọn và đồng hành cùng KTV. 360đẹp cung cấp nền tảng đặt lịch, đối soát và chia sẻ doanh thu từ những công việc hoàn thành.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/mcn/dashboard" variant="highlight" size="lg">Đăng ký / quản lý network <ArrowRight className="size-4" aria-hidden /></ButtonLink>
            <Link href="/studio/network" className="inline-flex min-h-14 items-center text-body font-semibold text-white underline underline-offset-4">Tôi là KTV được mời</Link>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="mcn-fees">
        <p className="eyebrow">Một khoản phí, chia rõ ba bên</p>
        <h2 id="mcn-fees" className="mt-2 text-[27px] font-bold tracking-tight md:text-[32px]">Gia nhập network, KTV vẫn giữ phần thu nhập của mình</h2>
        <p className="mt-3 max-w-3xl text-body leading-relaxed text-ink-soft">Với phí dịch vụ hiện tại {feePercent}%, network nhận phần chia từ phí của sàn. KTV không trả thêm phí MCN, khách không trả phí nền tảng.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "KTV", pct: `${100 - feePercent}%`, desc: "Giá dịch vụ, cộng toàn bộ phí di chuyển và đặt gấp", icon: Users, color: "bg-highlight-soft" },
            { label: "Network MCN", pct: `${mcnPercent}%`, desc: `Tương đương ${policy.feeShareRate * 100}% khoản phí dịch vụ đã thu`, icon: Handshake, color: "bg-accent-soft" },
            { label: "360đẹp", pct: `${feePercent - mcnPercent}%`, desc: "Phần phí còn lại để vận hành và phát triển nền tảng", icon: ShieldCheck, color: "bg-subtle" },
          ].map(({ label, pct, desc, icon: Icon, color }) => (
            <Card key={label} className="p-5">
              <span className={`inline-flex size-10 items-center justify-center rounded-full ${color}`}><Icon className="size-5" aria-hidden /></span>
              <p className="mt-4 text-meta font-semibold text-ink-soft">{label}</p>
              <p className="mt-1 text-[40px] font-bold leading-tight tracking-tight">{pct}</p>
              <p className="mt-2 text-meta leading-relaxed text-muted">{desc}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-label leading-relaxed text-muted">Tỷ lệ minh hoạ trên giá dịch vụ. Số tiền thực tế được tính từ phí của từng lịch hẹn sau làm tròn; network nhận {policy.feeShareRate * 100}% khoản phí đó. Điều khoản được lưu tại thời điểm tạo lịch, không áp dụng hồi tố.</p>
        <div className="mt-5 rounded-[var(--radius-lg)] border border-line bg-surface p-5">
          <p className="flex items-center gap-2 text-body font-bold"><Wallet className="size-5 text-accent" aria-hidden /> Một lịch dịch vụ 500.000đ + di chuyển 50.000đ</p>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-body sm:grid-cols-3">
            <div><dt className="text-meta text-muted">KTV nhận</dt><dd className="mt-1 font-bold">{formatPrice(550000 - exampleCommission)}</dd></div>
            <div><dt className="text-meta text-muted">MCN được chia</dt><dd className="mt-1 font-bold">{formatPrice(exampleSplit.mcn)}</dd></div>
            <div><dt className="text-meta text-muted">Sàn giữ lại</dt><dd className="mt-1 font-bold">{formatPrice(exampleSplit.platform)}</dd></div>
          </dl>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="mcn-process">
        <p className="eyebrow">Từ tuyển chọn đến đối soát</p>
        <h2 id="mcn-process" className="mt-2 text-[27px] font-bold tracking-tight">Một quy trình cùng chịu trách nhiệm</h2>
        <ol className="mt-6 grid gap-5 sm:grid-cols-2">
          {steps.map(([number, title, body]) => (
            <li key={number} className="flex gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-5">
              <span className="font-display text-3xl font-semibold text-accent/60">{number}</span>
              <div><h3 className="text-lead font-bold">{title}</h3><p className="mt-2 text-body leading-relaxed text-ink-soft">{body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 grid gap-6 rounded-[var(--radius-xl)] bg-highlight-soft p-6 md:grid-cols-2 md:p-8">
        <div><h2 className="text-2xl font-bold tracking-tight">KTV tự nguyện. Quyền lợi minh bạch.</h2><p className="mt-3 text-body leading-relaxed text-ink-soft">Network được trả cho công việc hỗ trợ đội ngũ. Không thu tiền gia nhập, không thưởng tuyển người đơn thuần và không chia hoa hồng nhiều tầng.</p></div>
        <ul className="space-y-3 text-body">
          {[
            "KTV có thể rời network; lịch tạo sau đó không chia hoa hồng cho network cũ.",
            "Network không được nhận lịch, sửa tài khoản ngân hàng hay thu tiền thay KTV.",
            "Không chia hoa hồng trên lịch huỷ, chưa hoàn thành hoặc phí chưa được thu.",
            `Đối soát từ ${formatPrice(policy.minimumPayout)} đủ điều kiện; giữ ${policy.holdDays} ngày, có mã chuyển khoản và lịch sử ghi nhận.`,
          ].map((text) => <li key={text} className="flex gap-2.5"><Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /><span>{text}</span></li>)}
        </ul>
      </section>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-meta text-muted">Bạn đang quản lý một nhóm KTV, học viện hoặc cộng đồng nghề?</p>
        <ButtonLink href="/mcn/dashboard" variant="dark">Bắt đầu cùng 360đẹp <ArrowRight className="size-4" aria-hidden /></ButtonLink>
      </div>
    </div>
  )
}
