"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, Field, inputClass } from "@/components/ui"
import { setMyPhone } from "@/lib/auth/actions"
import { isValidPhone } from "@/lib/auth/phone"

export function PhoneForm({ next }: { next: string }) {
  const router = useRouter()
  const [phone, setPhone] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setError(null)
        const result = await setMyPhone(phone)
        setBusy(false)
        if (!result.ok) return setError(result.error)
        router.replace(next)
        router.refresh()
      }}
    >
      <Field label="Số điện thoại di động" hint="Muốn đổi số sau này, liên hệ hỗ trợ.">
        <input
          className={inputClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="0968 112 233"
          autoFocus
        />
      </Field>
      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-3 text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy || !isValidPhone(phone)}>
        {busy ? "Đang lưu…" : "Lưu và tiếp tục"}
      </Button>
    </form>
  )
}
