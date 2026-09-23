/**
 * How a connection between a customer and a freelancer opens and closes: the
 * rules the database enforces (supabase/migrations/20260925100000-100300),
 * written once here so the web and the app say the same thing. Pure: every
 * function takes "now" rather than reading the clock.
 */

/** Days after completion in which both sides may review; reviews are blind until then. */
export const REVIEW_WINDOW_DAYS = 14
/** How long after the booked end a forgotten job completes on its own. */
export const AUTO_COMPLETE_HOURS = 24
/** From when after the start a customer may report that the freelancer did not come. */
export const NO_SHOW_AFTER_MIN = 15
const HOUR = 3_600_000
const DAY = 24 * HOUR

export const vnTime = (d: Date) => {
  const vn = new Date(d.getTime() + 7 * HOUR)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())} ${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}`
}

/** From the thread's computed `chat_status`: see 20260926100000_match_then_chat.sql. */
export type ChatStatus = "waiting" | "open" | "closed"

export interface ChatState {
  open: boolean
  /** Shown instead of the composer when the chat is not open. */
  note?: string
}

/**
 * Chat exists only around a live match: it opens when the freelancer accepts
 * the booking (or takes the request) and ends with the job.
 */
export function chatState(status: ChatStatus | null | undefined): ChatState {
  if (status === "open") return { open: true }
  if (status === "waiting") return { open: false, note: "Nhắn tin mở khi người làm nhận lịch." }
  return { open: false, note: "Lịch hẹn đã kết thúc nên cuộc trò chuyện đã đóng. Cần gì thêm, hãy đặt lịch mới hoặc liên hệ hỗ trợ." }
}

/** Whether a booking in this status has a chat to open. */
export const bookingChatOpen = (status: string) => status === "confirmed" || status === "in_progress"

/** Memo on the bank transfer that pays a freelancer's fee: matched automatically by the bank webhook. */
export const payMemo = (payCode: string) => `NAP ${payCode}`

export interface ReviewWindow {
  open: boolean
  daysLeft: number
}

export function reviewWindow(completedAt: string | null | undefined, now: Date): ReviewWindow {
  if (!completedAt) return { open: false, daysLeft: 0 }
  const left = new Date(completedAt).getTime() + REVIEW_WINDOW_DAYS * DAY - now.getTime()
  return { open: left > 0, daysLeft: Math.max(0, Math.ceil(left / DAY)) }
}

/** What a written-but-blind review says to its author. */
export const BLIND_NOTE =
  "Đánh giá sẽ hiện khi bên kia cũng đánh giá, hoặc sau 14 ngày. Hai bên không đọc được của nhau trước, nên không ai đánh giá để trả đũa."

/** Customer actions on a confirmed job, by the clock. */
export function customerJobActions(input: { status: string; startsAt: Date; endsAt: Date }, now: Date) {
  const active = input.status === "confirmed" || input.status === "in_progress"
  const t = now.getTime()
  return {
    confirmDone: active && t >= input.startsAt.getTime(),
    // Not once the freelancer pressed "Bắt đầu": they say they are there.
    reportNoShow:
      input.status === "confirmed" && t >= input.startsAt.getTime() + NO_SHOW_AFTER_MIN * 60_000 && t <= input.endsAt.getTime() + AUTO_COMPLETE_HOURS * HOUR,
    /** When it completes by itself if nobody acts. */
    autoCompleteAt: new Date(input.endsAt.getTime() + AUTO_COMPLETE_HOURS * HOUR),
  }
}

/** Ratings show as a number only from this many reviews; before, "Mới". */
export const MIN_REVIEWS_FOR_AVERAGE = 3
export const showsAverage = (count: number) => count >= MIN_REVIEWS_FOR_AVERAGE
