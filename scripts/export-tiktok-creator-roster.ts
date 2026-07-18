import fs from "node:fs"
import path from "node:path"

import { REAL_KOLS, parseFollowers } from "../lib/kols-data"

const outputPath = path.resolve(
  process.argv[2] ?? "artifacts/creator-roster/tiktok-accounts.json"
)

const explicitExclusions = new Map<string, string>([
  ["3", "wrong_tiktok_identity_duplicate_of_creator_10"],
  ["13", "salon_haircut_content_not_beauty_product_evidence"],
  ["16", "user_rejected_low_reach_and_invalid_profile"],
])

function normalizeHandle(handle: string) {
  return handle.trim().replace(/^@/, "").toLowerCase()
}

const handleOwners = new Map<string, string[]>()
for (const creator of REAL_KOLS) {
  for (const social of creator.socials ?? []) {
    if (social.platform.toLowerCase() !== "tiktok") continue
    const handle = normalizeHandle(social.handle)
    const owners = handleOwners.get(handle) ?? []
    owners.push(creator.id)
    handleOwners.set(handle, owners)
  }
}

const audit = REAL_KOLS.map((creator) => {
  const tiktok = (creator.socials ?? []).find(
    (social) => social.platform.toLowerCase() === "tiktok"
  )
  const handle = tiktok ? normalizeHandle(tiktok.handle) : null
  const issues: string[] = []
  if (!handle) issues.push("missing_tiktok")
  if (handle && (handleOwners.get(handle)?.length ?? 0) > 1) {
    issues.push(`duplicate_tiktok_handle:${handleOwners.get(handle)?.join(",")}`)
  }
  if (tiktok && parseFollowers(tiktok.followers) < 100_000) {
    issues.push("stored_tiktok_followers_below_100k")
  }
  const exclusion = explicitExclusions.get(creator.id)
  if (exclusion) issues.push(exclusion)

  return {
    creator_id: creator.id,
    name: creator.name,
    profile_url: handle ? `https://www.tiktok.com/@${handle}` : null,
    stored_followers: tiktok?.followers ?? null,
    categories: creator.categories,
    eligible_for_live_audit: Boolean(handle && !exclusion),
    issues,
  }
})

const accounts = audit
  .filter((row) => row.eligible_for_live_audit && row.profile_url)
  .map((row) => ({
    creator_id: row.creator_id,
    name: row.name,
    profile_url: row.profile_url as string,
  }))

const payload = {
  generated_at: new Date().toISOString(),
  source_count: audit.length,
  tiktok_count: audit.filter((row) => row.profile_url).length,
  live_audit_count: accounts.length,
  accounts,
  audit,
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
console.log(
  JSON.stringify({
    output: outputPath,
    source_count: payload.source_count,
    tiktok_count: payload.tiktok_count,
    live_audit_count: payload.live_audit_count,
  })
)
