import { describe, expect, it } from "vitest"
import {
  diversify,
  PRO_PER_PAGE,
  PRO_SPACING,
  rankFeed,
  scoreWork,
  supplyIsThin,
  type FeedContext,
} from "@/lib/feed"
import { bayesianRating } from "@/lib/trust"
import type { CategoryId, Pro, Work } from "@/lib/types"

const NOW = new Date("2026-09-23T10:00:00+07:00")
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86400000).toISOString()

function pro(id: string, over: Partial<Pro> = {}): Pro {
  return {
    id,
    uuid: id,
    name: id,
    title: "",
    phone: "",
    tone: "#eee",
    categories: ["nail"],
    city: "Hà Nội",
    district: "Cầu Giấy",
    areas: [],
    homeService: true,
    maxTravelKm: 10,
    yearsExp: 1,
    acceptingJobs: true,
    published: true,
    joinedAt: daysAgo(200),
    bio: "",
    highlights: [],
    identity: "none",
    stats: { completedJobs: 10, responseMinutes: 30 },
    rating: { average: 4.8, count: 10 },
    ...over,
  }
}

let n = 0
function work(proId: string, over: Partial<Work> = {}): Work {
  n++
  return {
    id: `w${n}`,
    dbId: `w${n}`,
    proId,
    templateId: "nail-gel",
    category: "nail",
    title: `w${n}`,
    description: "",
    images: ["/x.jpg"],
    kind: "work",
    createdAt: daysAgo(1),
    ...over,
  }
}

const ctx = (over: Partial<FeedContext> = {}): FeedContext => ({
  vertical: "all",
  interests: new Set(),
  followed: new Set(),
  distanceKm: () => null,
  stats: {},
  now: NOW,
  ...over,
})

describe("rankFeed", () => {
  it("latest is exactly the posting order", () => {
    const pros = [pro("a"), pro("b")]
    const old = work("a", { createdAt: daysAgo(5) })
    const mid = work("b", { createdAt: daysAgo(3) })
    const fresh = work("a", { createdAt: daysAgo(0) })
    expect(rankFeed([old, fresh, mid], pros, ctx(), "latest").map((w) => w.id)).toEqual([fresh.id, mid.id, old.id])
  })

  it("following only shows followed freelancers, newest first", () => {
    const pros = [pro("a"), pro("b")]
    const a1 = work("a", { createdAt: daysAgo(2) })
    const b1 = work("b", { createdAt: daysAgo(1) })
    const a2 = work("a", { createdAt: daysAgo(0) })
    const out = rankFeed([a1, b1, a2], pros, ctx({ followed: new Set(["a"]) }), "following")
    expect(out.map((w) => w.id)).toEqual([a2.id, a1.id])
  })

  it("filters by trade and hides unpublished freelancers", () => {
    const pros = [pro("a"), pro("b", { published: false }), pro("c")]
    const nail = work("a")
    const hidden = work("b")
    const photo = work("c", { category: "photophone", templateId: "photo-phone" })
    expect(rankFeed([nail, hidden, photo], pros, ctx({ vertical: "photo" }), "for-you").map((w) => w.id)).toEqual([photo.id])
    expect(rankFeed([nail, hidden, photo], pros, ctx(), "latest")).not.toContain(hidden)
  })

  it("for-you puts what the customer cares about first", () => {
    const pros = [pro("a"), pro("b")]
    const nail = work("a")
    const makeup = work("b", { category: "makeup" as CategoryId, templateId: "makeup-daily" })
    const out = rankFeed([nail, makeup], pros, ctx({ interests: new Set<CategoryId>(["makeup"]) }), "for-you")
    expect(out[0].id).toBe(makeup.id)
  })

  it("one prolific freelancer cannot fill the first screen", () => {
    const ids = ["b", "c", "d", "e", "f", "g", "h"]
    const pros = [pro("busy", { rating: { average: 5, count: 200 } }), ...ids.map((id) => pro(id))]
    const busy = Array.from({ length: 20 }, () => work("busy", { createdAt: daysAgo(0) }))
    const others = ids.flatMap((id) => [4, 5, 6, 7].map((d) => work(id, { createdAt: daysAgo(d) })))
    const out = rankFeed([...busy, ...others], pros, ctx(), "for-you")
    const firstPage = out.slice(0, 24)
    expect(firstPage.filter((w) => w.proId === "busy").length).toBeLessThanOrEqual(PRO_PER_PAGE)
    for (let i = 0; i + PRO_SPACING <= firstPage.length; i++) {
      const window = firstPage.slice(i, i + PRO_SPACING).map((w) => w.proId)
      expect(new Set(window).size).toBe(window.length)
    }
  })

  it("keeps everything when there are too few freelancers to space out", () => {
    const pros = [pro("a"), pro("b")]
    const items = Array.from({ length: 10 }, (_, i) => work(i % 2 ? "a" : "b"))
    expect(rankFeed(items, pros, ctx(), "for-you")).toHaveLength(10)
  })

  it("gives a new freelancer a card in the first dozen", () => {
    const veterans = Array.from({ length: 8 }, (_, i) => pro(`v${i}`, { rating: { average: 5, count: 100 }, identity: "verified" }))
    const rookie = pro("rookie", { joinedAt: daysAgo(3), rating: { average: 0, count: 0 }, stats: { completedJobs: 0, responseMinutes: 0 } })
    const items = [...veterans.flatMap((v) => [work(v.id), work(v.id), work(v.id)]), work("rookie", { createdAt: daysAgo(20) })]
    const out = rankFeed(items, [...veterans, rookie], ctx(), "for-you")
    expect(out.slice(0, 12).some((w) => w.proId === "rookie")).toBe(true)
  })
})

describe("scoring", () => {
  it("a single five-star review does not beat a long 4.8 record", () => {
    expect(bayesianRating({ average: 5, count: 1 })).toBeLessThan(bayesianRating({ average: 4.8, count: 40 }))
  })

  it("ignores save rates until there are enough impressions", () => {
    const p = pro("a")
    const w = work("a")
    const thin = scoreWork(w, p, ctx({ stats: { [w.id]: { impressions: 10, opens: 10, saves: 10, bookClicks: 10 } } }))
    expect(thin.appeal).toBe(0.5)
    const real = scoreWork(w, p, ctx({ stats: { [w.id]: { impressions: 1000, opens: 300, saves: 60, bookClicks: 20 } } }))
    expect(real.appeal).toBeGreaterThan(0.5)
  })

  it("out of range for a home visit scores zero for distance", () => {
    const p = pro("a", { maxTravelKm: 5 })
    expect(scoreWork(work("a"), p, ctx({ distanceKm: () => 12 })).near).toBe(0)
    expect(scoreWork(work("a"), p, ctx({ distanceKm: () => 1 })).near).toBeGreaterThan(0.7)
  })

  it("thin supply switches the home page to people first", () => {
    expect(supplyIsThin(7, 40)).toBe(true)
    expect(supplyIsThin(80, 600)).toBe(false)
  })
})

describe("diversify", () => {
  it("never loses or duplicates a card", () => {
    const items = Array.from({ length: 50 }, (_, i) => work(`p${i % 4}`))
    const out = diversify(items)
    expect(new Set(out.map((w) => w.id)).size).toBe(50)
  })
})

describe("occasions", async () => {
  const { OCCASIONS, occasionTemplates, occasionsFor } = await import("@/lib/occasions")
  it("only lists services that exist in the catalogue", () => {
    for (const o of OCCASIONS) expect(occasionTemplates(o)).toHaveLength(o.templates.length)
  })
  it("puts áo dài Tết first in December", () => {
    expect(occasionsFor(new Date("2026-12-15T09:00:00+07:00"))[0].id).toBe("ao-dai-tet")
    expect(occasionsFor(new Date("2026-09-23T09:00:00+07:00"))[0].id).not.toBe("ao-dai-tet")
  })
})

describe("serviceOffers", async () => {
  const { serviceOffers } = await import("@/lib/offers")
  const listing = (proId: string, templateId: string, prices: Record<string, number>, active = true) => ({
    id: `${proId}:${templateId}`,
    proId,
    templateId,
    prices,
    active,
  })

  it("only lists services someone in the city offers, most offered first, with the real lowest price", () => {
    const pros = [pro("a"), pro("b"), pro("c", { city: "Đà Nẵng" }), pro("d", { acceptingJobs: false })]
    const offers = serviceOffers({
      pros,
      proServices: [
        listing("a", "nail-gel", { hand: 150000 }),
        listing("b", "nail-gel", { hand: 130000, "hand-foot": 300000 }),
        listing("a", "makeup-daily", { single: 350000 }),
        listing("c", "photo-phone", { "60m": 300000 }),
        listing("d", "massage-foot", { "60m": 300000 }),
        listing("b", "hair-cut", { women: 200000 }, false),
      ],
      works: [work("a", { templateId: "nail-gel" })],
      city: "Hà Nội",
      vertical: "all",
    })
    expect(offers.map((o) => o.template.id)).toEqual(["nail-gel", "makeup-daily"])
    expect(offers[0].fromPrice).toBe(130000)
    expect(offers[0].pros.map((p) => p.id).sort()).toEqual(["a", "b"])
    expect(offers[0].photo).toBe("/x.jpg")
  })

  it("filters by trade", () => {
    const offers = serviceOffers({
      pros: [pro("a")],
      proServices: [listing("a", "nail-gel", { hand: 150000 }), listing("a", "photo-phone", { "60m": 300000 })],
      works: [],
      city: null,
      vertical: "photo",
    })
    expect(offers.map((o) => o.template.id)).toEqual(["photo-phone"])
  })
})
