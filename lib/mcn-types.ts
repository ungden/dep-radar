/** MCN reads are explicit projections; customer addresses, chat and KYC never leave the database. */
export type McnStatus = "pending" | "approved" | "rejected" | "suspended"
export type McnMemberStatus = "invited" | "active" | "declined" | "left" | "removed" | "expired"
export interface McnOrganization {
  id: string
  name: string
  legalName: string
  taxId: string
  contactPhone: string
  city: string
  description: string
  status: McnStatus
  reviewNote: string | null
  createdAt: string
  isOwner: boolean
  bankName: string | null
  bankAccount: string | null
  bankHolder: string | null
}
export interface McnMembership {
  id: string
  organizationId: string
  organizationName: string
  proId: string
  proSlug: string
  proName: string
  city: string
  status: McnMemberStatus
  invitedAt: string
  expiresAt: string
  joinedAt: string | null
  endedAt: string | null
  supportNote: string
  nextFollowUp: string | null
  published: boolean
  acceptingJobs: boolean
  completedJobs: number
  rating: number
  isMine: boolean
}
export interface McnCommission {
  id: string
  organizationId: string
  organizationName: string
  bookingCode: string
  proName: string
  servicePrice: number
  commission: number
  amount: number
  platformAmount: number
  completedAt: string
  availableAt: string
  status: "held" | "paid" | "void" | "reversed"
  eligible: boolean
  holdReason: string | null
  payoutId: string | null
  paidAt: string | null
  adjustmentReason: string | null
  recoveredAt: string | null
}
export interface McnPayout {
  id: string
  organizationId: string
  amount: number
  grossAmount: number
  recoveryAmount: number
  bankReference: string
  paidAt: string
  note: string
}
export interface McnWorkspace {
  policy?: import("./mcn-admin-types").McnPolicy
  available: boolean
  error: string | null
  isAdmin: boolean
  isPro: boolean
  organizations: McnOrganization[]
  memberships: McnMembership[]
  commissions: McnCommission[]
  payouts: McnPayout[]
}
export interface McnApplication {
  name: string
  legalName: string
  taxId: string
  contactPhone: string
  city: string
  description: string
  bankName: string
  bankAccount: string
  bankHolder: string
}
