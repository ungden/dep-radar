"use client"

import Link from "next/link"
import { ChevronRight, Eye, ShieldCheck, TrendingUp } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { RatingSummaryBlock, ReviewItem, TrustedBadge, VERIFICATION_ICON, VerifiedMark } from "@/components/trust"
import { Avatar, Button, Card, PageHeader } from "@/components/ui"
import { actions, proView, reviewsOf, useApp } from "@/lib/store"
import { VERIFICATIONS, verifiedCount } from "@/lib/trust"
import { cn } from "@/lib/utils"

const BENEFITS = [
  { icon: TrendingUp, title: "Lên đầu tìm kiếm", text: "Hồ sơ xác minh được xếp trước hồ sơ chưa xác minh." },
  { icon: ShieldCheck, title: "Có huy hiệu", text: "Khách thấy huy hiệu ngay cạnh tên. Đủ 3 mục được huy hiệu Tin cậy." },
  { icon: Eye, title: "Được chọn nhiều hơn", text: "Khách có thể lọc chỉ xem chuyên viên đã xác minh." },
]

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
  const done = verifiedCount(pro)

  return (
    <div className="space-y-6">
      <Link href={`/pros/${proId}`} className="flex items-center gap-3">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={56} />
        <div className="flex-1">
          <p className="flex items-center gap-1.5 font-semibold">
            {pro.name} <VerifiedMark pro={pro} /> <TrustedBadge pro={pro} />
          </p>
          <p className="text-sm text-muted">Xem hồ sơ công khai</p>
        </div>
        <ChevronRight className="size-5 text-muted" />
      </Link>

      <section>
        <h2 className="font-semibold">Xác minh để được ưu tiên ({done}/{VERIFICATIONS.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">Không bắt buộc. Mỗi mục xác minh giúp bạn:</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl bg-blush px-3 py-3">
              <Icon className="size-4 text-rose" />
              <p className="mt-1 text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>

        <Card className="mt-4 divide-y divide-line px-4">
          {VERIFICATIONS.map((v) => {
            const Icon = VERIFICATION_ICON[v.id]
            const status = pro.verifications[v.id]
            return (
              <div key={v.id} className="flex items-center gap-3 py-3.5">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", status === "verified" ? "bg-success-soft text-success" : "bg-canvas text-muted")}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{v.label}</p>
                  <p className="text-xs text-muted">{v.description}</p>
                </div>
                {status === "verified" ? (
                  <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">Đã xác minh</span>
                ) : status === "pending" ? (
                  <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning">Đang duyệt</span>
                ) : (
                  <Button size="sm" onClick={() => actions.submitVerification(v.id)}>
                    Xác minh
                  </Button>
                )}
              </div>
            )
          })}
        </Card>
        <p className="mt-2 text-xs text-muted">Bản demo: hồ sơ gửi lên được tự duyệt sau vài giây.</p>
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
