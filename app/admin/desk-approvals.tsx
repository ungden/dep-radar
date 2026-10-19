"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, EmptyState, inputClass } from "@/components/ui"
import { decideProfile, type ProfileQueueItem } from "@/lib/api/admin"
import { cn, formatPrice, timeAgo } from "@/lib/utils"
import { ActButton } from "./desk-shared"

type Run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done?: string) => Promise<boolean>

const SUGGESTION: Record<string, { label: string; tone: string }> = {
  approved: { label: "AI gợi ý: Duyệt", tone: "bg-success-soft text-success" },
  changes_requested: { label: "AI gợi ý: Cần sửa", tone: "bg-warning-soft text-warning" },
  rejected: { label: "AI gợi ý: Từ chối", tone: "bg-danger-soft text-danger" },
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
    <div className="space-y-3">
      <p className="text-meta text-muted">
        Hồ sơ chỉ hiện với khách sau khi bạn bấm Duyệt. AI xem trước và gợi ý; quyết định là của bạn. Cần sửa hoặc Từ chối thì ghi lý do, mỗi
        dòng một ý: đối tác đọc đúng những dòng này.
      </p>
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
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/pros/${item.slug}`} target="_blank" className="text-body font-bold hover:underline">
          {item.name}
        </Link>
        {item.title && <span className="text-meta text-ink-soft">{item.title}</span>}
        <span className="ml-auto text-label text-muted">
          {item.requestedAt ? `Gửi duyệt ${timeAgo(item.requestedAt)}` : `Tạo ${timeAgo(item.createdAt)}`}
        </span>
      </div>
      <p className="mt-1 text-meta text-ink-soft">
        {[item.categories.join(", "), item.area].filter(Boolean).join(" · ")}
      </p>

      {item.previousNote && (
        <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-meta text-ink-soft">
          <span className="font-semibold">Lần trước đã yêu cầu sửa:</span> {item.previousNote}
        </p>
      )}

      {(item.bio || item.highlights.length > 0) && (
        <div className="mt-3 text-body">
          {item.bio && <p className="whitespace-pre-line">{item.bio}</p>}
          {item.highlights.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-meta text-ink-soft">
              {item.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {photos.length > 0 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {photos.map((src) => (
            <a key={src} href={src} target="_blank" rel="noreferrer" className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-subtle">
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </a>
          ))}
        </div>
      )}

      <dl className="mt-3 grid gap-x-4 gap-y-2 text-meta sm:grid-cols-2">
        <div>
          <dt className="text-label text-muted">Dịch vụ và giá</dt>
          <dd>
            {item.services.length === 0
              ? "Chưa có"
              : item.services.map((s) => (
                  <span key={s.name} className="block">
                    {s.name}: <span className="font-semibold">{formatPrice(s.price)}</span>
                  </span>
                ))}
          </dd>
        </div>
        <div>
          <dt className="text-label text-muted">Giờ làm</dt>
          <dd>{item.hours || "Chưa có"}</dd>
        </div>
      </dl>

      <div className="mt-3 rounded-xl border border-line p-3">
        {item.ai && suggestion ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-label font-semibold", suggestion.tone)}>{suggestion.label}</span>
              <span className="text-label text-muted">
                {item.ai.model === "rules" ? "theo quy tắc, không có AI" : item.ai.model} · {timeAgo(item.ai.createdAt)}
              </span>
            </div>
            {item.ai.summary && <p className="mt-2 text-body">{item.ai.summary}</p>}
            {item.ai.reasons.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-meta text-ink-soft">
                {item.ai.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-meta text-muted">AI chưa xem hồ sơ này (thường xong trong vài phút). Bạn vẫn duyệt được.</p>
        )}
      </div>

      <textarea
        className={cn(inputClass, "mt-3 min-h-20 py-2 text-body")}
        placeholder="Lý do gửi đối tác khi Cần sửa hoặc Từ chối (mỗi dòng một ý)"
        aria-label={`Lý do cho ${item.name}`}
        aria-invalid={missing || undefined}
        value={note}
        onChange={(e) => {
          setNote(e.target.value)
          if (missing) setMissing(false)
        }}
      />
      {missing && <p className="mt-1 text-meta text-danger">Ghi lý do để đối tác biết cần sửa gì.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <ActButton size="sm" onClick={() => decide("approved")}>
          Duyệt
        </ActButton>
        <ActButton size="sm" variant="soft" onClick={() => decide("changes_requested")}>
          Cần sửa
        </ActButton>
        <ActButton size="sm" variant="ghost" onClick={() => decide("rejected")}>
          Từ chối
        </ActButton>
      </div>
    </Card>
  )
}
