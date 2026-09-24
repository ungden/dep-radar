import { formatPrice } from "@/lib/utils"

/**
 * When the reviewer reminds a partner, and what it says. Pure: the facts come
 * from ai_followup_facts() in the database, which also counts the reminders
 * already sent. Tested in tests/ai-review.test.ts.
 *
 *  * setup: a profile never sent for review. Three reminders at most, one, three
 *    and seven days after the profile was created.
 *  * changes: asked to change something and not resubmitted. Two reminders at
 *    most, two and five days after the decision.
 *  * fee: owing the platform fee for more than a day. One reminder a day while
 *    it is owed (it blocks new jobs, so it is worth the nagging).
 * Never two of a kind within a day.
 */

export type FollowUpKind = "setup" | "changes" | "fee"

export interface FollowUpFacts {
  proId: string
  kind: FollowUpKind
  createdAt: string
  /** setup: the profile's creation; changes: the decision; fee: when the balance went below zero. */
  since: string
  hasService: boolean
  hasHours: boolean
  hasWork: boolean
  balance: number
  /** Reminders of this kind already sent (for changes: since the decision). */
  prior: number
  lastAt: string | null
}

export interface FollowUpMessage {
  title: string
  body: string
  link: string
  /** For the log: what was missing or owed. */
  reasons: string[]
  summary: string
}

const DAY = 24 * 60 * 60 * 1000
export const SETUP_REMINDER_DAYS = [1, 3, 7] as const
export const CHANGES_REMINDER_DAYS = [2, 5] as const

const ageDays = (iso: string, now: Date) => (now.getTime() - new Date(iso).getTime()) / DAY

export function followUpDue(f: FollowUpFacts, now: Date): boolean {
  if (f.lastAt && ageDays(f.lastAt, now) < 1) return false
  switch (f.kind) {
    case "setup": {
      const at = SETUP_REMINDER_DAYS[f.prior]
      return at !== undefined && ageDays(f.createdAt, now) >= at
    }
    case "changes": {
      const at = CHANGES_REMINDER_DAYS[f.prior]
      return at !== undefined && ageDays(f.since, now) >= at
    }
    case "fee":
      return f.balance < 0 && ageDays(f.since, now) >= 1
  }
}

type Step = { key: "services" | "hours" | "work"; text: string; link: string }

export function missingSteps(f: Pick<FollowUpFacts, "hasService" | "hasHours" | "hasWork">): Step[] {
  const steps: Step[] = []
  if (!f.hasService) steps.push({ key: "services", text: "chọn dịch vụ và đặt giá", link: "/studio/services" })
  if (!f.hasHours) steps.push({ key: "hours", text: "lưu giờ làm việc", link: "/studio/profile/edit#gio-lam" })
  if (!f.hasWork) steps.push({ key: "work", text: "đăng một ảnh việc bạn đã làm", link: "/studio/works" })
  return steps
}

export function followUpMessage(f: FollowUpFacts): FollowUpMessage {
  const nth = `lần ${f.prior + 1}`
  switch (f.kind) {
    case "setup": {
      const steps = missingSteps(f)
      if (steps.length === 0) {
        return {
          title: "Hồ sơ của bạn đã đủ, chỉ còn bấm “Mở hồ sơ”",
          body: "Bấm “Mở hồ sơ cho khách” để gửi duyệt. 360dep duyệt trong vài phút, xong là khách đặt lịch được.",
          link: "/studio/profile/edit#mo-ho-so",
          reasons: ["Chưa bấm “Mở hồ sơ”"],
          summary: `Nhắc mở hồ sơ ${nth}: đủ điều kiện nhưng chưa gửi duyệt.`,
        }
      }
      const list = steps.map((s) => s.text).join(", ")
      return {
        title: `Còn ${steps.length + 1} bước để khách thấy hồ sơ của bạn`,
        body: `Còn thiếu: ${list}. Xong thì bấm “Mở hồ sơ cho khách”, 360dep duyệt trong vài phút.`,
        link: steps[0].link,
        reasons: [...steps.map((s) => `Chưa ${s.text}`), "Chưa bấm “Mở hồ sơ”"],
        summary: `Nhắc hoàn thiện hồ sơ ${nth}: thiếu ${list}.`,
      }
    }
    case "changes":
      return {
        title: "Hồ sơ của bạn vẫn đang chờ chỉnh",
        body: "Sửa theo góp ý rồi bấm “Gửi duyệt lại”. Khách chỉ thấy hồ sơ sau khi được duyệt.",
        link: "/studio/profile/edit#mo-ho-so",
        reasons: ["Chưa gửi duyệt lại sau khi được yêu cầu chỉnh"],
        summary: `Nhắc chỉnh hồ sơ ${nth}.`,
      }
    case "fee": {
      const owed = formatPrice(-f.balance)
      return {
        title: `Còn ${owed} phí dịch vụ chưa thanh toán`,
        body: "Thanh toán phí để nhận lịch và việc mới. Chuyển khoản theo hướng dẫn ở mục Ví, ví tự cộng khi tiền về.",
        link: "/studio/wallet",
        reasons: [`Ví đang âm ${owed}`],
        summary: `Nhắc thanh toán phí ${nth}: ví âm ${owed}.`,
      }
    }
  }
}
