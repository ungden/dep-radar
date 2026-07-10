import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error("Evidence Radar requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return adminClient
}

export function assertCronSecret(authorization: string | null) {
  const secret = process.env.EVIDENCE_RADAR_CRON_SECRET || process.env.CRON_SECRET
  if (!secret || authorization !== `Bearer ${secret}`) {
    throw new Error("Unauthorized")
  }
}

export async function readQueue<T>(queueName: string, count: number, visibilitySeconds = 300) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc("evidence_radar_queue_read", {
    queue_name: queueName,
    visibility_seconds: visibilitySeconds,
    message_count: count,
  })
  if (error) throw new Error(`Queue ${queueName} read failed: ${error.message}`)
  return (data ?? []) as Array<{
    msg_id: number
    read_ct: number
    enqueued_at: string
    vt: string
    message: T
  }>
}

export async function deleteQueueMessage(queueName: string, messageId: number) {
  const { error } = await getSupabaseAdmin().rpc("evidence_radar_queue_delete", {
    queue_name: queueName,
    message_id: messageId,
  })
  if (error) throw new Error(`Queue ${queueName} delete failed: ${error.message}`)
}
