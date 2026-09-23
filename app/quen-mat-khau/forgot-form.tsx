"use client"

import * as React from "react"
import { MailCheck } from "lucide-react"
import { SupportLink } from "@/components/support-link"
import { Button, ButtonLink, Card, Field, inputClass } from "@/components/ui"
import { type ForgotResult, forgotPassword } from "@/lib/auth/actions"
import { parseIdentifier } from "@/lib/auth/identifier"
import { MESSAGES } from "@/lib/auth/password-rules"

export function ForgotForm() {
  const [identifier, setIdentifier] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<ForgotResult | null>(null)

  if (result?.sent) {
    return (
      <Card className="mt-6 p-5">
        <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="size-5" />
        </span>
        <p role="status" className="mt-3 font-semibold">
          {result.message}
        </p>
        <p className="mt-1.5 text-[14px] text-ink-soft">
          Mở thư và bấm link để đặt mật khẩu mới. Thư có thể tới chậm vài phút; không thấy thì xem mục Spam hoặc Quảng cáo.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/login" variant="outline">
            Về trang đăng nhập
          </ButtonLink>
          <Button variant="ghost" onClick={() => setResult(null)}>
            Gửi lại
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <form
      className="mt-6 space-y-4"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        if (parseIdentifier(identifier).kind === "invalid") return setResult({ sent: false, message: MESSAGES.invalidIdentifier })
        setBusy(true)
        setResult(null)
        setResult(await forgotPassword(identifier))
        setBusy(false)
      }}
    >
      <Field label="Số điện thoại hoặc email">
        <input
          className={inputClass}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="0912 345 678 hoặc ten@gmail.com"
          autoFocus
        />
      </Field>
      {result && (
        <div role="alert" className="rounded-xl bg-danger-soft px-3.5 py-3 text-[14px] text-danger">
          {result.message}
          {result.noEmail && <SupportLink size="sm" className="mt-3 flex w-fit" />}
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Đang gửi…" : "Gửi link đặt lại mật khẩu"}
      </Button>
    </form>
  )
}
