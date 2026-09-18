"use client"

import Link from "next/link"
import { BadgeCheck, ChevronRight, Eye, IdCard, TrendingUp } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { RatingSummaryBlock, ReviewItem, VerifiedMark } from "@/components/trust"
import { Avatar, ButtonLink, Card, PageHeader } from "@/components/ui"
import { actions, proView, reviewsOf, useApp } from "@/lib/store"
import type { VerificationStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const BENEFITS = [
  { icon: TrendingUp, title: "Lên đầu tìm kiếm", text: "Hồ sơ xác minh được xếp trước hồ sơ chưa xác minh." },
  { icon: BadgeCheck, title: "Có dấu tick", text: "Khách thấy dấu tick và huy hiệu “Đã xác minh danh tính”." },
  { icon: Eye, title: "Được chọn nhiều hơn", text: "Khách có thể lọc chỉ xem chuyên viên đã xác minh." },
]

const STATUS_TEXT: Record<VerificationStatus, string> = {
  none: "Chưa xác minh",
  pending: "Đang đối chiếu, thường dưới 1 phút",
  verified: "Khách thấy dấu tick cạnh tên bạn",
  rejected: "Lần trước chưa thành công, hãy chụp lại rõ hơn",
}

export default function StudioProfilePage() {
  return (
    <div className="mx-auto max-w-3xl md:pt-4">
      <PageHeader title="Xác minh & đánh giá" back="/studio" />
      <RequireSession role="pro">
        <ProfileTrust />
      </RequireSession>
    </div>
  )
}

function ProfileTrust() {
  const state = useApp()
  const proId = state.session!.proId!
  const pro = proView(state, proId)!
  const reviews = reviewsOf(state, proId)

  return (
    <div className="space-y-6">
      <Link href={`/pros/${proId}`} className="flex items-center gap-3">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={56} />
        <div className="flex-1">
          <p className="flex items-center gap-1.5 font-semibold">
            {pro.name} <VerifiedMark pro={pro} />
          </p>
          <p className="text-sm text-muted">Xem hồ sơ công khai</p>
        </div>
        <ChevronRight className="size-5 text-muted" />
      </Link>

      <section>
        <h2 className="font-semibold">Xác minh danh tính</h2>
        <p className="mt-1 text-sm text-ink-soft">Không bắt buộc. Chụp CCCD 2 mặt và 1 ảnh selfie, khoảng 2 phút.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl bg-blush px-3 py-3">
              <Icon className="size-4 text-rose" />
              <p className="mt-1 text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
        <Card className="mt-4 flex items-center gap-3 p-4">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              pro.identity === "verified" ? "bg-success-soft text-success" : "bg-canvas text-muted",
            )}
          >
            <IdCard className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">CCCD + ảnh selfie</p>
            <p className="text-xs text-muted">{STATUS_TEXT[pro.identity]}</p>
          </div>
          {pro.identity === "verified" ? (
            <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">Đã xác minh</span>
          ) : pro.identity === "pending" ? (
            <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning">Đang kiểm tra</span>
          ) : (
            <ButtonLink href="/studio/verify" size="sm">
              {pro.identity === "rejected" ? "Chụp lại" : "Xác minh ngay"}
            </ButtonLink>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Đánh giá từ khách</h2>
        <Card className="p-4">
          <RatingSummaryBlock rating={pro.rating} />
        </Card>
        <ul className="mt-2 divide-y divide-line">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} onReply={(text) => actions.replyReview(r.id, text)} />
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">Bạn không thể xoá hay sửa đánh giá, chỉ phản hồi công khai. Đánh giá vi phạm có thể báo cáo cho dep360.</p>
      </section>
    </div>
  )
}
