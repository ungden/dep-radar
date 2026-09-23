"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MailCheck } from "lucide-react"
import { Button, ButtonLink, Card, Field, inputClass } from "@/components/ui"
import { addRecoveryEmail } from "@/lib/auth/actions"
import { maskEmail } from "@/lib/auth/identifier"

/**
 * Supabase mails a confirmation link to the new address; the account's email
 * changes only once that link is opened. Until then it says so.
 */
export function EmailForm({ next, pending, embedded = false }: { next?: string; pending: string | null; embedded?: boolean }) {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [sentTo, setSentTo] = React.useState<string | null>(pending ? maskEmail(pending) : null)
  const [editing, setEditing] = React.useState(!pending)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (sentTo && !editing) {
    return (
      <Card className={embedded ? "p-4" : "mt-6 p-5"}>
        <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="size-5" />
        </span>
        <p role="status" className="mt-3 font-semibold">
          Đang chờ xác nhận {sentTo}
        </p>
        <p className="mt-1.5 text-[14px] text-ink-soft">
          360dep đã gửi link xác nhận tới email này. Email chỉ được dùng để lấy lại mật khẩu sau khi bạn bấm link đó. Thư có thể
          tới chậm vài phút; không thấy thì xem mục Spam.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {next && <ButtonLink href={next}>Tiếp tục</ButtonLink>}
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Dùng email khác
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <form
      className={embedded ? "space-y-3" : "mt-6 space-y-4"}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setError(null)
        const result = await addRecoveryEmail(email)
        setBusy(false)
        if (!result.ok) return setError(result.error)
        setSentTo(result.masked)
        setEditing(false)
        router.refresh()
      }}
    >
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="ten@gmail.com"
        />
      </Field>
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-3 text-[14px] text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size={embedded ? "md" : "lg"} className={embedded ? undefined : "flex-1"} disabled={busy || !email.trim()}>
          {busy ? "Đang gửi…" : "Gửi link xác nhận"}
        </Button>
        {next && !embedded && (
          <ButtonLink href={next} variant="ghost" size="lg">
            Để sau
          </ButtonLink>
        )}
      </div>
    </form>
  )
}
