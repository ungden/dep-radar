import { describe, expect, it } from "vitest"
import { getVariant } from "@/lib/catalog"
import { REQUEST_GOALS, requestGoalLabel, requestSelection, requestVariants } from "@/lib/request-goals"

describe("booking by goal", () => {
  it("links every quick goal to an actual bookable one-visit variant", () => {
    for (const goal of REQUEST_GOALS) {
      expect(getVariant(goal.templateId, goal.variantId)).toBeDefined()
      expect(requestSelection(goal.templateId, goal.variantId)?.variant.id).toBe(goal.variantId)
      expect(requestGoalLabel(goal, "en")).toBeTruthy()
    }
  })
  it("defaults bridal makeup to the wedding day and excludes two-visit packages", () => {
    const choice = requestSelection("makeup-bridal", "two")!
    expect(choice.variant.id).toBe("wedding")
    expect(requestVariants(choice.template).map((v) => v.id)).toContain("trial")
    expect(requestVariants(choice.template).map((v) => v.id)).not.toContain("two")
  })
})
