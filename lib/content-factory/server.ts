import "server-only"

import { getSupabaseAdmin } from "@/lib/evidence-radar/server"

export type ContentQueueMessage = { job_id: string; idempotency_key: string; enqueued_at: string }

export async function sendContentJob(jobId: string, idempotencyKey: string) {
  const { data, error } = await getSupabaseAdmin().rpc("content_factory_queue_send", {
    job_id: jobId,
    idempotency_key: idempotencyKey,
  })
  if (error) throw new Error(`Content queue send failed: ${error.message}`)
  return Number(data)
}

export async function readContentJobs(count = 1, visibilitySeconds = 600) {
  const { data, error } = await getSupabaseAdmin().rpc("content_factory_queue_read", {
    visibility_seconds: visibilitySeconds,
    message_count: count,
  })
  if (error) throw new Error(`Content queue read failed: ${error.message}`)
  return (data ?? []) as Array<{
    msg_id: number
    read_ct: number
    enqueued_at: string
    vt: string
    message: ContentQueueMessage
  }>
}

export async function deleteContentJobMessage(messageId: number) {
  const { error } = await getSupabaseAdmin().rpc("content_factory_queue_delete", { message_id: messageId })
  if (error) throw new Error(`Content queue delete failed: ${error.message}`)
}
