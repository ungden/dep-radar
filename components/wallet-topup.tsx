"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui"
import { useApp } from "@/lib/store"
import { formatPrice } from "@/lib/utils"

/**
 * The bank account 360dep takes top-ups into.
 * Filled by the owner in platform_settings (see README "Vận hành"); until
 * then the card says top-ups are recorded by staff.
 */

const AMOUNTS = [200000, 500000, 1000000]

/** What the transfer must say, so staff can match the money to the wallet. */
export const topupMemo = (slug: string) => `NAP ${slug}`

export function WalletTopUp({ balance }: { balance: number }) {
  const state = useApp()
  const slug = state.session?.proId
  const bin = state.platform.topupBankBin ?? ""
  const account = state.platform.topupAccountNo ?? ""
  const accountName = state.platform.topupAccountName ?? ""
  // Enough to bring a negative wallet back to zero, rounded up to the next 50.000đ.
  const suggested = balance < 0 ? Math.ceil(-balance / 50000) * 50000 : AMOUNTS[0]
  const [amount, setAmount] = React.useState(suggested)
  const [copied, setCopied] = React.useState<string | null>(null)

  if (!slug) return null
  const memo = topupMemo(slug)

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
      <div className="mt-4 rounded-[var(--radius-md)] bg-subtle p-3.5 text-[13px] text-ink-soft">
        <p className="text-[15px] font-semibold text-ink">Nạp ví</p>
        <p className="mt-1">
          Hiện nạp ví do nhân viên 360dep ghi nhận bằng tay, chưa tự động. Khi chuyển khoản cho 360dep, ghi đúng nội dung
          này để tiền vào đúng ví của bạn:
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
    <div className="mt-4 rounded-[var(--radius-md)] bg-subtle p-3.5 text-[13px] text-ink-soft">
      <p className="text-[15px] font-semibold text-ink">Nạp ví bằng chuyển khoản</p>
      <p className="mt-1">Quét mã bằng app ngân hàng. Nhân viên 360dep đối chiếu rồi cộng vào ví, chưa tự động ngay lập tức.</p>
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
