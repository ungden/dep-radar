import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { manageBookingMoney } from "@/lib/api/marketplace-money"
import { MoneyDesk } from "./money-desk"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Thu và chi lịch hẹn", robots: { index: false, follow: false } }

export default async function MoneyPage() {
  const r = await manageBookingMoney("read")
  if (!r.ok) notFound()
  return <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 md:px-8">
    <header>
      <Link href="/admin?tab=finance" className="inline-flex min-h-11 items-center text-meta font-semibold text-accent-dark">← Tài chính</Link>
      <h1 className="text-[30px] font-bold">Thu và chi lịch hẹn</h1>
      <p className="text-ink-soft">QR thu tiền khách qua SePay. Khoản hoàn và khoản chi được nhân viên đối soát với giao dịch ngân hàng.</p>
    </header>
    <MoneyDesk initial={r.data} />
  </main>
}
