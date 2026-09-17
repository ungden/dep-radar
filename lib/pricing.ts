import type { PriceQuote, TierId } from "./types"

/**
 * dep360 fee policy. Customers never pay a platform fee. dep360 earns a commission
 * on the service price, paid by the freelancer. Travel and urgent fees go 100% to the
 * freelancer to cover transport (e.g. booking a car).
 */
export const POLICY = {
  /** Freelancer must call the customer and accept within this window. */
  confirmWithinHours: 2,
  /** Share of an online payment kept for the freelancer on late cancellation. */
  lateCancelRate: 0.3,
  freeTravelKm: 5,
  travelFeePerKm: 5000,
  travelFeeCap: 100000,
  urgentWithinHours: 3,
  urgentFee: 50000,
  minLeadMinutes: 60,
  freeCancelHours: 12,
} as const

export const COMMISSION_RATE: Record<TierId, number> = {
  new: 0.2,
  standard: 0.18,
  pro: 0.15,
  top: 0.12,
}

const roundUp5k = (n: number) => Math.ceil(n / 5000) * 5000
const round1k = (n: number) => Math.round(n / 1000) * 1000

export function travelFeeFor(distanceKm: number | null) {
  if (distanceKm === null) return 0
  const extraKm = distanceKm - POLICY.freeTravelKm
  if (extraKm <= 0) return 0
  return Math.min(POLICY.travelFeeCap, roundUp5k(extraKm * POLICY.travelFeePerKm))
}

/** Hours between now and the booking start. */
export function hoursUntilStart(dateISO: string, time: string, now: Date = new Date()) {
  const [y, m, d] = dateISO.split("-").map(Number)
  const [h, min] = time.split(":").map(Number)
  return (new Date(y, m - 1, d, h, min).getTime() - now.getTime()) / 3600000
}

export function isUrgent(dateISO: string, time: string, now: Date = new Date()) {
  const hours = hoursUntilStart(dateISO, time, now)
  return hours >= 0 && hours < POLICY.urgentWithinHours
}

export function isTooSoon(dateISO: string, time: string, now: Date = new Date()) {
  return hoursUntilStart(dateISO, time, now) * 60 < POLICY.minLeadMinutes
}

export function buildQuote(input: {
  servicePrice: number
  atHome: boolean
  distanceKm: number | null
  urgent: boolean
  tier: TierId
}): PriceQuote {
  const travelFee = input.atHome ? travelFeeFor(input.distanceKm) : 0
  const urgentFee = input.urgent ? POLICY.urgentFee : 0
  const total = input.servicePrice + travelFee + urgentFee
  const commissionRate = COMMISSION_RATE[input.tier]
  const commission = round1k(input.servicePrice * commissionRate)
  return {
    servicePrice: input.servicePrice,
    distanceKm: input.atHome ? input.distanceKm : null,
    travelFee,
    urgentFee,
    total,
    commissionRate,
    commission,
    payout: total - commission,
  }
}
