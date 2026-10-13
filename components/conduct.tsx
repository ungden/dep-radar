import Link from "next/link"
import { MessageCircleWarning, ShieldCheck } from "lucide-react"
import { CHAT_NOTICE, CONDUCT, offAppHint } from "@/lib/conduct"
import { cn } from "@/lib/utils"

/**
 * "Chỉ dịch vụ lành mạnh": the short rule, with the full list one tap away and
 * the binding text in the Quy chế. Shown where a customer decides to book or
 * post a request (lib/conduct.ts, same words as the app).
 */
export function ConductNote({ className }: { className?: string }) {
  return (
    <details className={cn("group rounded-[var(--radius-lg)] border border-line bg-surface p-4", className)}>
      <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
          <ShieldCheck className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-body font-bold">{CONDUCT.title}</span>
          <span className="mt-0.5 block text-meta text-ink-soft">{CONDUCT.short}</span>
          <span className="mt-1 block text-meta font-semibold text-accent-dark underline underline-offset-2 group-open:hidden">Xem quy định</span>
        </span>
      </summary>
      <ul className="mt-3 list-disc space-y-1 pl-[3.25rem] text-meta text-ink-soft">
        {CONDUCT.rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mt-2 pl-12 text-meta text-ink-soft">
        {CONDUCT.report}{" "}
        <Link href="/quy-che#bi-cam" className="font-semibold text-accent-dark underline underline-offset-2">
          Quy chế, mục IX
        </Link>
      </p>
    </details>
  )
}

/** Pinned at the top of every conversation: talk here, or 360đẹp cannot help. */
export function ChatNotice({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group mb-3 rounded-[var(--radius-lg)] border border-line bg-highlight-soft px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
        <ShieldCheck aria-hidden className="size-5 shrink-0 text-ink" />
        <span className="flex-1 text-meta font-bold text-ink">{CHAT_NOTICE.title}</span>
        <span className="text-label font-semibold text-ink-soft group-open:hidden">Xem</span>
        <span className="hidden text-label font-semibold text-ink-soft group-open:inline">Thu gọn</span>
      </summary>
      <p className="mt-2 text-meta text-ink-soft">{CHAT_NOTICE.text}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-meta text-ink-soft">
        {CHAT_NOTICE.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </details>
  )
}

/** Under the box to write in, while the draft moves the deal off the app. */
export function OffAppHint({ text }: { text: string }) {
  const hint = offAppHint(text)
  if (!hint) return null
  return (
    <p role="status" className="mb-2 flex gap-2 rounded-[var(--radius-md)] bg-warning-soft px-3 py-2 text-meta text-warning">
      <MessageCircleWarning aria-hidden className="mt-0.5 size-4 shrink-0" />
      {hint}
    </p>
  )
}
