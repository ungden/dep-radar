"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { Avatar } from "@/components/ui"
import { Badge, Card, EmptyState, inputClass } from "./ui"
import { decideProfile, type ProfileQueueItem } from "@/lib/api/admin"
import { cn, formatPrice, timeAgo } from "@/lib/utils"
import { ActButton } from "./desk-shared"

type Run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done?: string) => Promise<boolean>

const SUGGESTION: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  approved: { label: "Duyệt", tone: "success" },
  changes_requested: { label: "Cần sửa", tone: "warning" },
  rejected: { label: "Từ chối", tone: "danger" },
}

/** Only photos from our storage: next/image serves nothing else, and a post may hold a foreign link. */
const storagePhoto = (url: string) => /^https?:\/\/[^/]+\/storage\/v1\/object\/public\//.test(url)

/**
 * Partner profiles waiting for a person (owner, 19/10/2026): a profile is shown
 * to customers only once someone here presses "Duyệt". The AI looks first and
 * leaves a suggestion with its reasons; the staff decide. Every decision is
 * written next to the AI's suggestion in "Nhật ký AI" and the partner is told.
 */
export function ApprovalsPanel({ queue, run }: { queue: ProfileQueueItem[]; run: Run }) {
  if (queue.length === 0) {
    return <EmptyState title="Không có hồ sơ nào chờ duyệt" text="Hồ sơ đối tác gửi duyệt sẽ hiện ở đây, kèm gợi ý của AI." />
  }
  return (
    <div className="space-y-4">
      {queue.map((item) => (
        <ProfileCard key={item.id} item={item} run={run} />
      ))}
    </div>
  )
}

function ProfileCard({ item, run }: { item: ProfileQueueItem; run: Run }) {
  // When the AI wants changes, its reasons are a first draft of the note.
  const [note, setNote] = React.useState(item.ai && item.ai.decision !== "approved" ? item.ai.reasons.join("\n") : "")
  const [missing, setMissing] = React.useState(false)
  const suggestion = item.ai ? SUGGESTION[item.ai.decision] : null
  const photos = item.photos.filter(storagePhoto)

  const decide = async (decision: "approved" | "changes_requested" | "rejected") => {
    const text = note.trim()
    if (decision !== "approved" && !text) {
      setMissing(true)
      return
    }
    setMissing(false)
    await run(
      () => decideProfile(item.id, decision, decision === "approved" ? "" : text),
      decision === "approved"
        ? `Đã duyệt ${item.name}: hồ sơ đang hiện với khách.`
        : `Đã gửi lý do cho ${item.name}.`,
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3">
        <Avatar name={item.name} size={32} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/pros/${item.slug}`} target="_blank" className="text-sm font-semibold hover:underline">
              {item.name}
            </Link>
            {item.title && <span className="text-meta text-muted">{item.title}</span>}
          </p>
          <p className="text-label text-muted">{[item.categories.join(", "), item.area].filter(Boolean).join(" · ")}</p>
        </div>
        {item.previousNote && <Badge tone="info">Gửi lại</Badge>}
        <span className="text-label text-muted">
          {item.requestedAt ? `Gửi duyệt ${timeAgo(item.requestedAt)}` : `Tạo ${timeAgo(item.createdAt)}`}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4 p-4">
          {item.previousNote && (
            <p className="rounded-md border border-line bg-subtle/60 px-3 py-2 text-meta text-ink-soft">
              <span className="font-medium text-ink">Lần trước đã yêu cầu sửa:</span> {item.previousNote}
            </p>
          )}

          {(item.bio || item.highlights.length > 0) && (
            <section className="min-w-0">
              <h4 className="mb-1 text-label font-medium uppercase tracking-wide text-muted">Giới thiệu</h4>
              {item.bio && <p className="whitespace-pre-line text-body">{item.bio}</p>}
              {item.highlights.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-meta text-ink-soft">
                  {item.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="min-w-0">
            <h4 className="mb-1.5 text-label font-medium uppercase tracking-wide text-muted">Tác phẩm ({photos.length})</h4>
            {photos.length > 0 ? (
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {photos.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer" className="relative size-24 shrink-0 overflow-hidden rounded-md bg-subtle ring-1 ring-line">
                    <Image src={src} alt="" fill sizes="96px" className="object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-meta text-muted">Không có ảnh tải lên trong kho của 360đẹp để xem trước. Mở hồ sơ để xem.</p>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <section className="min-w-0">
              <h4 className="mb-1 text-label font-medium uppercase tracking-wide text-muted">Dịch vụ và giá</h4>
              {item.services.length === 0 ? (
                <p className="text-meta text-muted">Chưa có</p>
              ) : (
                <ul className="divide-y divide-line rounded-md border border-line text-meta">
                  {item.services.map((sv) => (
                    <li key={sv.name} className="flex items-center justify-between gap-3 px-2.5 py-1.5">
                      <span className="min-w-0 truncate">{sv.name}</span>
                      <span className="shrink-0 font-medium tabular-nums">{formatPrice(sv.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="min-w-0">
              <h4 className="mb-1 text-label font-medium uppercase tracking-wide text-muted">Giờ làm</h4>
              <p className="whitespace-pre-line text-meta text-ink-soft">{item.hours ? item.hours.split("; ").join("\n") : "Chưa có"}</p>
            </section>
          </div>
        </div>

        <aside className="space-y-3 border-t border-line bg-subtle/40 p-4 lg:border-l lg:border-t-0">
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-label font-medium uppercase tracking-wide text-muted">
              <Sparkles className="size-3.5" aria-hidden /> Gợi ý của AI
            </h4>
            {item.ai && suggestion ? (
              <div className="rounded-md border border-line bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={suggestion.tone}>{suggestion.label}</Badge>
                  <span className="text-label text-muted">
                    {item.ai.model === "rules" ? "theo quy tắc" : item.ai.model} · {timeAgo(item.ai.createdAt)}
                  </span>
                </div>
                {item.ai.summary && <p className="mt-2 text-meta">{item.ai.summary}</p>}
                {item.ai.reasons.length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-meta text-ink-soft">
                    {item.ai.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-line-strong/60 px-3 py-2.5 text-meta text-muted">
                AI chưa xem hồ sơ này (thường xong trong vài phút). Bạn vẫn duyệt được.
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`note-${item.id}`} className="mb-1 block text-label font-medium uppercase tracking-wide text-muted">
              Lý do gửi đối tác
            </label>
            <textarea
              id={`note-${item.id}`}
              className={cn(inputClass, "h-auto min-h-24 py-2")}
              placeholder="Bắt buộc khi Cần sửa hoặc Từ chối. Mỗi dòng một ý."
              aria-invalid={missing || undefined}
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                if (missing) setMissing(false)
              }}
            />
            {missing && <p className="mt-1 text-meta text-danger">Ghi lý do để đối tác biết cần sửa gì.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <ActButton onClick={() => decide("approved")}>
              <Check /> Duyệt
            </ActButton>
            <ActButton variant="outline" onClick={() => decide("changes_requested")}>
              Cần sửa
            </ActButton>
            <ActButton variant="danger" onClick={() => decide("rejected")}>
              Từ chối
            </ActButton>
          </div>
        </aside>
      </div>
    </Card>
  )
}
