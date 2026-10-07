import { describe, expect, it } from "vitest"
import { buildPrompt, cleanAnswer, fallbackAnswer } from "@/lib/help/assistant"
import { HELP_ENTRIES, HELP_TOPICS, entriesFor, getEntry } from "@/lib/help/knowledge"
import { fold, maskPersonal, searchHelp } from "@/lib/help/search"
import { POLICY } from "@/lib/pricing"

describe("help centre content", () => {
  it("has unique ids and known topics", () => {
    const ids = HELP_ENTRIES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    const topics = new Set(HELP_TOPICS.map((t) => t.id))
    for (const e of HELP_ENTRIES) {
      expect(topics.has(e.topic), e.id).toBe(true)
      expect(e.q.length, e.id).toBeGreaterThan(8)
      expect(e.a.length, e.id).toBeGreaterThan(40)
    }
  })

  it("gives both sides answers for the things that turn into disputes", () => {
    for (const audience of ["khach", "doi-tac"] as const) {
      const topics = new Set(entriesFor(audience).map((e) => e.topic))
      for (const t of ["huy-doi", "vang-mat", "tai-cho", "hoan-thanh", "tranh-chap", "an-toan", "tai-khoan"] as const) {
        expect(topics.has(t), `${audience} has ${t}`).toBe(true)
      }
    }
  })

  it("never promises money 360đẹp does not hold", () => {
    for (const e of HELP_ENTRIES) {
      const a = fold(e.a)
      expect(a, e.id).not.toMatch(/hoan 100|duoc hoan tien|360dep (se )?hoan tien|360dep (se )?boi thuong/)
    }
    expect(getEntry("k-hoan-tien")!.a).toMatch(/không có hoàn tiền/)
  })

  it("takes its numbers from the policy, not from memory", () => {
    expect(getEntry("k-phi-di-chuyen")!.a).toContain(`${POLICY.freeTravelKm} km`)
    expect(getEntry("d-hoa-hong")!.a).toContain(`${Math.round(POLICY.commissionRate * 100)}%`)
    expect(getEntry("k-dat-truoc")!.a).toContain(`${POLICY.minLeadMinutes} phút`)
  })

  it("keeps each side's entries to its own side", () => {
    expect(entriesFor("khach").some((e) => e.audience === "doi-tac")).toBe(false)
    expect(entriesFor("doi-tac").some((e) => e.audience === "khach")).toBe(false)
    expect(entriesFor("khach").some((e) => e.audience === "chung")).toBe(true)
  })
})

describe("help search", () => {
  it("finds an answer typed without accents", () => {
    expect(searchHelp(entriesFor("khach"), "huy lich co mat phi khong")[0]?.id).toBe("k-huy")
    expect(searchHelp(entriesFor("khach"), "nguoi lam khong den")[0]?.id).toBe("k-nguoi-lam-khong-den")
    expect(searchHelp(entriesFor("doi-tac"), "nap tien vao vi")[0]?.id).toBe("d-nap-tien")
  })

  it("finds nothing for nothing", () => {
    expect(searchHelp(HELP_ENTRIES, "")).toEqual([])
    expect(searchHelp(HELP_ENTRIES, "là gì")).toEqual([])
  })

  it("masks phone numbers and e-mails before a question is stored", () => {
    expect(maskPersonal("gọi em 0912 345 678 hoặc +84912345678")).toBe("gọi em [số điện thoại] hoặc [số điện thoại]")
    expect(maskPersonal("mail a.b+c@gmail.com nhé")).toBe("mail [email] nhé")
    expect(maskPersonal("lịch 14:00 ngày 12/10, giá 350.000đ")).toBe("lịch 14:00 ngày 12/10, giá 350.000đ")
  })
})

describe("help assistant", () => {
  it("puts only the asker's side in the prompt, and the question last", () => {
    const prompt = buildPrompt("khach", "Huỷ lịch có mất phí không?")
    expect(prompt).toContain("[k-huy]")
    expect(prompt).not.toContain("[d-nap-tien]")
    expect(prompt.trim().endsWith('"""Huỷ lịch có mất phí không?"""')).toBe(true)
  })

  it("drops sources that do not exist and refuses to call an unsourced answer covered", () => {
    const a = cleanAnswer({ answer: "Được hoàn tiền.", sources: ["made-up"], covered: true, handoff: false }, "m")
    expect(a.sources).toEqual([])
    expect(a.covered).toBe(false)
    expect(a.handoff).toBe(true)
    const b = cleanAnswer({ answer: "Huỷ trước giờ hẹn không mất phí.", sources: ["k-huy", "k-huy"], covered: true, handoff: false }, "m")
    expect(b).toMatchObject({ sources: ["k-huy"], covered: true, handoff: false })
  })

  it("accepts ids cited with the prompt's brackets", () => {
    const a = cleanAnswer({ answer: "Không mất phí.", sources: ["[k-huy]", " k-doi-gio "], covered: true, handoff: false }, "m")
    expect(a.sources).toEqual(["k-huy", "k-doi-gio"])
    expect(a.covered).toBe(true)
  })

  it("survives a broken model answer", () => {
    expect(cleanAnswer(null, "m").covered).toBe(false)
    expect(cleanAnswer({ answer: 3 }, "m").answer.length).toBeGreaterThan(10)
  })

  it("falls back to the closest entries without an AI", () => {
    const f = fallbackAnswer("doi-tac", "khách không có nhà")
    expect(f.sources).toContain("d-khach-vang-mat")
    expect(f.covered).toBe(false)
  })
})
