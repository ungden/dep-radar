import { CATALOG, CATEGORIES, getTemplate } from "./catalog"
import { IDENTITY_VERIFICATION_OPEN } from "./launch"
import { requestCopy, type RequestLocale } from "./request-copy"
import type { CategoryId, ServiceTemplate } from "./types"

export const REQUEST_GOALS = [
  { templateId: "makeup-bridal", variantId: "wedding", label: requestCopy.vi.bridal, labelKey: "bridal", icon: "sparkles" },
  { templateId: "nail-gel", variantId: "hand", label: requestCopy.vi.nails, labelKey: "nails", icon: "hand" },
  { templateId: "makeup-party", variantId: "makeup", label: requestCopy.vi.party, labelKey: "party", icon: "sparkles" },
] as const

export const requestGoalLabel = (goal: typeof REQUEST_GOALS[number], locale: RequestLocale = "vi") => requestCopy[locale][goal.labelKey]

export const requestVariants = (template: ServiceTemplate) => template.variants.filter((v) => (v.sessions ?? 1) === 1)
export const canRequestService = (t: ServiceTemplate) =>
  !t.addon && !t.studioOnly && (IDENTITY_VERIFICATION_OPEN || !t.category.startsWith("model-")) && requestVariants(t).length > 0
export const requestTemplates = (category: CategoryId) => CATALOG.filter((t) => t.category === category && canRequestService(t))
export const requestCategories = CATEGORIES.filter((c) => requestTemplates(c.id).length)
  .sort((a, b) => Number(b.id === "makeup") - Number(a.id === "makeup"))

export function requestSelection(templateId?: string | null, variantId?: string | null) {
  const t = templateId ? getTemplate(templateId) : undefined
  if (!t || !canRequestService(t)) return undefined
  const variants = requestVariants(t)
  const variant = variants.find((v) => v.id === variantId) ?? variants.find((v) => v.id === REQUEST_GOALS.find((g) => g.templateId === t.id)?.variantId) ?? variants[0]
  return { template: t, variant }
}
