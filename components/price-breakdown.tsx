"use client"

import * as React from "react"
import { CreditCard, HandCoins } from "lucide-react"
import { Card } from "@/components/ui"
import { POLICY } from "@/lib/pricing"
import type { PaymentMethod, PriceQuote } from "@/lib/types"
import { formatPrice } from "@/lib/utils"

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  online: "Thanh toán online toàn bộ",
  cash: "Trả trực tiếp sau khi làm",
}

export function PriceBreakdown({
  quote,
  paymentMethod,
  forPro = false,
}: {
  quote: PriceQuote
  paymentMethod: PaymentMethod
  forPro?: boolean
}) {
  const Icon = paymentMethod === "online" ? CreditCard : HandCoins
  return (
    <Card className="space-y-2 p-4 text-sm">
      <Line label="Giá dịch vụ" value={formatPrice(quote.servicePrice)} />
      <Line
        label={
          quote.distanceKm !== null
            ? `Phí di chuyển (~${quote.distanceKm.toLocaleString("vi-VN")} km, miễn phí ${POLICY.freeTravelKm} km đầu)`
            : "Phí di chuyển"
        }
        value={quote.travelFee ? formatPrice(quote.travelFee) : "Miễn phí"}
      />
      {quote.urgentFee > 0 && <Line label="Phí đặt gấp" value={formatPrice(quote.urgentFee)} />}
      {!forPro && <Line label="Phí nền tảng" value={<span className="text-success">0đ · miễn phí cho khách</span>} />}
      <div className="flex justify-between border-t border-line pt-2 font-semibold">
        <span>Tổng khách trả</span>
        <span>{formatPrice(quote.total)}</span>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-ink-soft">
        <Icon className="size-3.5" />
        {PAYMENT_LABEL[paymentMethod]}
      </p>

      {forPro && (
        <div className="space-y-1.5 border-t border-line pt-2">
          <Line label={`Hoa hồng dep360 (${Math.round(quote.commissionRate * 100)}% giá dịch vụ)`} value={`−${formatPrice(quote.commission)}`} />
          <div className="flex justify-between font-semibold text-success">
            <span>Bạn thực nhận</span>
            <span>{formatPrice(quote.payout)}</span>
          </div>
          <p className="text-xs text-muted">
            {paymentMethod === "online"
              ? `Khách đã thanh toán online. dep360 chuyển ${formatPrice(quote.payout)} cho bạn trong kỳ đối soát sau khi hoàn thành.`
              : `Thu ${formatPrice(quote.total)} trực tiếp từ khách. Hoa hồng ${formatPrice(quote.commission)} ghi vào công nợ, tự trừ vào tiền online kỳ tới.`}{" "}
            Phí di chuyển và phí đặt gấp giữ nguyên 100% cho bạn.
          </p>
        </div>
      )}
    </Card>
  )
}

function Line({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-ink-soft">
      <span>{label}</span>
      <span className="shrink-0 text-right">{value}</span>
    </div>
  )
}
