"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2, MessageCircleQuestion, Search, ThumbsDown, ThumbsUp } from "lucide-react"
import { SupportLink, supportHref } from "@/components/support-link"
import { Button, inputClass } from "@/components/ui"
import { HELP_TOPICS, entriesFor, getEntry, isHelpAudience, type HelpAudience, type HelpEntry } from "@/lib/help/knowledge"
import { searchHelp } from "@/lib/help/search"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * The help centre: one box that filters the FAQ as you type and, on "Hỏi trợ
 * lý", asks the assistant (app/api/help/ask), which answers from the same
 * entries and cites them. Customers and partners each see their own entries.
 */
export function HelpCenter() {
  const params = useSearchParams()
  const initial = params.get("ban")
  const [audience, setAudience] = React.useState<HelpAudience>(isHelpAudience(initial) ? initial : "khach")
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState<string | null>(null)
  const entries = React.useMemo(() => entriesFor(audience), [audience])
  const matches = React.useMemo(() => (query.trim().length >= 2 ? searchHelp(entries, query, 6) : []), [entries, query])

  // A link to /tro-giup#entry-id opens that answer.
  React.useEffect(() => {
    const id = window.location.hash.slice(1)
    const entry = id ? getEntry(id) : undefined
    if (!entry) return
    const frame = requestAnimationFrame(() => {
      if (entry.audience !== "chung") setAudience(entry.audience)
      setOpen(id)
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center" }))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const reveal = (id: string) => {
    setOpen(id)
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }))
  }

  return (
    <div className="space-y-8">
      <div role="radiogroup" aria-label="Bạn là" className="grid grid-cols-2 gap-2">
        {(
          [
            ["khach", "Tôi là khách"],
            ["doi-tac", "Tôi là đối tác"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={audience === value}
            onClick={() => setAudience(value)}
            className={cn(
              "h-11 rounded-full border text-[15px] font-semibold transition-colors",
              audience === value ? "border-accent bg-accent text-white" : "border-line bg-surface hover:border-ink/30",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Assistant audience={audience} query={query} setQuery={setQuery} matches={matches} onReveal={reveal} />

      {HELP_TOPICS.map((topic) => {
        const list = entries.filter((e) => e.topic === topic.id)
        if (!list.length) return null
        return (
          <section key={topic.id} aria-labelledby={`topic-${topic.id}`}>
            <h2 id={`topic-${topic.id}`} className="text-[18px] font-bold tracking-tight">
              {topic.label}
            </h2>
            <div className="mt-2 divide-y divide-line rounded-[var(--radius-lg)] border border-line bg-surface">
              {list.map((e) => (
                <Entry key={e.id} entry={e} open={open === e.id} onToggle={(o) => setOpen(o ? e.id : null)} />
              ))}
            </div>
          </section>
        )
      })}

      <section className="rounded-[var(--radius-lg)] bg-subtle p-5">
        <h2 className="text-[17px] font-bold">Liên hệ hỗ trợ</h2>
        <p className="mt-1 text-[14px] text-ink-soft">
          Việc liên quan một lịch hẹn cụ thể (tranh chấp, sự cố, khiếu nại), hãy dùng <b>Báo cáo vấn đề</b> trong chi tiết lịch hẹn để
          đội ngũ có đủ thông tin. Việc khác, nhắn đội hỗ trợ. 360đẹp không bao giờ hỏi mật khẩu, mã OTP hay số tài khoản của bạn.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Support variant="primary" />
          <Link href="/chinh-sach" className="inline-flex h-9 items-center rounded-full px-3 text-[14px] font-semibold underline underline-offset-2">
            Chính sách phí & đặt lịch
          </Link>
          <Link href="/quy-che" className="inline-flex h-9 items-center rounded-full px-3 text-[14px] font-semibold underline underline-offset-2">
            Quy chế hoạt động
          </Link>
        </div>
      </section>
    </div>
  )
}

/** "Liên hệ hỗ trợ", but only when the owner has set a Zalo or e-mail: otherwise it would link back to this page. */
function Support({ size = "sm", variant = "outline" }: { size?: "sm" | "md"; variant?: "primary" | "outline" }) {
  const { platform } = useApp()
  if (!supportHref(platform).external) {
    return <span className="text-[13px] text-ink-soft">Dùng “Báo cáo vấn đề” trong chi tiết lịch hẹn để đội ngũ 360đẹp liên hệ bạn.</span>
  }
  return <SupportLink size={size} variant={variant} />
}

function Entry({ entry, open, onToggle }: { entry: HelpEntry; open: boolean; onToggle: (open: boolean) => void }) {
  return (
    <details id={entry.id} open={open} onToggle={(e) => onToggle((e.currentTarget as HTMLDetailsElement).open)} className="group scroll-mt-24 px-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 py-3.5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        {entry.q}
        <span aria-hidden className="mt-0.5 text-muted transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-4 text-[14px] leading-relaxed text-ink-soft">
        <p className="whitespace-pre-line">{entry.a}</p>
        {entry.links && entry.links.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {entry.links.map((l) => (
              <Link key={l.href} href={l.href} className="font-semibold text-accent underline underline-offset-2">
                {l.label}
              </Link>
            ))}
          </p>
        )}
      </div>
    </details>
  )
}

type Reply = { id: string | null; answer: string; sources: string[]; covered: boolean; handoff: boolean }

function Assistant({
  audience,
  query,
  setQuery,
  matches,
  onReveal,
}: {
  audience: HelpAudience
  query: string
  setQuery: (q: string) => void
  matches: HelpEntry[]
  onReveal: (id: string) => void
}) {
  const [busy, setBusy] = React.useState(false)
  const [reply, setReply] = React.useState<Reply | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [voted, setVoted] = React.useState<boolean | null>(null)

  const ask = async () => {
    const question = query.trim()
    if (question.length < 3 || busy) return
    setBusy(true)
    setError(null)
    setReply(null)
    setVoted(null)
    try {
      const res = await fetch("/api/help/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, audience }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error ?? "Chưa hỏi được, bạn thử lại nhé.")
      else setReply(json)
    } catch {
      setError("Mất kết nối, bạn thử lại nhé.")
    }
    setBusy(false)
  }

  const vote = async (helpful: boolean) => {
    if (!reply?.id || voted !== null) return
    setVoted(helpful)
    await fetch("/api/help/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reply.id, helpful }),
    }).catch(() => {})
  }

  return (
    <section aria-labelledby="ask-title" className="rounded-[var(--radius-lg)] border border-line bg-surface p-4 md:p-5">
      <h2 id="ask-title" className="flex items-center gap-2 text-[17px] font-bold">
        <MessageCircleQuestion className="size-5 text-accent" /> Bạn cần hỏi gì?
      </h2>
      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault()
          void ask()
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted" />
          <textarea
            rows={2}
            maxLength={500}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void ask()
              }
            }}
            placeholder={audience === "khach" ? "VD: Người làm đến trễ 30 phút thì sao?" : "VD: Khách không có nhà lúc tôi tới thì sao?"}
            className={cn(inputClass, "resize-none pl-9")}
            aria-label="Câu hỏi"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">Đừng gửi số điện thoại, số tài khoản hay mật khẩu.</p>
          <Button type="submit" size="sm" disabled={busy || query.trim().length < 3}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null} Hỏi trợ lý
          </Button>
        </div>
      </form>

      {matches.length > 0 && !reply && !busy && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Câu hỏi gần giống</p>
          <ul className="mt-1">
            {matches.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => onReveal(m.id)} className="w-full py-1.5 text-left text-[14px] text-accent hover:underline">
                  {m.q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

      {reply && (
        <div role="status" className="mt-4 rounded-[var(--radius-md)] bg-subtle p-4">
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{reply.answer}</p>
          {reply.sources.length > 0 && (
            <div className="mt-3">
              <p className="text-[12px] font-semibold text-muted">Xem quy định đầy đủ:</p>
              <ul className="mt-1 space-y-1">
                {reply.sources.map((id) => {
                  const e = getEntry(id)
                  return e ? (
                    <li key={id}>
                      <button type="button" onClick={() => onReveal(id)} className="text-left text-[14px] font-semibold text-accent underline underline-offset-2">
                        {e.q}
                      </button>
                    </li>
                  ) : null
                })}
              </ul>
            </div>
          )}
          {reply.handoff && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Support />
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-[13px] text-muted">
            {reply.id && (
              <>
                <span>{voted === null ? "Câu trả lời có giúp được bạn?" : "Cảm ơn bạn đã góp ý."}</span>
                {voted === null && (
                  <>
                    <button type="button" aria-label="Có ích" onClick={() => void vote(true)} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-surface">
                      <ThumbsUp className="size-4" />
                    </button>
                    <button type="button" aria-label="Không có ích" onClick={() => void vote(false)} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-surface">
                      <ThumbsDown className="size-4" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          <p className="mt-2 text-[12px] text-muted">
            Trợ lý AI trả lời theo quy định đang áp dụng trên trang này và có thể sai. Quyết định về tranh chấp, hoàn tiền hay tài khoản do
            đội ngũ 360đẹp đưa ra.
          </p>
        </div>
      )}
    </section>
  )
}
