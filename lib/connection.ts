/**
 * How a connection between a customer and a freelancer opens and closes: the
 * rules the database enforces (supabase/migrations/20260925100000-100300),
 * written once here so the web and the app say the same thing. Pure: every
 * function takes "now" rather than reading the clock.
 */

/** Days after completion in which both sides may review; reviews are blind until then. */
export const REVIEW_WINDOW_DAYS = 14
/** Messages a customer may send before the freelancer's first answer. */
export const QUESTION_LIMIT = 3
/** How long after the booked end a forgotten job completes on its own. */
export const AUTO_COMPLETE_HOURS = 24
/** From when after the start a customer may report that the freelancer did not come. */
export const NO_SHOW_AFTER_MIN = 15
/** Contact details in a message are replaced by this until a booking is confirmed. */
export const MASKED = "[đã ẩn]"

const HOUR = 3_600_000
const DAY = 24 * HOUR

const vnTime = (d: Date) => {
  const vn = new Date(d.getTime() + 7 * HOUR)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())} ${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}`
}

export interface ChatState {
  open: boolean
  /** A line to show above the composer (open, closing soon) or instead of it (closed). */
  note?: string
}

/** The chat's state from the thread's `closes_at` (null: open for good). */
export function chatState(closesAt: string | null | undefined, now: Date): ChatState {
  if (!closesAt) return { open: true }
  const ends = new Date(closesAt)
  if (now.getTime() >= ends.getTime()) {
    return { open: false, note: "Cuộc trò chuyện đã kết thúc. Cần gì thêm, hãy đặt lịch mới hoặc liên hệ hỗ trợ." }
  }
  return { open: true, note: `Trò chuyện sẽ đóng lúc ${vnTime(ends)}.` }
}

/** Shown once under a message that had contact details hidden. */
export const MASKED_NOTE =
  "Số điện thoại, link và email được ẩn cho tới khi lịch hẹn được xác nhận, để hai bên luôn có nhắc lịch, đánh giá và hỗ trợ khi có sự cố."

/** Before the freelancer answers a question, the customer may send QUESTION_LIMIT messages. */
export function questionsLeft(input: { isBookingThread: boolean; iAmCustomer: boolean; proHasReplied: boolean; mySent: number }) {
  if (input.isBookingThread || !input.iAmCustomer || input.proHasReplied) return null
  return Math.max(0, QUESTION_LIMIT - input.mySent)
}

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
    reportNoShow:
      active && t >= input.startsAt.getTime() + NO_SHOW_AFTER_MIN * 60_000 && t <= input.endsAt.getTime() + AUTO_COMPLETE_HOURS * HOUR,
    /** When it completes by itself if nobody acts. */
    autoCompleteAt: new Date(input.endsAt.getTime() + AUTO_COMPLETE_HOURS * HOUR),
  }
}

/** Ratings show as a number only from this many reviews; before, "Mới". */
export const MIN_REVIEWS_FOR_AVERAGE = 3
export const showsAverage = (count: number) => count >= MIN_REVIEWS_FOR_AVERAGE
