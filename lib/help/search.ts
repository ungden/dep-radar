/**
 * Finding help entries by what people type, with or without accents
 * ("huy lich" finds "Huỷ lịch"). Pure, so the page filter, the assistant's
 * fallback and the tests share it.
 */

export function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Words too common to tell entries apart.
const STOP = new Set(
  "toi ban minh co khong the nao la gi cua va thi duoc bi cho voi khi neu sao mot nhung cac de o tai hay a nhe roi da dang se can phai bao nhieu nhieu"
    .split(" "),
)

export function terms(text: string): string[] {
  return fold(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP.has(w))
}

export interface Searchable {
  id: string
  q: string
  a: string
  keywords?: string[]
}

/**
 * Entries that share words with the query, best first. A word in the question
 * or the keywords counts more than one in the answer; two-word phrases
 * ("huy lich", "phi di chuyen") count extra, since single words like "phi"
 * are everywhere.
 */
export function searchHelp<T extends Searchable>(entries: T[], query: string, limit = 8): T[] {
  const words = terms(query)
  if (!words.length) return []
  // Pairs keep the small words: "khong den" is what tells "did not come" from "came late".
  const all = fold(query).split(" ")
  const pairs = all
    .slice(1)
    .map((w, i) => [all[i], w] as const)
    .filter(([a, b]) => !(STOP.has(a) && STOP.has(b)))
    .map(([a, b]) => `${a} ${b}`)
  const scored = entries.map((entry) => {
    const head = ` ${fold(`${entry.q} ${(entry.keywords ?? []).join(" ")}`)} `
    const body = ` ${fold(entry.a)} `
    let score = 0
    for (const w of words) {
      if (head.includes(` ${w}`)) score += 3
      else if (body.includes(` ${w}`)) score += 1
    }
    for (const p of pairs) {
      if (head.includes(p)) score += 4
      else if (body.includes(p)) score += 2
    }
    return { entry, score }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry)
}

/** Phone numbers and e-mail addresses out of a question before it is stored. */
export function maskPersonal(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/(?:\+?84|0)(?:[\s.-]?\d){8,10}/g, "[số điện thoại]")
}
