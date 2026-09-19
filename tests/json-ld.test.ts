import { describe, expect, it } from "vitest"
import { serializeJsonLd } from "@/lib/json-ld"

describe("serializeJsonLd", () => {
  it("cannot be terminated by profile or review content", () => {
    const output = serializeJsonLd({ review: "</script><script>alert(1)</script>" })
    expect(output).not.toContain("</script>")
    expect(JSON.parse(output)).toEqual({ review: "</script><script>alert(1)</script>" })
  })
})
