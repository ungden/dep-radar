"use client"

import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, ImagePlus, Megaphone, UserRoundSearch, Users } from "lucide-react"
import { PageHeader } from "@/components/ui"
import { useApp } from "@/lib/store"

type Option = { href: string; title: string; text: string; icon: React.ComponentType<{ className?: string }> }

/**
 * What the centre "＋" button opens. A customer and a freelancer post
 * different things, so each sees only their own options.
 */
export default function PostPage() {
  const { session } = useApp()
  const isPro = session?.role === "pro"

  const options: Option[] = isPro
    ? [
        { href: "/studio/works", title: "Đăng tác phẩm", text: "Ảnh, ảnh trước/sau hoặc một clip ngắn. Tác phẩm thật là thứ khách xem đầu tiên.", icon: ImagePlus },
        { href: "/studio/tuyen-mau", title: "Tuyển mẫu", text: "Cần mẫu để luyện tay hoặc chụp portfolio? Đăng tin, khách ứng tuyển, bạn chọn.", icon: Users },
        { href: "/studio/jobs", title: "Báo giá việc mới", text: "Khách gần bạn đang cần người. Gửi báo giá trong khung giá chuẩn.", icon: BriefcaseBusiness },
      ]
    : [
        { href: "/requests/new", title: "Đăng yêu cầu", text: "Nói bạn cần gì, khi nào, ở đâu. Người làm gần bạn gửi báo giá, bạn chọn.", icon: Megaphone },
        { href: "/tuyen-mau", title: "Làm mẫu", text: "Thợ nail, makeup, người chụp đang tìm mẫu. Được làm đẹp miễn phí hoặc có thù lao.", icon: UserRoundSearch },
      ]

  return (
    <div className="mx-auto max-w-xl md:pt-6">
      <PageHeader title={isPro ? "Đăng gì hôm nay?" : "Bạn muốn làm gì?"} back />
      <ul className="mt-2 space-y-3">
        {options.map((o) => (
          <li key={o.href}>
            <Link
              href={session ? o.href : `/login?next=${encodeURIComponent(o.href)}`}
              className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-4 transition-colors hover:border-ink/30"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-subtle">
                <o.icon className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold">{o.title}</span>
                <span className="mt-0.5 block text-[14px] text-ink-soft">{o.text}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
