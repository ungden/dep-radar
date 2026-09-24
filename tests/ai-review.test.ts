import { describe, expect, it } from "vitest"
import { followUpDue, followUpMessage, type FollowUpFacts } from "@/lib/ai/followups"
import { RULE_REASONS, combineProfileDecision, hasContactInfo, profileRuleProblems, type ProfileFacts } from "@/lib/ai/rules"
import {
  VerdictError,
  buildProfilePrompt,
  buildWorkPrompt,
  hoursSummary,
  parseProfileVerdict,
  parseWorkVerdict,
  type ProfilePromptInput,
} from "@/lib/ai/verdict"

const complete: ProfileFacts = {
  displayName: "Linh Phạm",
  title: "Nail tại nhà",
  bio: "5 năm làm móng, gel và đắp bột.",
  categories: ["nail"],
  identityStatus: "none",
  activeServices: 2,
  hasHours: true,
  visibleWorks: 3,
  foreignPhotos: 0,
  missingPhotos: 0,
  bannedWords: false,
}

describe("profile rules", () => {
  it("passes a complete profile", () => {
    expect(profileRuleProblems(complete)).toEqual([])
  })

  it("names every missing requirement", () => {
    const problems = profileRuleProblems({ ...complete, activeServices: 0, hasHours: false, visibleWorks: 0, displayName: " " })
    expect(problems).toEqual([RULE_REASONS.noService, RULE_REASONS.noHours, RULE_REASONS.noWork, RULE_REASONS.noName])
  })

  it("asks a model to verify their identity first", () => {
    expect(profileRuleProblems({ ...complete, categories: ["model-photo"] })).toContain(RULE_REASONS.modelIdentity)
    expect(profileRuleProblems({ ...complete, categories: ["model-photo"], identityStatus: "verified" })).toEqual([])
    expect(profileRuleProblems({ ...complete, categories: ["model-video"], identityStatus: "pending" })).toContain(
      RULE_REASONS.modelIdentity,
    )
  })

  it("refuses photos from elsewhere, broken photos and banned words", () => {
    expect(profileRuleProblems({ ...complete, foreignPhotos: 1 })).toEqual([RULE_REASONS.foreignPhotos])
    expect(profileRuleProblems({ ...complete, missingPhotos: 2 })).toEqual([RULE_REASONS.missingPhotos])
    expect(profileRuleProblems({ ...complete, bannedWords: true })).toEqual([RULE_REASONS.banned])
  })

  it("finds a way to reach someone off the platform", () => {
    for (const text of [
      "Gọi em 0987 654 321",
      "sđt 0987.654.321",
      "+84 987 654 321",
      "Inbox Zalo em nhé",
      "fb.com/linhnail",
      "https://linhnail.vn",
      "www.linhnail.com",
      "linh@gmail.com",
      "IG: instagram linh.nail",
    ]) {
      expect(hasContactInfo(text), text).toBe(true)
    }
    expect(profileRuleProblems({ ...complete, bio: "Liên hệ 0901234567" })).toEqual([RULE_REASONS.contact])
  })

  it("does not mistake prices, years or our own address for contact details", () => {
    for (const text of [
      "Giá từ 350.000đ, combo 1.250.000đ",
      "Hơn 5 năm kinh nghiệm, từ 2019",
      "Đặt lịch qua 360dep.vn nhé",
      "Nail đính đá, sơn gel 2 lớp",
    ]) {
      expect(hasContactInfo(text), text).toBe(false)
    }
  })
})

describe("combining the rules with the AI", () => {
  it("decides on the rules alone without an AI, and says so", () => {
    const approved = combineProfileDecision([], null)
    expect(approved.decision).toBe("approved")
    expect(approved.summary).toMatch(/Chưa có AI, duyệt theo quy tắc/)
    const refused = combineProfileDecision([RULE_REASONS.noHours], null)
    expect(refused).toMatchObject({ decision: "changes_requested", reasons: [RULE_REASONS.noHours] })
    expect(refused.summary).toMatch(/Chưa có AI/)
  })

  it("lets a rule overrule an approving AI", () => {
    const verdict = combineProfileDecision([RULE_REASONS.modelIdentity], { decision: "approved", reasons: [], summary: "Ổn" })
    expect(verdict).toEqual({ decision: "changes_requested", reasons: [RULE_REASONS.modelIdentity], summary: "Ổn" })
  })

  it("puts the rules first and drops repeats", () => {
    const verdict = combineProfileDecision([RULE_REASONS.noHours], {
      decision: "changes_requested",
      reasons: ["Ảnh 2 là ảnh chụp màn hình.", RULE_REASONS.noHours.toUpperCase()],
      summary: "x",
    })
    expect(verdict.reasons).toEqual([RULE_REASONS.noHours, "Ảnh 2 là ảnh chụp màn hình."])
  })

  it("keeps a rejection a rejection", () => {
    const verdict = combineProfileDecision([RULE_REASONS.contact], { decision: "rejected", reasons: ["Lừa đảo"], summary: "x" })
    expect(verdict.decision).toBe("rejected")
    expect(verdict.reasons).toEqual(["Lừa đảo", RULE_REASONS.contact])
  })

  it("approves what both approve", () => {
    expect(combineProfileDecision([], { decision: "approved", reasons: [], summary: "Đạt" })).toEqual({
      decision: "approved",
      reasons: [],
      summary: "Đạt",
    })
  })
})

describe("reading the AI's answer", () => {
  it("accepts a well-formed answer and tidies it", () => {
    expect(
      parseProfileVerdict({ decision: "changes_requested", reasons: ["  Ảnh 1   bị mờ ", "", "Bỏ số điện thoại"], summary: " Ảnh mờ " }),
    ).toEqual({ decision: "changes_requested", reasons: ["Ảnh 1 bị mờ", "Bỏ số điện thoại"], summary: "Ảnh mờ" })
  })

  it("drops reasons from an approval and caps long answers", () => {
    const long = "a".repeat(1000)
    const verdict = parseProfileVerdict({ decision: "approved", reasons: ["tốt"], summary: long })
    expect(verdict.reasons).toEqual([])
    expect(verdict.summary.length).toBe(500)
    const many = parseProfileVerdict({ decision: "rejected", reasons: Array.from({ length: 10 }, (_, i) => `${i} ${long}`), summary: "" })
    expect(many.reasons).toHaveLength(6)
    expect(many.reasons[0].length).toBe(300)
  })

  it("refuses anything that is not the schema", () => {
    for (const raw of [
      null,
      "approved",
      [],
      { decision: "maybe", reasons: [], summary: "" },
      { decision: "approved", reasons: "none", summary: "" },
      { decision: "approved", reasons: [1], summary: "" },
      { decision: "approved", reasons: [] },
      // A refusal the partner cannot act on.
      { decision: "changes_requested", reasons: [" "], summary: "x" },
    ]) {
      expect(() => parseProfileVerdict(raw), JSON.stringify(raw)).toThrow(VerdictError)
    }
  })

  it("reads a post's answer the same way", () => {
    expect(parseWorkVerdict({ decision: "kept", reasons: ["đẹp"], summary: "Ổn" })).toEqual({ decision: "kept", reasons: [], summary: "Ổn" })
    expect(parseWorkVerdict({ decision: "hidden", reasons: ["Có watermark"], summary: "x" }).reasons).toEqual(["Có watermark"])
    expect(() => parseWorkVerdict({ decision: "hidden", reasons: [], summary: "x" })).toThrow(VerdictError)
    expect(() => parseWorkVerdict({ decision: "approved", reasons: [], summary: "x" })).toThrow(VerdictError)
  })
})

describe("the prompts", () => {
  const input: ProfilePromptInput = {
    displayName: "Linh Phạm",
    title: "Nail tại nhà",
    bio: "Làm móng 5 năm",
    highlights: ["Dụng cụ tiệt trùng"],
    categories: ["nail"],
    city: "Hà Nội",
    district: "Ba Đình",
    identityStatus: "verified",
    services: [{ name: "Sơn gel", option: "Cơ bản", price: 150000, min: 80000, max: 400000, suggested: 150000 }],
    hoursSummary: "T2 09:00–18:00",
    photos: [
      { index: 1, workTitle: "Móng hồng", serviceName: "Sơn gel", role: "photo" },
      { index: 2, workTitle: "Trước sau", serviceName: "Đắp bột", role: "after" },
    ],
    previousNote: null,
  }

  it("carries the facts and the photo order", () => {
    const prompt = buildProfilePrompt(input)
    expect(prompt).toContain("Tên hiển thị: Linh Phạm")
    expect(prompt).toContain("Sơn gel · Cơ bản: 150000đ (khung 80000–400000đ")
    expect(prompt).toContain('Ảnh 1: bài "Móng hồng", dịch vụ Sơn gel')
    expect(prompt).toContain("Ảnh 2: bài \"Trước sau\", dịch vụ Đắp bột (ảnh SAU)")
    expect(prompt).toContain("đã xác minh")
    expect(prompt).not.toContain("Lần trước")
  })

  it("asks whether earlier requests were fixed", () => {
    expect(buildProfilePrompt({ ...input, previousNote: "Bỏ số điện thoại" })).toContain("Lần trước hồ sơ được yêu cầu sửa:\nBỏ số điện thoại")
  })

  it("marks empty fields instead of leaving them blank", () => {
    const prompt = buildProfilePrompt({ ...input, bio: "", title: "", services: [], photos: [] })
    expect(prompt).toContain("Giới thiệu: (trống)")
    expect(prompt).toContain("Tiêu đề: (trống)")
  })

  it("describes a post for the post check", () => {
    const prompt = buildWorkPrompt({
      proName: "Linh",
      categories: ["nail"],
      title: "Móng hồng",
      description: "",
      serviceName: "Sơn gel",
      photos: [{ index: 1, workTitle: "Móng hồng", serviceName: "Sơn gel", role: "poster" }],
    })
    expect(prompt).toContain("Tiêu đề: Móng hồng")
    expect(prompt).toContain("(ảnh bìa của clip)")
  })

  it("summarises the week Monday first", () => {
    expect(
      hoursSummary([
        { weekday: 0, start_min: 600, end_min: 960 },
        { weekday: 1, start_min: 540, end_min: 1080 },
        { weekday: 1, start_min: 1140, end_min: 1260 },
      ]),
    ).toBe("T2 09:00–18:00; T2 19:00–21:00; CN 10:00–16:00")
  })
})

describe("reminders", () => {
  const now = new Date("2026-10-01T10:00:00Z")
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString()
  const setup = (over: Partial<FollowUpFacts>): FollowUpFacts => ({
    proId: "p",
    kind: "setup",
    createdAt: daysAgo(1.5),
    since: daysAgo(1.5),
    hasService: true,
    hasHours: false,
    hasWork: false,
    balance: 0,
    prior: 0,
    lastAt: null,
    ...over,
  })

  it("reminds about an unfinished profile after one, three and seven days, then stops", () => {
    expect(followUpDue(setup({ createdAt: daysAgo(0.5) }), now)).toBe(false)
    expect(followUpDue(setup({ createdAt: daysAgo(1.1) }), now)).toBe(true)
    expect(followUpDue(setup({ createdAt: daysAgo(2), prior: 1, lastAt: daysAgo(1) }), now)).toBe(false)
    expect(followUpDue(setup({ createdAt: daysAgo(3), prior: 1, lastAt: daysAgo(2) }), now)).toBe(true)
    expect(followUpDue(setup({ createdAt: daysAgo(6), prior: 2, lastAt: daysAgo(3) }), now)).toBe(false)
    expect(followUpDue(setup({ createdAt: daysAgo(7), prior: 2, lastAt: daysAgo(4) }), now)).toBe(true)
    expect(followUpDue(setup({ createdAt: daysAgo(30), prior: 3, lastAt: daysAgo(20) }), now)).toBe(false)
  })

  it("never sends two of a kind within a day", () => {
    // A profile a week old that was never reminded gets one now, not three.
    expect(followUpDue(setup({ createdAt: daysAgo(8), prior: 1, lastAt: daysAgo(0.2) }), now)).toBe(false)
  })

  it("reminds about requested changes twice at most", () => {
    const changes = (over: Partial<FollowUpFacts>) => setup({ kind: "changes", since: daysAgo(2.5), ...over })
    expect(followUpDue(changes({ since: daysAgo(1) }), now)).toBe(false)
    expect(followUpDue(changes({}), now)).toBe(true)
    expect(followUpDue(changes({ since: daysAgo(4), prior: 1, lastAt: daysAgo(1.5) }), now)).toBe(false)
    expect(followUpDue(changes({ since: daysAgo(5), prior: 1, lastAt: daysAgo(2.5) }), now)).toBe(true)
    expect(followUpDue(changes({ since: daysAgo(20), prior: 2, lastAt: daysAgo(10) }), now)).toBe(false)
  })

  it("reminds about an unpaid fee once a day while it is owed", () => {
    const fee = (over: Partial<FollowUpFacts>) => setup({ kind: "fee", balance: -27000, since: daysAgo(1.2), ...over })
    expect(followUpDue(fee({ since: daysAgo(0.5) }), now)).toBe(false)
    expect(followUpDue(fee({}), now)).toBe(true)
    expect(followUpDue(fee({ prior: 4, lastAt: daysAgo(0.9) }), now)).toBe(false)
    expect(followUpDue(fee({ prior: 4, lastAt: daysAgo(1.1) }), now)).toBe(true)
    expect(followUpDue(fee({ balance: 0 }), now)).toBe(false)
  })

  it("lists what is missing and links the first step", () => {
    const message = followUpMessage(setup({}))
    expect(message.title).toBe("Còn 3 bước để khách thấy hồ sơ của bạn")
    expect(message.body).toContain("lưu giờ làm việc, đăng một ảnh việc bạn đã làm")
    expect(message.link).toBe("/studio/profile/edit#gio-lam")
    expect(message.reasons).toContain("Chưa bấm “Mở hồ sơ”")
  })

  it("asks only for the button when everything is there", () => {
    const message = followUpMessage(setup({ hasHours: true, hasWork: true }))
    expect(message.title).toMatch(/chỉ còn bấm “Mở hồ sơ”/)
    expect(message.link).toBe("/studio/profile/edit#mo-ho-so")
  })

  it("says how much is owed, the Vietnamese way", () => {
    const message = followUpMessage(setup({ kind: "fee", balance: -27000 }))
    expect(message.title).toBe("Còn 27.000đ phí dịch vụ chưa thanh toán")
    expect(message.link).toBe("/studio/wallet")
  })
})
