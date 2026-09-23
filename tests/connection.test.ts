import { describe, expect, it } from "vitest"
import { chatState, customerJobActions, questionsLeft, reviewWindow, showsAverage } from "@/lib/connection"
import { REVIEW_ISSUE_TAGS, REVIEW_TAGS, reviewTagsFor } from "@/lib/trust"

const now = new Date("2026-09-25T10:00:00Z")

describe("chatState", () => {
  it("is open for good without an end, closing with one, closed after it", () => {
    expect(chatState(null, now)).toEqual({ open: true })
    expect(chatState("2026-09-26T10:00:00Z", now).open).toBe(true)
    expect(chatState("2026-09-26T10:00:00Z", now).note).toContain("17:00 26/09")
    expect(chatState("2026-09-25T09:59:00Z", now).open).toBe(false)
  })
})

describe("questionsLeft", () => {
  it("counts down only for a customer's unanswered question", () => {
    expect(questionsLeft({ isBookingThread: false, iAmCustomer: true, proHasReplied: false, mySent: 2 })).toBe(1)
    expect(questionsLeft({ isBookingThread: false, iAmCustomer: true, proHasReplied: true, mySent: 9 })).toBeNull()
    expect(questionsLeft({ isBookingThread: true, iAmCustomer: true, proHasReplied: false, mySent: 9 })).toBeNull()
  })
})

describe("reviewWindow", () => {
  it("is 14 days from completion", () => {
    expect(reviewWindow("2026-09-20T10:00:00Z", now)).toEqual({ open: true, daysLeft: 9 })
    expect(reviewWindow("2026-09-10T10:00:00Z", now).open).toBe(false)
    expect(reviewWindow(null, now).open).toBe(false)
  })
})

describe("customerJobActions", () => {
  const startsAt = new Date("2026-09-25T09:00:00Z")
  const endsAt = new Date("2026-09-25T10:15:00Z")
  it("lets the customer finish from the start, and report a no-show from 15 minutes in", () => {
    expect(customerJobActions({ status: "confirmed", startsAt, endsAt }, new Date("2026-09-25T08:59:00Z")).confirmDone).toBe(false)
    expect(customerJobActions({ status: "confirmed", startsAt, endsAt }, new Date("2026-09-25T09:10:00Z"))).toMatchObject({
      confirmDone: true,
      reportNoShow: false,
    })
    expect(customerJobActions({ status: "confirmed", startsAt, endsAt }, now).reportNoShow).toBe(true)
    expect(customerJobActions({ status: "completed", startsAt, endsAt }, now).confirmDone).toBe(false)
  })
})

describe("review tags", () => {
  it("offers what went wrong at three stars or fewer, and the lists do not overlap", () => {
    expect(reviewTagsFor(3)).toBe(REVIEW_ISSUE_TAGS)
    expect(reviewTagsFor(4)).toBe(REVIEW_TAGS)
    expect(REVIEW_TAGS.filter((t) => REVIEW_ISSUE_TAGS.includes(t))).toEqual([])
  })
  it("shows an average from three reviews", () => {
    expect(showsAverage(2)).toBe(false)
    expect(showsAverage(3)).toBe(true)
  })
})

describe("review tags match the database", () => {
  it("lists the same tags as review_tags_ok", async () => {
    const { readFileSync } = await import("node:fs")
    const sql = readFileSync("supabase/migrations/20260925100200_review_rules.sql", "utf8")
    const fn = sql.slice(sql.indexOf("<@ array["), sql.indexOf("-- Both published at once"))
    const [all, issues] = fn.split("&& array[")
    const quoted = (s: string) => [...s.matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(new Set(quoted(all))).toEqual(new Set([...REVIEW_TAGS, ...REVIEW_ISSUE_TAGS]))
    expect(new Set(quoted(issues))).toEqual(new Set(REVIEW_ISSUE_TAGS))
  })
})
