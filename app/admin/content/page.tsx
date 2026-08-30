"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, CircleDollarSign, Clock3, Factory, ShieldCheck } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

type Job = {
  id: string
  job_type: string
  slot_type: string
  status: string
  risk_level: string
  scheduled_for: string
  deterministic_score: number | null
  verifier_score: number | null
  actual_cost_usd: number
  policy_reasons: string[]
  last_error: string | null
  posts: { title: string; slug: string } | null
}

type Run = { actual_cost_usd: number; cost_category: "ai_text" | "collection" | "image" | "reserve"; started_at: string; status: string }

const statusTone: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800",
  publishable: "bg-blue-100 text-blue-800",
  policy_blocked: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
}

export default function ContentOperationsPage() {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [runs, setRuns] = React.useState<Run[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    async function load() {
      const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()
      const [jobsResult, runsResult] = await Promise.all([
        supabase.from("content_jobs").select("*,posts(title,slug)").order("created_at", { ascending: false }).limit(50),
        supabase.from("content_runs").select("actual_cost_usd,cost_category,started_at,status").gte("started_at", monthStart),
      ])
      if (jobsResult.error || runsResult.error) setError(jobsResult.error?.message ?? runsResult.error?.message ?? "Không tải được dữ liệu")
      setJobs((jobsResult.data ?? []) as unknown as Job[])
      setRuns((runsResult.data ?? []) as Run[])
      setLoading(false)
    }
    load()
  }, [])

  const spend = runs.filter((run) => run.status === "completed").reduce((sum, run) => sum + Number(run.actual_cost_usd), 0)
  const blocked = jobs.filter((job) => job.status === "policy_blocked").length
  const active = jobs.filter((job) => ["queued", "researching", "drafting", "verifying", "asset_preparation"].includes(job.status)).length
  const published = jobs.filter((job) => job.status === "published").length
  const stats = [
    { label: "Đang xử lý", value: active, Icon: Clock3, tone: "text-blue-600" },
    { label: "Publishable/đã public", value: jobs.filter((job) => ["publishable", "published"].includes(job.status)).length, Icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Policy blocked", value: blocked, Icon: ShieldCheck, tone: "text-amber-600" },
    { label: "AI text tháng này", value: `$${spend.toFixed(4)} / $12`, Icon: CircleDollarSign, tone: "text-rose-600" },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <div className="flex items-center gap-3"><Factory className="h-6 w-6 text-rose-600" /><h1 className="text-2xl font-black text-slate-950 dark:text-white">Content Operations</h1></div>
        <p className="mt-1 text-sm text-slate-500">Queue, quality gate, policy block và chi phí Content Factory.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, Icon, tone }) => (
          <Card key={label} className="border-slate-200 shadow-sm dark:border-slate-800">
            <CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div><Icon className={`h-6 w-6 ${tone}`} /></CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader><CardTitle className="text-lg">50 job gần nhất</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-slate-500">Đang tải…</p> : error ? <div className="flex gap-2 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />{error}</div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wider text-slate-500"><tr><th className="py-3 pr-4">Bài/slot</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">QA / verifier</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Lý do</th><th className="pl-4 py-3">Lịch</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {jobs.map((job) => <tr key={job.id} className="align-top">
                    <td className="py-4 pr-4"><div className="font-bold">{job.posts?.title ?? job.id.slice(0, 8)}</div><div className="mt-1 text-xs text-slate-500">{job.job_type} · {job.slot_type}</div></td>
                    <td className="px-4 py-4 font-semibold">{job.risk_level}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone[job.status] ?? "bg-slate-100 text-slate-700"}`}>{job.status}</span></td>
                    <td className="px-4 py-4">{job.deterministic_score ?? "—"} / {job.verifier_score ?? "—"}</td>
                    <td className="px-4 py-4">${Number(job.actual_cost_usd).toFixed(4)}</td>
                    <td className="max-w-xs px-4 py-4 text-xs text-slate-600">{job.policy_reasons?.join(", ") || job.last_error || "—"}</td>
                    <td className="pl-4 py-4 text-xs text-slate-500">{new Date(job.scheduled_for).toLocaleString("vi-VN")}</td>
                  </tr>)}
                </tbody>
              </table>
              {jobs.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Chưa có job. Shadow cron sẽ tạo job ở các slot 08:00, 14:00 và 20:00.</p>}
            </div>
          )}
          <p className="mt-5 text-xs text-slate-500">Published: {published}. Collection/image budget được ghi riêng; bảng này chỉ cộng ledger Content Factory.</p>
        </CardContent>
      </Card>
    </div>
  )
}
