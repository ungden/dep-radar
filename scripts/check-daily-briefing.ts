import "./load-local-env"

import fs from "node:fs"

import { buildDailyBriefingSnapshot } from "../lib/daily-briefing-publisher"

async function main() {
  const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8")) as {
    crons?: { path?: string; schedule?: string }[]
  }
  const routeSource = fs.readFileSync("app/api/cron/content-factory/route.ts", "utf8")
  const dailyCron = vercelConfig.crons?.find((cron) => cron.path === "/api/cron/content-factory")
  const snapshot = await buildDailyBriefingSnapshot(new Date("2026-06-30T07:00:00.000Z"))
  const errors = [
    !dailyCron ? "Missing /api/cron/content-factory in vercel.json" : null,
    dailyCron?.schedule !== "15 * * * *" ? `Content Factory cron must run at minute 15 hourly, found ${dailyCron?.schedule ?? "none"}` : null,
    !routeSource.includes("assertCronSecret") ? "Content Factory route must verify CRON_SECRET" : null,
    !routeSource.includes("revalidatePath") ? "Content Factory route must revalidate published public surfaces" : null,
    !snapshot.quality.ok ? snapshot.quality.errors.join("; ") : null,
  ].filter((error): error is string => Boolean(error))

  console.log(JSON.stringify({
    cron: dailyCron,
    generatedAt: snapshot.generatedAt,
    runLabel: snapshot.runLabel,
    publishMode: snapshot.publishMode,
    autoPublishCrawlerOutput: snapshot.autoPublishCrawlerOutput,
    counts: snapshot.counts,
    leadStory: snapshot.leadStory?.href ?? null,
    revalidatePaths: snapshot.revalidatePaths,
    warnings: snapshot.quality.warnings,
  }, null, 2))

  if (errors.length > 0) {
    console.error("\nDaily briefing errors:")
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
