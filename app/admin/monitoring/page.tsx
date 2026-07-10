"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Plus, Radar, RefreshCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { isEvidenceRadarSchemaReady, supabase } from "@/lib/supabase"
import type { CreatorAccount, CreatorAccountPriority, Kol } from "@/lib/types"

type AccountRow = CreatorAccount & { kols: { name: string } | null }
type RunRow = {
  id: string
  run_type: string
  provider: string | null
  status: string
  records_seen: number
  records_inserted: number
  records_failed: number
  started_at: string
  error_summary: string | null
}

const INTERVALS: Record<CreatorAccountPriority, number> = { a: 120, b: 360, c: 1440 }

export default function EvidenceRadarAdminPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [runs, setRuns] = useState<RunRow[]>([])
  const [kols, setKols] = useState<Pick<Kol, "id" | "name">[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ creator_id: "", platform: "TikTok", profile_url: "", priority_tier: "c" as CreatorAccountPriority })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!isEvidenceRadarSchemaReady) {
      setError("Evidence Radar chưa được provision trên Supabase. Apply migration và set NEXT_PUBLIC_EVIDENCE_RADAR_READY=true.")
      setLoading(false)
      return
    }
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setError("Hãy đăng nhập bằng tài khoản admin để xem nguồn theo dõi và lịch sử collector.")
      setLoading(false)
      return
    }
    const [accountsResult, runsResult, kolsResult] = await Promise.all([
      supabase.from("creator_accounts").select("*,kols(name)").order("priority_tier").order("next_poll_at"),
      supabase.from("evidence_radar_runs").select("id,run_type,provider,status,records_seen,records_inserted,records_failed,started_at,error_summary").order("started_at", { ascending: false }).limit(20),
      supabase.from("kols").select("id,name").order("name"),
    ])
    if (accountsResult.error) setError(accountsResult.error.message)
    else setAccounts((accountsResult.data ?? []) as AccountRow[])
    setRuns((runsResult.data ?? []) as RunRow[])
    setKols((kolsResult.data ?? []) as Pick<Kol, "id" | "name">[])
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const stats = useMemo(() => ({
    active: accounts.filter((account) => account.active).length,
    errors: accounts.filter((account) => account.last_error).length,
    due: accounts.filter((account) => account.active && new Date(account.next_poll_at) <= new Date()).length,
  }), [accounts])

  async function addAccount() {
    if (!isEvidenceRadarSchemaReady || !form.creator_id || !form.profile_url) return
    setError(null)
    const { error: insertError } = await supabase.from("creator_accounts").insert({
      ...form,
      crawl_interval_minutes: INTERVALS[form.priority_tier],
    })
    if (insertError) setError(insertError.message)
    else {
      setForm({ creator_id: "", platform: "TikTok", profile_url: "", priority_tier: "c" })
      await loadData()
    }
  }

  async function updateAccount(account: AccountRow, changes: Partial<CreatorAccount>) {
    const payload = { ...changes, updated_at: new Date().toISOString() }
    if (changes.priority_tier) payload.crawl_interval_minutes = INTERVALS[changes.priority_tier]
    const { error: updateError } = await supabase.from("creator_accounts").update(payload).eq("id", account.id)
    if (updateError) setError(updateError.message)
    else setAccounts((items) => items.map((item) => item.id === account.id ? { ...item, ...payload } : item))
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-slate-50"><Radar className="h-6 w-6 text-rose-500" /> Evidence Radar</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Theo dõi nguồn public, freshness, lỗi provider và các lần chạy collector.</p>
          </div>
          <Button variant="outline" onClick={loadData} className="gap-2"><RefreshCcw className="h-4 w-4" /> Làm mới</Button>
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Tài khoản active" value={stats.active} tone="emerald" />
          <Metric label="Đang tới hạn" value={stats.due} tone="amber" />
          <Metric label="Có lỗi gần nhất" value={stats.errors} tone="rose" />
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Plus className="h-5 w-5 text-rose-500" /> Thêm tài khoản public</h2>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_160px_2fr_120px_auto] lg:items-end">
              <Field label="KOL/KOC">
                <Select value={form.creator_id} onChange={(event) => setForm((value) => ({ ...value, creator_id: event.target.value }))}>
                  <option value="">Chọn creator</option>
                  {kols.map((kol) => <option key={kol.id} value={kol.id}>{kol.name}</option>)}
                </Select>
              </Field>
              <Field label="Platform">
                <Select value={form.platform} onChange={(event) => setForm((value) => ({ ...value, platform: event.target.value }))}>
                  {['TikTok', 'Instagram', 'Youtube', 'Facebook'].map((platform) => <option key={platform}>{platform}</option>)}
                </Select>
              </Field>
              <Field label="Profile URL"><Input value={form.profile_url} onChange={(event) => setForm((value) => ({ ...value, profile_url: event.target.value }))} placeholder="https://..." /></Field>
              <Field label="Tier">
                <Select value={form.priority_tier} onChange={(event) => setForm((value) => ({ ...value, priority_tier: event.target.value as CreatorAccountPriority }))}>
                  <option value="a">A · 2h</option><option value="b">B · 6h</option><option value="c">C · 24h</option>
                </Select>
              </Field>
              <Button onClick={addAccount} disabled={!isEvidenceRadarSchemaReady || !form.creator_id || !form.profile_url}>Thêm</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
          <Card className="border-none shadow-sm"><CardContent className="p-6">
            <h2 className="mb-4 text-lg font-bold">Creator accounts</h2>
            <div className="space-y-3">
              {loading ? <p className="text-slate-400">Đang tải...</p> : accounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><strong>{account.kols?.name ?? account.creator_id}</strong><Badge variant="secondary">{account.platform}</Badge>{account.last_error ? <AlertTriangle className="h-4 w-4 text-rose-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}</div>
                      <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-sm text-slate-500 hover:text-rose-600">{account.profile_url}</a>
                      <p className="mt-1 text-xs text-slate-400">Lần cuối: {formatTime(account.last_polled_at)} · Kế tiếp: {formatTime(account.next_poll_at)}</p>
                      {account.last_error && <p className="mt-2 line-clamp-2 text-xs text-rose-600">{account.last_error}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={account.priority_tier} onChange={(event) => updateAccount(account, { priority_tier: event.target.value as CreatorAccountPriority })} className="w-24"><option value="a">A · 2h</option><option value="b">B · 6h</option><option value="c">C · 24h</option></Select>
                      <Button variant="outline" size="sm" onClick={() => updateAccount(account, { active: !account.active })}>{account.active ? "Pause" : "Bật"}</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>

          <Card className="border-none shadow-sm"><CardContent className="p-6">
            <h2 className="mb-4 text-lg font-bold">20 lần chạy gần nhất</h2>
            <div className="space-y-3">
              {runs.map((run) => <div key={run.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950"><div className="flex items-center justify-between gap-3"><strong>{run.run_type}</strong><Badge variant="secondary">{run.status}</Badge></div><p className="mt-1 text-xs text-slate-500">{run.provider ?? 'internal'} · {run.records_inserted}/{run.records_seen} record · {formatTime(run.started_at)}</p>{run.error_summary && <p className="mt-1 line-clamp-2 text-xs text-rose-600">{run.error_summary}</p>}</div>)}
              {!loading && runs.length === 0 && <p className="text-sm text-slate-500">Chưa có lần chạy.</p>}
            </div>
          </CardContent></Card>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "rose" }) {
  const colors = { emerald: "text-emerald-700 dark:text-emerald-300", amber: "text-amber-700 dark:text-amber-300", rose: "text-rose-700 dark:text-rose-300" }
  return <Card className="border-none shadow-sm"><CardContent className="p-5"><div className="text-sm font-semibold text-slate-500">{label}</div><div className={`mt-2 text-3xl font-black ${colors[tone]}`}>{value}</div></CardContent></Card>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

function formatTime(value: string | null) {
  if (!value) return "chưa chạy"
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}
