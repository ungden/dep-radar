"use client"

import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * Who runs the site, as a trading website has to say: company name, tax code,
 * head office and how to reach it. Read from platform_settings (the admin desk's
 * Cấu hình tab), so a new address is a form edit, not a deploy. A field that is
 * not filled in is simply not shown.
 */
export function CompanyInfo({ className }: { className?: string }) {
  const { platform: p } = useApp()
  if (!p.companyName) return null
  const contact = [p.supportZalo && `Zalo ${p.supportZalo}`, p.supportEmail].filter(Boolean).join(" · ")
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="font-semibold text-ink-soft">{p.companyName}</p>
      {p.companyTaxId && <p>Mã số thuế / mã số doanh nghiệp: {p.companyTaxId}</p>}
      {p.companyAddress && <p>Trụ sở: {p.companyAddress}</p>}
      {contact && <p>Hỗ trợ: {contact}</p>}
    </div>
  )
}
