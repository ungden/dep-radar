"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ImagePlus, Send } from "lucide-react"
import { Button, PageHeader, inputClass } from "@/components/ui"
import { listMessages, sendMessage, type ChatMessage } from "@/lib/api/chat"
import { supabaseBrowser } from "@/lib/supabase/client"
import { uploadImage } from "@/lib/uploads"
import { cn, localTime } from "@/lib/utils"

/**
 * One conversation. New messages arrive over Realtime rather than by polling, so
 * the other side's reply appears while you are looking at it. The subscription
 * only tells us that something changed in this thread; the messages themselves
 * are re-read through the server, so row level security still decides what is
 * visible.
 */
export function Conversation({
  threadId,
  header,
  initial,
}: {
  threadId: string
  header: { name: string; proSlug: string; bookingId: string | null; iAmPro: boolean }
  initial: ChatMessage[]
}) {
  const [messages, setMessages] = React.useState(initial)
  const [draft, setDraft] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const bottom = React.useRef<HTMLDivElement>(null)

  const reload = React.useCallback(async () => {
    setMessages(await listMessages(threadId))
  }, [threadId])

  React.useEffect(() => {
    const channel = supabaseBrowser()
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        () => void reload(),
      )
      .subscribe()
    return () => {
      void supabaseBrowser().removeChannel(channel)
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

  return (
    <div className="mx-auto flex min-h-[85dvh] max-w-2xl flex-col md:pt-4">
      <PageHeader
        title={header.name}
        back="/tin-nhan"
        action={
          header.bookingId ? (
            <Link href={`/bookings/${header.bookingId}`} className="text-[13px] text-rose">
              Xem lịch hẹn
            </Link>
          ) : header.proSlug && !header.iAmPro ? (
            <Link href={`/pros/${header.proSlug}`} className="text-[13px] text-rose">
              Xem hồ sơ
            </Link>
          ) : undefined
        }
      />

      <div className="flex-1 space-y-2 pb-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Hỏi về mẫu, tình trạng da/móng/tóc hoặc thời gian phù hợp. Đừng gửi thông tin thanh toán qua tin nhắn.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
                m.mine ? "bg-rose text-white" : "bg-surface text-ink shadow-[var(--shadow-soft)]",
              )}
            >
              {m.images.map((src) => (
                <span key={src} className="relative mb-1.5 block aspect-square w-40 overflow-hidden rounded-xl bg-blush">
                  <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                </span>
              ))}
              {m.body && <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>}
              <span className={cn("mt-0.5 block text-[10.5px]", m.mine ? "text-white/70" : "text-muted")}>
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

      <form
        className="sticky bottom-0 flex items-end gap-2 border-t border-line bg-canvas/95 py-3 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault()
          if (draft.trim()) void send(draft)
        }}
      >
        <label
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-blush hover:text-rose"
          aria-label="Gửi ảnh"
        >
          <ImagePlus className="size-5" />
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setBusy(true)
              try {
                const url = await uploadImage("reviews", file)
                await send("", [url])
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
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (draft.trim()) void send(draft)
            }
          }}
          placeholder="Nhập tin nhắn…"
          className={cn(inputClass, "max-h-32 min-h-11 flex-1 resize-none py-3 text-sm")}
        />
        <Button type="submit" size="lg" className="size-11 shrink-0 p-0" disabled={busy || !draft.trim()} aria-label="Gửi">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
