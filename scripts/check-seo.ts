import "./load-local-env"

import { buildSeoAuditReport } from "../lib/seo-audit"

async function main() {
  const report = await buildSeoAuditReport()
  const errors = report.issues.filter((issue) => issue.severity === "error")

  console.log(
    JSON.stringify(
      {
        generatedAt: report.generatedAt,
        siteUrl: report.siteUrl,
        summary: report.summary,
        errorCount: errors.length,
      },
      null,
      2
    )
  )

  if (errors.length > 0) {
    console.error("\nSEO errors:")
    for (const issue of errors) {
      console.error(`- [${issue.area}] ${issue.title}: ${issue.detail}${issue.href ? ` (${issue.href})` : ""}`)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
