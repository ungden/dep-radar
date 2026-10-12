import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils"
import { buttonClass } from "@/components/ui"

describe("semantic typography", () => {
  it("keeps button text white alongside the body size", () => {
    expect(buttonClass()).toContain("text-white")
    expect(buttonClass()).toContain("text-body")
  })
  it("merges font sizes separately from text colours", () => {
    expect(cn("text-meta text-white", "text-body")).toBe("text-white text-body")
    expect(cn("text-body text-muted", "text-accent-dark")).toBe("text-body text-accent-dark")
    expect(cn("text-body", "text-lg")).toBe("text-lg")
  })
})
