import type { Metadata } from "next"
import { Suspense } from "react"
import { CompanyInfo } from "@/components/company-info"
import { PageHeader } from "@/components/ui"
import { absoluteUrl } from "@/lib/env"
import { HELP_ENTRIES } from "@/lib/help/knowledge"
import { serializeJsonLd } from "@/lib/json-ld"
import { HelpCenter } from "./help-center"

export const metadata: Metadata = {
  title: "Trợ giúp & an toàn",
  description:
    "Câu hỏi thường gặp của khách và đối tác 360đẹp: đặt lịch, giá, thanh toán, huỷ và đổi giờ, vắng mặt, giao file, đánh giá, an toàn, khiếu nại. Có trợ lý trả lời theo quy định hiện hành.",
  alternates: { canonical: "/tro-giup" },
}

/**
 * The help centre. Its content is lib/help/knowledge.ts, the same entries the
 * help assistant answers from; this page only lays them out.
 */
export default function HelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl("/tro-giup"),
    mainEntity: HELP_ENTRIES.map((e) => ({
      "@type": "Question",
      name: e.q,
      acceptedAnswer: { "@type": "Answer", text: e.a },
    })),
  }

  return (
    <div className="mx-auto max-w-2xl pb-16 md:pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <PageHeader title="Trợ giúp & an toàn" back />
      <Suspense>
        <HelpCenter />
      </Suspense>
      {/* The footer with these details is desktop-only; on a phone this is where they are. */}
      <CompanyInfo className="mt-6 text-xs text-muted" />
    </div>
  )
}
