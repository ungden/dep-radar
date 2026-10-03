"use client"

import * as React from "react"
import Link from "next/link"
import { fetchPartnerSetup } from "@/lib/api/actions"
import { partnerProgress, type PartnerSetup } from "@/lib/partner"
import { useApp } from "@/lib/store"
import { Card } from "@/components/ui"

export function PartnerProgress() {
  const state = useApp()
  const [setup, setSetup] = React.useState<PartnerSetup | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    let live = true
    void fetchPartnerSetup().then((data) => { if (live) { setSetup(data); setError(null) } }).catch((e: Error) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [state.session?.proId, state.myServices, state.works])
  if (error) return <p role="alert" className="mb-4 text-sm text-danger">{error}</p>
  if (!setup?.profile) return null
  const steps = partnerProgress(setup)
  const next = steps.find((s) => !s.done)
  return (
    <Card className="mb-5 p-4">
      <p className="font-semibold">{setup.profile.published ? "Quản lý hồ sơ đối tác" : "Hoàn thiện hồ sơ đối tác"}</p>
      <p className="mt-1 text-xs text-muted">{steps.filter((s) => s.done).length}/{steps.length} bước · Mỗi bước được lưu để tiếp tục sau.</p>
      <ol className="mt-3 flex flex-wrap gap-2">
        {steps.map((s, i) => <li key={s.label}><Link href={s.href} aria-current={s === next ? "step" : undefined} className={`inline-flex min-h-10 items-center rounded-full border px-3 text-xs ${s.done ? "border-success/30 bg-success/5 text-success" : s === next ? "border-accent text-accent" : "border-line text-muted"}`}>{s.done ? "✓" : i + 1} {s.label}</Link></li>)}
      </ol>
      {setup.profile.review_status === "pending" && <p className="mt-2 text-sm text-ink-soft">Hồ sơ đang chờ duyệt. Bạn sẽ nhận thông báo khi có kết quả.</p>}
      {setup.profile.review_note && <p className="mt-2 whitespace-pre-line text-sm text-warning">{setup.profile.review_note}</p>}
    </Card>
  )
}
