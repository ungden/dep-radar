export type HelpAudience = "khach" | "doi-tac"

export type HelpTopicId =
  | "bat-dau"
  | "dat-lich"
  | "gia-phi"
  | "thanh-toan"
  | "huy-doi"
  | "tai-cho"
  | "vang-mat"
  | "hoan-thanh"
  | "danh-gia"
  | "tin-nhan"
  | "an-toan"
  | "tranh-chap"
  | "ho-so"
  | "lich-lam"
  | "vi-phi"
  | "tai-khoan"

export interface HelpEntry {
  /** Stable: links (/tro-giup#id), the assistant's citations and the admin log use it. */
  id: string
  /** "chung": shown to both. */
  audience: HelpAudience | "chung"
  topic: HelpTopicId
  q: string
  /** Plain text; every rule here is what the system does (see the entry's source comment in knowledge.ts). */
  a: string
  /** Extra words people use for this, for search ("boom", "bùng"). */
  keywords?: string[]
  links?: { label: string; href: string }[]
}
