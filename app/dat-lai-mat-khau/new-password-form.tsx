"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, Field, inputClass } from "@/components/ui"
import { setNewPassword } from "@/lib/auth/actions"
import { PASSWORD_MIN } from "@/lib/auth/credentials"

export function NewPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = React.useState("")
  const [again, setAgain] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const mismatch = again.length > 0 && again !== password

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setError(null)
        const result = await setNewPassword(password)
        setBusy(false)
        if (!result.ok) return setError(result.error)
        router.replace("/")
        router.refresh()
      }}
    >
      <Field label="Mật khẩu mới" hint={`Ít nhất ${PASSWORD_MIN} ký tự.`}>
        <input
          className={inputClass}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          autoFocus
        />
      </Field>
      <Field label="Nhập lại mật khẩu mới" hint={mismatch ? "Hai mật khẩu chưa khớp." : undefined}>
        <input
          className={inputClass}
          type="password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-3 text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={busy || password.length < PASSWORD_MIN || password !== again}
      >
        {busy ? "Đang lưu…" : "Lưu mật khẩu mới"}
      </Button>
    </form>
  )
}
