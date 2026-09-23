import type { Metadata } from "next"
import { PageHeader } from "@/components/ui"
import { referralOverview } from "@/lib/api/me"
import { backendEnabled } from "@/lib/supabase/env"
import { ReferralView } from "./referral-view"

export const metadata: Metadata = {
  title: "Giới thiệu bạn bè",
  description: "Giới thiệu bạn bè dùng 360dep: khi bạn bè dùng dịch vụ lần đầu, cả hai nhận ưu đãi.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/**
 * Giới thiệu bạn bè. The code and the rewards are read here, per visit; the
 * rules, the vouchers and whether the account may still enter a code come
 * from the snapshot every page already has.
 */
export default async function ReferralPage() {
  const { code, rewards } = backendEnabled ? await referralOverview() : { code: null, rewards: [] }
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Giới thiệu bạn bè" back />
      <ReferralView code={code} rewards={rewards} />
    </div>
  )
}
