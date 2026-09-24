"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Ban, Flag, ImagePlus, MoreHorizontal, Send } from "lucide-react"
import { ReportButton } from "@/components/report-button"
import { Sheet } from "@/components/sheet"
import { SupportLink } from "@/components/support-link"
import { Button, ButtonLink, PageHeader, inputClass } from "@/components/ui"
import { listMessages, sendMessage, type ChatMessage, type ThreadHeader } from "@/lib/api/chat"
import { actions, useAct } from "@/lib/client-actions"
import { chatState } from "@/lib/connection"
import { useApp } from "@/lib/store"
import { supabaseBrowser } from "@/lib/supabase/client"
import { uploadImage } from "@/lib/uploads"
import { cn, localTime } from "@/lib/utils"

/**
 * One conversation. New messages arrive over Realtime rather than by polling, so
 * the other side's reply appears while you are looking at it. The subscription
 * only tells us that something changed in this thread; the messages themselves
 * are re-read through the server, so row level security still decides what is
 * visible.
 *
 * What the box to write in says follows the database's rules
 * (lib/connection.ts): the chat opens when the freelancer accepts and closes
 * when the job ends. The history stays readable either way.
 */
export function Conversation({
  threadId,
  header,
  initial,
}: {
  threadId: string
  header: ThreadHeader
  initial: ChatMessage[]
}) {
  const state = useApp()
  const [messages, setMessages] = React.useState(initial)
  const [draft, setDraft] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const bottom = React.useRef<HTMLDivElement>(null)

  // The status is read with the page; a job that ends while this is open is
  // refused by send_message with the reason, which shows below.
  const chat = chatState(header.chatStatus)
  const blocked = state.blockedAccounts.includes(header.otherId)
  const canSend = chat.open && !blocked

  const reload = React.useCallback(async () => {
    setMessages(await listMessages(threadId))
  }, [threadId])

  React.useEffect(() => {
    const client = supabaseBrowser()
    let channel: ReturnType<typeof client.channel> | null = null
    let cancelled = false
    void (async () => {
      // Realtime checks the reader's access to each message. The session is
      // read from a cookie asynchronously, and a channel joined before it is
      // there joins as a stranger and never hears the other side.
      const { data } = await client.auth.getSession()
      if (cancelled) return
      if (data.session) await client.realtime.setAuth(data.session.access_token)
      channel = client
        .channel(`thread:${threadId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
          () => void reload(),
        )
        .subscribe()
    })()
    // A tab that comes back from the background catches up.
    const onFocus = () => void reload()
    window.addEventListener("focus", onFocus)
    return () => {
      cancelled = true
      window.removeEventListener("focus", onFocus)
      if (channel) void client.removeChannel(channel)
    }
  }, [threadId, reload])

  React.useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
  }, [messages])

  const send = async (body: string, images: string[] = []) => {
    setBusy(true)
    setError(null)
    const result = await sendMessage(threadId, body, images)
    setBusy(false)
    if (!result.ok) return setError(result.error)
    setDraft("")
    await reload()
  }

  // Rebooking the same service is the way to talk again after a booking's chat ends.
  const booking = header.bookingId ? state.bookings.find((b) => b.id === header.bookingId) : undefined
  const rebook = booking
    ? `/book/${booking.proId}?service=${booking.templateId}&variant=${booking.variantId}`
    : header.proSlug
      ? `/pros/${header.proSlug}`
      : null

  return (
    <div className="mx-auto flex min-h-[85dvh] max-w-2xl flex-col md:pt-4">
      <PageHeader
        title={header.name}
        back="/tin-nhan"
        action={
          <div className="flex items-center gap-1">
            {header.bookingId ? (
              <Link href={`/bookings/${header.bookingId}`} className="text-[13px] text-accent">
                Xem lịch hẹn
              </Link>
            ) : header.proSlug && !header.iAmPro ? (
              <Link href={`/pros/${header.proSlug}`} className="text-[13px] text-accent">
                Xem hồ sơ
              </Link>
            ) : null}
            <button
              type="button"
              aria-label="Tuỳ chọn"
              onClick={() => setMenu(true)}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-subtle"
            >
              <MoreHorizontal className="size-5" />
            </button>
          </div>
        }
      />

      <div className="flex-1 space-y-2 pb-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            {chat.open
              ? "Trao đổi về giờ, địa chỉ, mẫu mong muốn cho lịch hẹn này. Đừng gửi thông tin thanh toán qua tin nhắn."
              : "Chưa có tin nhắn nào."}
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
                m.mine ? "bg-accent text-white" : "border border-line bg-surface text-ink",
              )}
            >
              {m.images.map((src) => (
                <span key={src} className="relative mb-1.5 block aspect-square w-40 overflow-hidden rounded-xl bg-subtle">
                  <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                </span>
              ))}
              {m.body && <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>}
              <span className={cn("mt-0.5 block text-xs", m.mine ? "text-white/70" : "text-muted")}>
                {localTime(m.createdAt)}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {error && (
        <p role="alert" className="mb-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {blocked ? (
        <BlockedNote name={header.name} otherId={header.otherId} />
      ) : !chat.open ? (
        // The history stays readable; the box to write in goes.
        <div className="sticky bottom-0 space-y-3 border-t border-line bg-canvas/95 py-3 backdrop-blur">
          <p className="text-[14px] text-ink-soft">{chat.note}</p>
          {/* Waiting: the booking page is where it moves on. Closed: book again, or ask 360dep. */}
          {header.chatStatus === "waiting" ? (
            header.bookingId && (
              <ButtonLink href={`/bookings/${header.bookingId}`} variant="outline" className="w-full">
                Xem lịch hẹn
              </ButtonLink>
            )
          ) : (
            <div className={cn("grid gap-2", !header.iAmPro && rebook ? "grid-cols-2" : "grid-cols-1")}>
              {!header.iAmPro && rebook && <ButtonLink href={rebook}>Đặt lại</ButtonLink>}
              <SupportLink />
            </div>
          )}
        </div>
      ) : (
        <div className="sticky bottom-0 border-t border-line bg-canvas/95 py-3 backdrop-blur">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (draft.trim() && canSend) void send(draft)
            }}
          >
            <label
              className={cn(
                "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted",
                canSend ? "cursor-pointer hover:bg-subtle hover:text-accent" : "opacity-40",
              )}
              aria-label="Gửi ảnh"
            >
              <ImagePlus className="size-5" />
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={!canSend || busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setBusy(true)
                  try {
                    const path = await uploadImage("chat", file)
                    await send("", [path])
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Tải ảnh không thành công.")
                  }
                  setBusy(false)
                }}
              />
            </label>
            <textarea
              aria-label="Tin nhắn"
              rows={1}
              value={draft}
              disabled={!canSend}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (draft.trim() && canSend) void send(draft)
                }
              }}
              placeholder="Nhập tin nhắn…"
              className={cn(inputClass, "max-h-32 min-h-11 flex-1 resize-none py-3 text-sm")}
            />
            <Button type="submit" size="lg" className="size-11 shrink-0 p-0" disabled={busy || !draft.trim() || !canSend} aria-label="Gửi">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}

      <ChatMenu open={menu} onClose={() => setMenu(false)} header={header} blocked={blocked} />
    </div>
  )
}

/** Shown instead of the composer once you have blocked the other person. */
function BlockedNote({ name, otherId }: { name: string; otherId: string }) {
  const act = useAct()
  const [error, setError] = React.useState<string | null>(null)
  return (
    <div className="sticky bottom-0 space-y-2 border-t border-line bg-canvas/95 py-3 backdrop-blur">
      <p className="text-[14px] text-ink-soft">Bạn đã chặn {name}. Hai bên không nhắn tin được cho nhau.</p>
      <Button variant="outline" size="sm" onClick={() => void act(() => actions.unblockUser(otherId), `Đã bỏ chặn ${name}`).then(setError)}>
        Bỏ chặn
      </Button>
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </div>
  )
}

/** "⋯" in the header: block or unblock, and report. */
function ChatMenu({
  open,
  onClose,
  header,
  blocked,
}: {
  open: boolean
  onClose: () => void
  header: ThreadHeader
  blocked: boolean
}) {
  const act = useAct()
  const [mode, setMode] = React.useState<"menu" | "block" | "report">("menu")
  const [error, setError] = React.useState<string | null>(null)
  const close = () => {
    setMode("menu")
    setError(null)
    onClose()
  }

  return (
    <Sheet open={open} onClose={close} title={mode === "report" ? "Báo cáo" : header.name}>
      {mode === "menu" && (
        <ul className="-mx-2">
          <li>
            <button
              type="button"
              onClick={() =>
                blocked
                  ? void act(() => actions.unblockUser(header.otherId), `Đã bỏ chặn ${header.name}`).then((message) => {
                      setError(message)
                      if (!message) close()
                    })
                  : setMode("block")
              }
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left text-[15px] font-medium hover:bg-subtle"
            >
              <Ban className="size-5" /> {blocked ? "Bỏ chặn" : "Chặn"}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setMode("report")}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left text-[15px] font-medium hover:bg-subtle"
            >
              <Flag className="size-5" /> Báo cáo
            </button>
          </li>
        </ul>
      )}

      {mode === "block" && (
        <div className="space-y-3">
          <p className="text-[15px]">
            Chặn {header.name}? Hai bên sẽ không nhắn tin được cho nhau, và cuộc trò chuyện này rời khỏi hộp tin của bạn. Lịch hẹn đã
            đặt vẫn giữ nguyên (huỷ trong chi tiết lịch hẹn nếu cần). Bỏ chặn được bất cứ lúc nào.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setMode("menu")}>
              Quay lại
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                void act(() => actions.blockUser(header.otherId), `Đã chặn ${header.name}`).then((message) => {
                  setError(message)
                  if (!message) close()
                })
              }
            >
              Chặn
            </Button>
          </div>
        </div>
      )}

      {mode === "report" && (
        <ReportButton
          startOpen
          bookingId={header.bookingId}
          targetAccountId={header.otherId}
          onClose={() => setMode("menu")}
        />
      )}

      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
    </Sheet>
  )
}
