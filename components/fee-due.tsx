"use client"

import Link from "next/link"
import { WalletTopUp } from "@/components/wallet-topup"
import { useApp } from "@/lib/store"
import { cn, formatPrice } from "@/lib/utils"

/**
 * The fee is paid before the next job (supabase/migrations/20260926100000):
 * completing a job charges the commission to the wallet, and while the wallet
 * is below zero the freelancer cannot accept a booking or take a request.
 * What they owe, from the snapshot's own balance; 0 when nothing is owed or
 * the balance could not be read.
 */
export function useFeeOwed(): number {
  const wallet = useApp().myWallet
  return wallet && wallet.balance < 0 ? -wallet.balance : 0
}

/** Said next to a disabled "Nhận lịch" / "Nhận việc". */
export const FEE_BLOCK_REASON = "Thanh toán phí của đơn trước để nhận đơn mới."

/** Where the card is on a page, for a "Thanh toán phí" link. */
export const FEE_ANCHOR = "thanh-toan-phi"

/** The card that says so, with the transfer to make. Renders nothing when nothing is owed. */
export function FeeDueCard({ className }: { className?: string }) {
  const owed = useFeeOwed()
  if (!owed) return null
  return (
    <section id={FEE_ANCHOR} className={cn("scroll-mt-20 rounded-[var(--radius-lg)] border border-danger/30 bg-surface p-4", className)}>
      <h2 className="text-[17px] font-bold tracking-tight">Thanh toán phí {formatPrice(owed)} để nhận đơn tiếp</h2>
      <p className="mt-1 text-[14px] text-ink-soft">
        Phí dịch vụ 360dep của lịch hẹn đã xong được trừ vào ví. Khi ví còn âm, bạn chưa nhận được lịch mới hay việc mới;
        trả xong là nhận lại được ngay.
      </p>
      <WalletTopUp balance={-owed} className="mt-3" />
      <Link href="/studio/wallet" className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold text-accent underline-offset-4 hover:underline">
        Xem sổ ví
      </Link>
    </section>
  )
}
