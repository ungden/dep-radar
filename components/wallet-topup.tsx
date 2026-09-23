"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { supportHref } from "@/components/support-link"
import { Button } from "@/components/ui"
import { payMemo } from "@/lib/connection"
import { useApp } from "@/lib/store"
import { cn, formatPrice } from "@/lib/utils"

/**
 * The bank account 360dep takes fees and top-ups into.
 * Filled by the owner in platform_settings (see README "Vận hành"); until
 * then the card says top-ups are recorded by staff.
 */

const AMOUNTS = [200000, 500000, 1000000]

/**
 * What the transfer must say. The freelancer's pay code (pros.pay_code) is
 * what the bank webhook matches; before that migration, staff matched the slug
 * by hand.
 */
export function useTopupMemo(): string | null {
  const state = useApp()
  const code = state.myWallet?.payCode
  if (code) return payMemo(code)
  return null
}

/** How the money reaches the wallet, said as it is. */
export function useCreditNote(): string {
  const state = useApp()
  const auto = state.platform.bankLinked && Boolean(state.myWallet?.payCode)
  if (auto) return "Chuyển đúng nội dung là tiền tự vào ví khi ngân hàng báo có, không cần chờ ai."
  return "Hiện nhân viên 360dep đối chiếu sao kê rồi cộng vào ví bằng tay, trong giờ làm việc. Nhớ ghi đúng nội dung để tiền vào đúng ví."
}

export function WalletTopUp({ balance, className }: { balance: number; className?: string }) {
  const state = useApp()
  const memo = useTopupMemo()
  const note = useCreditNote()
  const bin = state.platform.topupBankBin ?? ""
  const account = state.platform.topupAccountNo ?? ""
  const accountName = state.platform.topupAccountName ?? ""
  // Enough to bring a negative wallet back to zero, rounded up to the next 50.000đ.
  const suggested = balance < 0 ? Math.ceil(-balance / 50000) * 50000 : AMOUNTS[0]
  const [amount, setAmount] = React.useState(suggested)
  const [copied, setCopied] = React.useState<string | null>(null)
  const support = supportHref(state.platform)

  if (!memo) return null

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
    } catch {
      setCopied(null)
    }
  }

  if (!bin || !account) {
    return (
      <div className={cn("mt-4 rounded-[var(--radius-md)] bg-subtle p-3.5 text-[13px] text-ink-soft", className)}>
        <p className="text-[15px] font-semibold text-ink">Nạp ví</p>
        <p className="mt-1">
          Hiện nạp ví do nhân viên 360dep ghi nhận bằng tay, chưa tự động.{" "}
          <a href={support.href} {...(support.external ? { target: "_blank", rel: "noreferrer" } : {})} className="text-accent underline underline-offset-2">
            Liên hệ hỗ trợ
          </a>{" "}
          để lấy số tài khoản. Khi chuyển khoản, ghi đúng nội dung này để tiền vào đúng ví của bạn:
        </p>
        <p className="mt-2 flex items-center gap-2 rounded-[var(--radius-sm)] bg-surface px-3 py-2 font-mono text-[15px] font-semibold text-ink">
          <span className="flex-1">{memo}</span>
          <CopyButton text={memo} label="Chép nội dung chuyển khoản" copied={copied} onCopy={copy} />
        </p>
      </div>
    )
  }

  const qr = `https://img.vietqr.io/image/${encodeURIComponent(bin)}-${encodeURIComponent(account)}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`

  return (
    <div className={cn("mt-4 rounded-[var(--radius-md)] bg-subtle p-3.5 text-[13px] text-ink-soft", className)}>
      <p className="text-[15px] font-semibold text-ink">Nạp ví bằng chuyển khoản</p>
      <p className="mt-1">Quét mã bằng app ngân hàng. {note}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[...new Set([suggested, ...AMOUNTS])].map((value) => (
          <Button key={value} size="sm" variant={amount === value ? "primary" : "outline"} onClick={() => setAmount(value)}>
            {formatPrice(value)}
          </Button>
        ))}
      </div>
      <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {/* A bank-transfer QR drawn by VietQR from the fields above. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt={`Mã VietQR chuyển ${formatPrice(amount)} tới ${accountName || account}, nội dung ${memo}`}
          width={220}
          height={220}
          className="size-[220px] rounded-[var(--radius-md)] bg-surface object-contain"
        />
        <dl className="w-full min-w-0 flex-1 space-y-1.5">
          <div>
            <dt className="text-xs text-muted">Số tài khoản</dt>
            <dd className="flex items-center gap-1 font-semibold text-ink">
              <span className="flex-1 break-all">{account}</span>
              <CopyButton text={account} label="Chép số tài khoản" copied={copied} onCopy={copy} />
            </dd>
          </div>
          {accountName && (
            <div>
              <dt className="text-xs text-muted">Chủ tài khoản</dt>
              <dd className="font-semibold text-ink">{accountName}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted">Nội dung (bắt buộc ghi đúng)</dt>
            <dd className="flex items-center gap-1 font-mono font-semibold text-ink">
              <span className="flex-1">{memo}</span>
              <CopyButton text={memo} label="Chép nội dung chuyển khoản" copied={copied} onCopy={copy} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function CopyButton({ text, label, copied, onCopy }: { text: string; label: string; copied: string | null; onCopy: (text: string) => Promise<void> }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => void onCopy(text)}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-subtle"
    >
      {copied === text ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
    </button>
  )
}
