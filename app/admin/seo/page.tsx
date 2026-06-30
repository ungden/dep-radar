import Link from "next/link"
import { AlertCircle, CheckCircle2, Info, SearchCheck, Sparkles, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { buildSeoAuditReport, type SeoAuditIssue, type SeoAuditSeverity } from "@/lib/seo-audit"

const severityMeta: Record<SeoAuditSeverity, { label: string; icon: typeof XCircle; className: string }> = {
  error: { label: "Cần sửa", icon: XCircle, className: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300" },
  warning: { label: "Nên cải thiện", icon: AlertCircle, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" },
  info: { label: "Thông tin", icon: Info, className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
}

export default async function AdminSeoPage() {
  const report = await buildSeoAuditReport()
  const grouped = groupIssues(report.issues)

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <SearchCheck className="h-3.5 w-3.5" />
            SEO / AI QA
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-50">SEO readiness audit</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Kiểm tra crawlability, metadata, sitemap, structured data, content freshness và các tín hiệu AI-friendly từ dữ liệu public hiện có.
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Generated: {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt))}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Errors" value={report.summary.errors} tone="rose" />
        <StatCard label="Warnings" value={report.summary.warnings} tone="amber" />
        <StatCard label="Sitemap URLs" value={report.summary.sitemapUrls} tone="blue" />
        <StatCard label="Public pages" value={report.summary.publicPages} tone="emerald" />
        <StatCard label="GA4" value={report.summary.gaConfigured ? "Ready" : "No ID"} tone={report.summary.gaConfigured ? "emerald" : "slate"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          {(["error", "warning", "info"] as SeoAuditSeverity[]).map((severity) => (
            <IssuePanel key={severity} severity={severity} issues={grouped[severity] ?? []} />
          ))}
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                <Sparkles className="h-5 w-5 text-cyan-500" />
                Daily planner
              </h2>
              <div className="space-y-3">
                {report.sections.dailyEditorialCandidates.slice(0, 6).map((candidate) => (
                  <Link key={candidate.slug} href={`/blog/${candidate.slug}`} className="block rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <div className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-50">{candidate.title}</div>
                      <Badge variant="secondary" className="shrink-0 text-[11px]">
                        {candidate.score}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">{candidate.reason}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Content graph coverage
              </h2>
              <div className="space-y-3">
                {report.sections.contentGraphCoverage
                  .filter((hub) => hub.posts > 0)
                  .sort((a, b) => a.coverageScore - b.coverageScore || b.posts - a.posts)
                  .slice(0, 8)
                  .map((hub) => (
                    <Link key={hub.hubSlug} href={`/catalogue/${hub.hubSlug}`} className="block rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <div className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-50">{hub.hubTitle}</div>
                        <Badge variant="secondary" className="shrink-0 text-[11px]">
                          {hub.coverageScore}%
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {hub.posts} bài, {hub.matrixNodes} matrix nodes, {hub.postsWithNextReads} bài có next-read
                      </p>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                <Sparkles className="h-5 w-5 text-cyan-500" />
                AI-friendly gaps
              </h2>
              <div className="space-y-3">
                {report.sections.postsMissingAiSignals.slice(0, 8).map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="block rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800">
                    <div className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-50">{post.title}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.missing.map((item) => (
                        <Badge key={item} variant="secondary" className="text-[11px]">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-slate-50">Ops follow-up</h2>
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <Row label="KOL stale/no timeline" value={report.sections.staleKols.length} />
                <Row label="Products missing offers" value={report.sections.productsMissingOffers.length} />
                <Row label="Posts audited" value={report.summary.posts} />
                <Row label="Products audited" value={report.summary.products} />
                <Row label="KOL profiles audited" value={report.summary.kols} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function IssuePanel({ severity, issues }: { severity: SeoAuditSeverity; issues: SeoAuditIssue[] }) {
  const meta = severityMeta[severity]
  const Icon = meta.icon

  return (
    <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900 dark:text-slate-50">
            <Icon className="h-5 w-5" />
            {meta.label}
          </h2>
          <Badge className={meta.className}>{issues.length}</Badge>
        </div>
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Không có issue ở mức này.
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div key={`${issue.area}-${issue.title}-${index}`} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                    {issue.area}
                  </Badge>
                  <div className="font-bold text-slate-900 dark:text-slate-50">{issue.title}</div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{issue.detail}</p>
                {issue.href && (
                  <Link href={issue.href} className="mt-3 inline-flex text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-300">
                    Mở trang
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: "rose" | "amber" | "blue" | "emerald" | "slate" }) {
  const toneClass = {
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  }[tone]

  return (
    <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
      <CardContent className="p-5">
        <div className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${toneClass}`}>{label}</div>
        <div className="text-3xl font-black text-slate-900 dark:text-slate-50">{value}</div>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="font-bold text-slate-900 dark:text-slate-50">{value}</span>
    </div>
  )
}

function groupIssues(issues: SeoAuditIssue[]) {
  return issues.reduce<Record<SeoAuditSeverity, SeoAuditIssue[]>>(
    (groups, issue) => {
      groups[issue.severity].push(issue)
      return groups
    },
    { error: [], warning: [], info: [] }
  )
}
