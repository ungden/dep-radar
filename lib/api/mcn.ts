"use server"

import { revalidatePath } from "next/cache"
import { backendEnabled } from "@/lib/supabase/env"
import { supabaseServer } from "@/lib/supabase/server"
import type { ActionResult } from "./actions"
import { messageFor } from "./errors"
import type { McnApplication, McnStatus, McnWorkspace } from "@/lib/mcn-types"

const unavailable = (error: string): McnWorkspace => ({ available: false, error, isAdmin: false, isPro: false, organizations: [], memberships: [], commissions: [], payouts: [] })

export async function getMcnWorkspace(): Promise<McnWorkspace> {
  if (!backendEnabled) return unavailable("Kết nối dữ liệu MCN chưa được cấu hình.")
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc("mcn_workspace" as never, {} as never)
  if (error) return unavailable(error.code === "PGRST202" || error.code === "42883" ? "Hệ thống MCN đang được cập nhật. Vui lòng quay lại sau." : messageFor(error))
  return data as unknown as McnWorkspace
}

async function command(action: string, input: Record<string, unknown>): Promise<ActionResult<string | null>> {
  if (!backendEnabled) return { ok: false, error: "Kết nối dữ liệu MCN chưa được cấu hình." }
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc("mcn_command" as never, { p_action: action, p_input: input } as never)
  if (error) return { ok: false, error: messageFor(error) }
  for (const path of ["/mcn", "/mcn/dashboard", "/studio/network", "/admin/mcn"]) revalidatePath(path)
  return { ok: true, data: data as unknown as string | null }
}

export async function applyMcn(input: McnApplication) { return command("apply", { ...input }) }
export async function reviewMcn(organizationId: string, status: Exclude<McnStatus, "pending">, note: string) { return command("review", { organizationId, status, note }) }
export async function inviteMcnPro(organizationId: string, proSlug: string) { return command("invite", { organizationId, proSlug }) }
export async function respondMcnInvitation(membershipId: string, accept: boolean) { return command("respond", { membershipId, accept }) }
export async function leaveMcn(membershipId: string) { return command("leave", { membershipId }) }
export async function removeMcnPro(membershipId: string) { return command("remove", { membershipId }) }
export async function saveMcnSupport(membershipId: string, supportNote: string, nextFollowUp: string | null) { return command("support", { membershipId, supportNote, nextFollowUp }) }
export async function recordMcnPayout(organizationId: string, commissionIds: string[], bankReference: string, note: string, expectedAmount: number) { return command("payout", { organizationId, commissionIds, bankReference, note, expectedAmount }) }
export async function reverseMcnCommission(commissionId: string, reason: string) { return command("reverse", { commissionId, reason }) }
