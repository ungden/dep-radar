import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { colors } from "@/lib/design/tokens"

/**
 * The web reads colours from app/globals.css, the native app from
 * lib/design/tokens.ts. They must be the same colours, or the two products
 * slowly become two brands.
 */
const css = readFileSync("app/globals.css", "utf8")
const cssVar = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toUpperCase()
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

describe("design tokens", () => {
  for (const [name, value] of Object.entries(colors)) {
    if (typeof value !== "string") continue
    it(`--color-${kebab(name)} matches tokens.ts`, () => {
      expect(cssVar(kebab(name))).toBe(value.toUpperCase())
    })
  }
  for (const [name, value] of Object.entries(colors.vertical)) {
    it(`--color-${name} matches tokens.ts`, () => {
      expect(cssVar(name)).toBe(value.toUpperCase())
    })
  }
})
