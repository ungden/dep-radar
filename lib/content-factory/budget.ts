import "server-only"

import { getSupabaseAdmin } from "@/lib/evidence-radar/server"
import type { BudgetStatus } from "@/lib/content-factory/types"

type BudgetConfig = {
  monthly_limit_usd: number
  ai_text_limit_usd: number
  collection_limit_usd: number
  image_limit_usd: number
  reserve_limit_usd: number
  warning_ratio: number
}

const DEFAULT_CONFIG: BudgetConfig = {
  monthly_limit_usd: 25,
  ai_text_limit_usd: 12,
  collection_limit_usd: 8,
  image_limit_usd: 2,
  reserve_limit_usd: 3,
  warning_ratio: 0.8,
}

export async function getBudgetStatus(now = new Date()): Promise<BudgetStatus> {
  const supabase = getSupabaseAdmin()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const [configResult, contentResult, collectionResult] = await Promise.all([
    supabase.from("content_budget_config").select("*").eq("id", true).maybeSingle(),
    supabase.from("content_runs").select("cost_category,actual_cost_usd").gte("started_at", monthStart).eq("status", "completed"),
    supabase.from("evidence_radar_runs").select("estimated_cost_usd").gte("started_at", monthStart).in("status", ["completed", "partial"]),
  ])

  const config = (configResult.data as BudgetConfig | null) ?? DEFAULT_CONFIG
  const categorySpend = { ai_text: 0, collection: 0, image: 0, reserve: 0 }
  for (const row of contentResult.data ?? []) {
    const category = row.cost_category as keyof typeof categorySpend
    if (category in categorySpend) categorySpend[category] += Number(row.actual_cost_usd ?? 0)
  }
  categorySpend.collection += (collectionResult.data ?? []).reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0)

  const spentUsd = Object.values(categorySpend).reduce((sum, value) => sum + value, 0)
  const monthlyLimitUsd = Number(config.monthly_limit_usd)
  const warningRatio = Number(config.warning_ratio)
  const ratio = monthlyLimitUsd > 0 ? spentUsd / monthlyLimitUsd : 1

  return {
    monthlyLimitUsd,
    warningRatio,
    spentUsd,
    ratio,
    categorySpend,
    stopNewPaidWork: ratio >= warningRatio || categorySpend.ai_text >= Number(config.ai_text_limit_usd),
    stopAllPaidWork: ratio >= 1,
  }
}
