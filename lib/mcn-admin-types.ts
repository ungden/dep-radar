export interface McnPolicy {
  feeShareRate: number;
  holdDays: number;
  minimumPayout: number;
  effectiveAt?: string;
}
export interface McnNetworkStats {
  id: string;
  name: string;
  status: string;
  active: number;
  invited: number;
  joined: number;
  activated: number;
  working: number;
  created: number;
  cancelled: number;
  no_shows: number;
  reported: number;
  completed: number;
  revenue: number;
  fee: number;
  earned: number;
  paid: number;
  eligible: number;
  held: number;
  recovery: number;
}
export interface McnEvent {
  id: number;
  organization_id: string | null;
  organization: string | null;
  actor: string;
  actor_id: string | null;
  action: string;
  target_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}
export interface McnPolicyHistory {
  id: string;
  effective_at: string;
  share_rate: number;
  hold_days: number;
  minimum_payout: number;
  reason: string;
  created_by: string | null;
  created_at: string;
  cancelled_at: string | null;
}
export interface McnAdminReport {
  networks: McnNetworkStats[];
  daily: {
    day: string;
    completed: number;
    revenue: number;
    fee: number;
    earned: number;
  }[];
  events: McnEvent[];
  policy: McnPolicy;
  policies: McnPolicyHistory[];
}
