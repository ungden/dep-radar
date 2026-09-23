import { describe, expect, it } from "vitest"
import { aggregateRatingFor, serializeJsonLd } from "@/lib/json-ld"

describe("serializeJsonLd", () => {
  it("cannot be terminated by profile or review content", () => {
    const output = serializeJsonLd({ review: "</script><script>alert(1)</script>" })
    expect(output).not.toContain("</script>")
    expect(JSON.parse(output)).toEqual({ review: "</script><script>alert(1)</script>" })
  })
})

describe("aggregateRatingFor", () => {
  it("gives search engines no average under three reviews, as the page shows none", () => {
    expect(aggregateRatingFor({ average: 0, count: 0 })).toBeUndefined()
    expect(aggregateRatingFor({ average: 5, count: 1 })).toBeUndefined()
    expect(aggregateRatingFor({ average: 4.5, count: 2 })).toBeUndefined()
  })

  it("gives the real average from three reviews on", () => {
    expect(aggregateRatingFor({ average: 4.666, count: 3 })).toEqual({
      "@type": "AggregateRating",
      ratingValue: "4.67",
      reviewCount: 3,
      bestRating: 5,
      worstRating: 1,
    })
  })

  it("never rates sample data", () => {
    expect(aggregateRatingFor({ average: 4.9, count: 120 }, true)).toBeUndefined()
  })
})
