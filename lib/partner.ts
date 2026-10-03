import type { CategoryId, ReviewStatus } from "./types"

export const PARTNER_STEPS = ["Nghề", "Dịch vụ & giá", "Nơi phục vụ", "Giờ làm", "Tác phẩm", "Gửi duyệt"] as const

export interface PartnerSetup {
  profile: {
    id: string; slug: string; display_name: string; title: string; bio: string;
    categories: CategoryId[]; city: string; district: string; home_service: boolean;
    studio_address: string | null; max_travel_km: number; equipment: string | null;
    avatar_path: string | null; hours_confirmed: boolean; terms_accepted_at: string | null;
    published: boolean; accepting_jobs: boolean; review_status: ReviewStatus;
    review_note: string | null; identity_status: string;
  } | null
  services: { template_id: string; active: boolean; prices: Record<string, number> }[]
  hours: { weekday: number; startMin: number; endMin: number }[]
  workCount: number
}

export function partnerProgress(setup: PartnerSetup): { label: string; done: boolean; href: string }[] {
  const p = setup.profile
  return [
    { label: PARTNER_STEPS[0], done: Boolean(p?.categories.length), href: "/studio/onboarding" },
    { label: PARTNER_STEPS[1], done: setup.services.some((s) => s.active && Object.keys(s.prices).length > 0), href: "/studio/services" },
    { label: PARTNER_STEPS[2], done: Boolean(p && (p.home_service || p.studio_address?.trim())), href: "/studio/profile/edit#noi-phuc-vu" },
    { label: PARTNER_STEPS[3], done: Boolean(p?.hours_confirmed && setup.hours.length), href: "/studio/profile/edit#gio-lam" },
    { label: PARTNER_STEPS[4], done: setup.workCount > 0, href: "/studio/works" },
    { label: PARTNER_STEPS[5], done: p?.review_status === "approved", href: "/studio/profile/edit#mo-ho-so" },
  ]
}
