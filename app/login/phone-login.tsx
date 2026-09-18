"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, Field, inputClass } from "@/components/ui"
import { requestCode, verifyCode } from "@/lib/auth/actions"
import { isValidPhone } from "@/lib/auth/phone"

export function PhoneLogin({ next, otpEnabled }: { next: string | null; otpEnabled: boolean }) {
  const router = useRouter()
  const [step, setStep] = React.useState<"phone" | "code">("phone")
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const done = () => router.replace(next ?? "/")

  async function submitPhone(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const result = await requestCode(phone, name)
    setBusy(false)
    if (!result.ok) return setError(result.error)
    if (result.otpSent) setStep("code")
    else done()
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const result = await verifyCode(phone, code)
    setBusy(false)
    if (!result.ok) return setError(result.error)
    done()
  }

  if (step === "code") {
    return (
      <form className="mt-6 space-y-4" onSubmit={submitCode}>
        <p className="rounded-xl bg-blush px-3.5 py-3 text-[13px] text-rose-dark">
          Đã gửi mã xác thực tới <b>{phone}</b>.
        </p>
        <Field label="Mã xác thực">
          <input
            className={inputClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={8}
          />
        </Field>
        {error && <Message>{error}</Message>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || code.trim().length < 4}>
          {busy ? "Đang kiểm tra…" : "Xác nhận"}
        </Button>
        <button
          type="button"
          className="mx-auto block py-2 text-sm text-muted hover:text-ink"
          onClick={() => {
            setStep("phone")
            setCode("")
            setError(null)
          }}
        >
          Đổi số điện thoại
        </button>
      </form>
    )
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submitPhone}>
      <Field label="Họ và tên">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Nguyễn Thu Anh"
        />
      </Field>
      <Field
        label="Số điện thoại"
        hint={
          otpEnabled
            ? "Chúng tôi gửi một mã xác thực qua SMS."
            : "Bản demo: chưa gửi SMS, đăng nhập ngay bằng số này."
        }
      >
        <input
          className={inputClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="0968 112 233"
        />
      </Field>
      {error && <Message>{error}</Message>}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={busy || name.trim().length < 2 || !isValidPhone(phone)}
      >
        {busy ? "Đang xử lý…" : otpEnabled ? "Gửi mã xác thực" : "Tiếp tục"}
      </Button>
      <p className="text-center text-xs text-muted">
        Tiếp tục nghĩa là bạn đồng ý để dep360 xử lý số điện thoại của bạn theo{" "}
        <a href="/chinh-sach" className="underline">
          chính sách
        </a>
        .
      </p>
    </form>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-3 text-[13px] text-danger">
      {children}
    </p>
  )
}
