/** MCN allocates part of the existing fee. It never changes the KTV's payout. */
export const MCN_POLICY = {
  feeShareRate: 0.2,
  holdDays: 7,
  minimumPayout: 100000,
  invitationDays: 7,
} as const

/** Integer VND, after the platform commission has already been rounded. */
export function splitMcnCommission(commission: number) {
  if (!Number.isSafeInteger(commission) || commission < 0) throw new RangeError("Commission must be a nonnegative integer in VND")
  const mcn = Math.round(commission * MCN_POLICY.feeShareRate)
  return { mcn, platform: commission - mcn }
}
