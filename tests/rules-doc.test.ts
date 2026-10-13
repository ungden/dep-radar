import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { rulesDoc } from "@/lib/docs/rules-doc"

/**
 * docs/QUY_DINH_TRONG_APP.md is written from the code. When a rule changes
 * and the document is not rewritten, this fails in CI: run `npm run docs:rules`.
 */
describe("docs/QUY_DINH_TRONG_APP.md", () => {
  it("matches the rules in the code (run `npm run docs:rules`)", () => {
    expect(readFileSync("docs/QUY_DINH_TRONG_APP.md", "utf8")).toBe(rulesDoc())
  })
})
