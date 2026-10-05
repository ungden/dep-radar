"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, Field, inputClass } from "@/components/ui"
import { setMyPhone } from "@/lib/auth/actions"
import { formatPhone, isValidPhone, toE164 } from "@/lib/auth/phone"

export function PhoneForm({ next, currentPhone = "" }: { next: string; currentPhone?: string }) {
  const router = useRouter()
  const [phone, setPhone] = React.useState(currentPhone ? formatPhone(currentPhone) : "")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const saving = React.useRef(false)
  const unchanged = Boolean(currentPhone && toE164(phone) === toE164(currentPhone))

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        if (saving.current || !isValidPhone(phone) || unchanged) return
        saving.current = true
        setBusy(true)
        setError(null)
        try {
          const result = await setMyPhone(phone)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.replace(next)
          router.refresh()
        } catch {
          setError("Không lưu được số điện thoại. Kiểm tra kết nối rồi thử lại.")
        } finally {
          saving.current = false
          setBusy(false)
        }
      }}
    >
      <Field label="Số điện thoại di động" hint={currentPhone ? "Sau khi lưu, dùng số mới để đăng nhập bằng mật khẩu. Số cũ sẽ không còn đăng nhập tài khoản này." : "Bạn có thể đổi số sau này trong Cài đặt tài khoản."}>
        <input
          className={inputClass}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            setError(null)
          }}
          disabled={busy}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "phone-error" : undefined}
          inputMode="tel"
          autoComplete="tel"
          placeholder="0968 112 233"
          autoFocus
        />
      </Field>
      {error && (
        <p id="phone-error" role="alert" className="rounded-xl bg-danger/10 px-3.5 py-3 text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy || !isValidPhone(phone) || unchanged}>
        {busy ? "Đang lưu…" : currentPhone ? "Lưu số mới" : "Lưu và tiếp tục"}
      </Button>
    </form>
  )
}
