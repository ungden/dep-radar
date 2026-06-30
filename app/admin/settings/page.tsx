import Link from "next/link"
import { CheckCircle2, ExternalLink, Settings, ShieldCheck, XCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { getSiteUrl } from "@/lib/seo"
import { isSupabaseSchemaReady } from "@/lib/supabase"

export default function AdminSettingsPage() {
  const siteUrl = getSiteUrl()
  const rows = [
    { label: "Site URL", value: siteUrl, ok: true },
    { label: "GA4 measurement ID", value: process.env.NEXT_PUBLIC_GA_ID ? "Configured" : "Missing", ok: Boolean(process.env.NEXT_PUBLIC_GA_ID) },
    { label: "Supabase schema", value: isSupabaseSchemaReady ? "Configured" : "Fallback mode", ok: isSupabaseSchemaReady },
    { label: "robots.txt", value: "/admin/* disallowed", ok: true },
    { label: "Sitemap", value: `${siteUrl}/sitemap.xml`, ok: true },
    { label: "Shopee affiliate readiness", value: "Product/offers supported", ok: true },
    { label: "Editorial guard", value: "npm run check:editorial", ok: true },
    { label: "SEO guard", value: "npm run check:seo", ok: true },
  ]

  return (
    <div>
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Settings className="h-3.5 w-3.5" />
          Read-only config
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-50">System settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Bề mặt này chỉ hiển thị trạng thái cấu hình, không expose secrets và không cho chỉnh env trực tiếp trong app.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.label} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-50">{row.label}</div>
                    <div className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{row.value}</div>
                  </div>
                  {row.ok ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
          <CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-slate-900 dark:text-slate-50">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Deployment checklist
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <p>Admin pages export noindex metadata and robots blocks `/admin/`.</p>
              <p>GA only runs when `NEXT_PUBLIC_GA_ID` exists and skips admin routes.</p>
              <p>Affiliate links are tracked as public events without user identity, email, review text or private admin fields.</p>
              <Link href="/admin/seo" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
                Open SEO audit
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
