import type { Metadata } from "next"
import Link from "next/link"
import { Info } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Card, EmptyState, PageHeader } from "@/components/ui"
import { earningsByMonth, walletSummary } from "@/lib/api/me"
import { POLICY } from "@/lib/pricing"
import { formatPrice } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Ví & thu nhập",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/** How far the wallet may go below zero before new jobs stop. */
const OVERDRAFT_LIMIT = -200_000

const KIND_LABEL: Record<string, string> = {
  topup: "Nạp ví",
  commission: "Hoa hồng job hoàn thành",
  adjustment: "Điều chỉnh",
  refund: "Hoàn lại",
  no_show_comp: "Bù phí di chuyển khi khách vắng mặt",
}

export default async function WalletPage() {
  const [wallet, months] = await Promise.all([walletSummary(), earningsByMonth()])
  const blocked = wallet.balance < OVERDRAFT_LIMIT

  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Ví & thu nhập" back="/studio" />
      <RequireSession role="pro">
        <Card className={blocked ? "p-4 ring-1 ring-danger/40" : "p-4"}>
          <p className="text-xs text-muted">Số dư ví</p>
          <p className={`mt-1 text-3xl font-semibold ${wallet.balance < 0 ? "text-danger" : ""}`}>
            {formatPrice(wallet.balance)}
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">
            Khách trả tiền trực tiếp cho bạn. Mỗi job hoàn thành trừ {Math.round(POLICY.commissionRate * 100)}% giá dịch
            vụ vào ví này.
          </p>
          {blocked && (
            <p className="mt-2 rounded-xl bg-danger-soft px-3 py-2 text-[13px] text-danger">
              Ví đã âm quá {formatPrice(Math.abs(OVERDRAFT_LIMIT))} nên bạn tạm không nhận được job mới. Nạp ví để tiếp
              tục.
            </p>
          )}
          <p className="mt-3 flex gap-2 text-xs text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Nạp ví bằng chuyển khoản VietQR <b className="text-ink">sắp áp dụng</b>. Hiện tại đội ngũ 360dep ghi nhận
              thủ công — nhắn cho chúng tôi khi bạn đã chuyển khoản.{" "}
              <Link href="/chinh-sach" className="text-accent underline underline-offset-2">
                Chính sách phí
              </Link>
            </span>
          </p>
        </Card>

        {months.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 font-semibold">Thu nhập theo tháng</h2>
            <ul className="space-y-2">
              {months.map((m) => (
                <li key={m.month}>
                  <Card className="flex flex-wrap items-center gap-3 p-3.5 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">Tháng {m.month.slice(5)}/{m.month.slice(0, 4)}</span>
                      <span className="block text-xs text-muted">
                        {m.jobs} job · khách trả {formatPrice(m.gross)} · hoa hồng {formatPrice(m.commission)}
                      </span>
                    </span>
                    <span className="font-semibold text-success">{formatPrice(m.net)}</span>
                  </Card>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              “Bạn nhận” là tiền khách trả trừ hoa hồng. Phí di chuyển và phí đặt gấp thuộc 100% về bạn.
            </p>
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-3 font-semibold">Sổ ví</h2>
          {wallet.entries.length === 0 ? (
            <EmptyState title="Chưa có giao dịch nào" text="Hoa hồng và lần nạp ví sẽ hiện ở đây." />
          ) : (
            <ul className="divide-y divide-line rounded-[var(--radius-card)] bg-surface">
              {wallet.entries.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block">{KIND_LABEL[e.kind] ?? e.kind}</span>
                    {e.note && <span className="block truncate text-xs text-muted">{e.note}</span>}
                  </span>
                  <span className={e.amount < 0 ? "font-medium text-danger" : "font-medium text-success"}>
                    {e.amount < 0 ? "−" : "+"}
                    {formatPrice(Math.abs(e.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </RequireSession>
    </div>
  )
}
