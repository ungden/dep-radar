// Plain module (not "use client"): the server page reads ?tab= with it too.
/** Every panel of the desk; `?tab=` in the address. */
export const TABS = [
  "overview",
  "approvals",
  "checks",
  "pros",
  "ai",
  "bookings",
  "customers",
  "requests",
  "reviews",
  "reports",
  "finance",
  "topup",
  "help",
  "catalog",
  "settings",
] as const
export type Tab = (typeof TABS)[number]
export const isTab = (v: unknown): v is Tab => typeof v === "string" && (TABS as readonly string[]).includes(v)

/** Open a panel, optionally with one of its filters chosen (from the overview). */
export type Go = (tab: Tab, filter?: string) => void
