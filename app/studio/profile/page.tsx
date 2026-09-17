"use client"

import Link from "next/link"
import { Check, ChevronRight, X } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { ProStatGrid, RatingBreakdown, ReviewItem, TierBadge, VerificationList } from "@/components/trust"
import { Avatar, Button, Card, PageHeader } from "@/components/ui"
import { COMMISSION_RATE } from "@/lib/pricing"
import { actions, proView, reviewsOf, useApp } from "@/lib/store"
import { TIERS, VERIFICATIONS, nextTierProgress, tierOf } from "@/lib/trust"
import { cn } from "@/lib/utils"

export default function StudioProfilePage() {
  return (
    <div className="mx-auto max-w-3xl md:pt-4">
      <PageHeader title="Hồ sơ & uy tín" back="/studio" />
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
  const tier = tierOf(pro)
  const progress = nextTierProgress(pro)
  const reviews = reviewsOf(state, proId)
  const pct = (n: number) => `${Math.round(n * 100)}%`

  return (
    <div className="space-y-6">
      <Link href={`/pros/${proId}`} className="flex items-center gap-3">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={56} />
        <div className="flex-1">
          <p className="flex items-center gap-2 font-semibold">
            {pro.name} <TierBadge tier={tier} />
          </p>
          <p className="text-sm text-muted">Xem hồ sơ công khai</p>
        </div>
        <ChevronRight className="size-5 text-muted" />
      </Link>

      <ProStatGrid pro={pro} />

      <section>
        <h2 className="mb-3 font-semibold">Hạng & hoa hồng</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-canvas text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Hạng</th>
                <th className="px-3 py-2 font-medium">Hoa hồng</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Điều kiện chính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {TIERS.map((t) => (
                <tr key={t.id} className={cn(t.id === tier && "bg-blush/60")}>
                  <td className="px-3 py-2.5">
                    <TierBadge tier={t.id} />
                    {t.id === tier && <span className="ml-1.5 text-[11px] font-semibold text-rose">Bạn</span>}
                  </td>
                  <td className="px-3 py-2.5 font-semibold">{Math.round(COMMISSION_RATE[t.id] * 100)}%</td>
                  <td className="hidden px-3 py-2.5 text-ink-soft sm:table-cell">
                    {t.minJobs ? `≥ ${t.minJobs} job, ★ ≥ ${t.minRating}, huỷ ≤ ${pct(t.maxCancellation)}, phản hồi ≥ ${pct(t.minResponse)}` : "Xác minh số điện thoại"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="mt-2 text-xs text-muted">
          Hoa hồng chỉ tính trên giá dịch vụ, không tính trên phí di chuyển và phí đặt gấp. Hạng được xét lại mỗi ngày dựa trên 90 ngày gần nhất.
        </p>

        {progress && (
          <Card className="mt-3 p-4">
            <p className="text-sm font-semibold">
              Để lên hạng <TierBadge tier={progress.next.id} /> (hoa hồng {Math.round(COMMISSION_RATE[progress.next.id] * 100)}%)
            </p>
            <ul className="mt-3 divide-y divide-line">
              {progress.reqs.map((r) => (
                <li key={r.label} className="flex items-center gap-3 py-2 text-[13px]">
                  <span className={cn("flex size-5 items-center justify-center rounded-full", r.done ? "bg-success text-white" : "bg-line text-muted")}>
                    {r.done ? <Check className="size-3" /> : <X className="size-3" />}
                  </span>
                  <span className="flex-1">{r.label}</span>
                  <span className={cn("font-medium", r.done ? "text-success" : "text-ink")}>{r.current}</span>
                  <span className="w-24 text-right text-xs text-muted">cần {r.target}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-semibold">Xác minh</h2>
        <p className="mb-3 text-xs text-muted">Hồ sơ đã xác minh được gắn dấu tick, lên hạng nhanh hơn và được ưu tiên trong kết quả tìm kiếm.</p>
        <Card className="px-4">
          <VerificationList pro={pro} />
        </Card>
        <div className="mt-3 flex flex-wrap gap-2">
          {VERIFICATIONS.filter((v) => pro.verifications[v.id] === "none").map((v) => (
            <Button key={v.id} variant="outline" size="sm" onClick={() => actions.submitVerification(v.id)}>
              Gửi hồ sơ xác minh {v.short.toLowerCase()}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Đánh giá từ khách</h2>
        <Card className="p-4">
          <RatingBreakdown rating={pro.rating} />
        </Card>
        <ul className="mt-2 divide-y divide-line">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} onReply={(text) => actions.replyReview(r.id, text)} />
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">Bạn không thể xoá hay sửa đánh giá, chỉ phản hồi công khai một lần. Đánh giá vi phạm (xúc phạm, spam) có thể báo cáo cho dep360.</p>
      </section>
    </div>
  )
}
