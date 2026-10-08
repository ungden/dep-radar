"use client"

import { PayoutForm } from "@/components/payout"
import { RequireSession } from "@/components/require-session"
import { PageHeader } from "@/components/ui"
import { useApp } from "@/lib/store"

export default function PayoutPage() {
  return (
    <div className="mx-auto max-w-xl md:pt-4">
      <PageHeader title="Nhận tiền & mã QR" back="/studio" />
      <RequireSession role="pro">
        <Form />
      </RequireSession>
    </div>
  )
}

function Form() {
  const { session } = useApp()
  return <PayoutForm proId={session!.proId!} />
}
