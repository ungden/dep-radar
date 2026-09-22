"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, Field, inputClass } from "@/components/ui"
import { requestPasswordReset, signInWithPassword, signUpWithPassword } from "@/lib/auth/actions"
import { PASSWORD_MIN, isEmail, parseIdentifier } from "@/lib/auth/credentials"
import { isValidPhone } from "@/lib/auth/phone"

type Mode = "signin" | "signup" | "forgot"

export function LoginForm({ next, initialMode, linkError }: { next: string | null; initialMode: Mode; linkError: boolean }) {
  const router = useRouter()
  const [mode, setMode] = React.useState<Mode>(initialMode)
  const [identifier, setIdentifier] = React.useState("")
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(
    linkError ? "Link trong email đã hết hạn hoặc đã được dùng. Yêu cầu link mới bên dưới." : null,
  )
  const [sent, setSent] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const switchTo = (to: Mode) => {
    setMode(to)
    setError(null)
    setSent(false)
    setPassword("")
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const result =
      mode === "signin"
        ? await signInWithPassword(identifier, password)
        : mode === "signup"
          ? await signUpWithPassword({ fullName: name, phone, email, password })
          : await requestPasswordReset(identifier)
    setBusy(false)
    if (!result.ok) return setError(result.error)
    if (mode === "forgot") return setSent(true)
    router.replace(next ?? "/")
    router.refresh()
  }

  const canSubmit =
    mode === "signin"
      ? parseIdentifier(identifier) !== null && password.length > 0
      : mode === "signup"
        ? name.trim().length >= 2 && isValidPhone(phone) && isEmail(email) && password.length >= PASSWORD_MIN
        : parseIdentifier(identifier) !== null

  return (
    <div className="mt-6">
      {mode !== "forgot" && (
        <div role="tablist" aria-label="Đăng nhập hoặc tạo tài khoản" className="mb-5 grid grid-cols-2 rounded-2xl bg-blush p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchTo(m)}
              className={
                mode === m
                  ? "h-10 rounded-xl bg-surface text-sm font-semibold text-ink shadow-sm"
                  : "h-10 rounded-xl text-sm text-ink-soft hover:text-ink"
              }
            >
              {m === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          ))}
        </div>
      )}

      <form className="space-y-4" onSubmit={submit} noValidate>
        {mode === "forgot" && (
          <div>
            <h2 className="text-lg font-semibold">Quên mật khẩu</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Nhập số điện thoại hoặc email của tài khoản. 360dep gửi link đặt lại mật khẩu tới email của tài khoản đó.
            </p>
          </div>
        )}

        {mode === "signup" ? (
          <>
            <Field label="Họ và tên">
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Nguyễn Thu Anh"
              />
            </Field>
            <Field label="Số điện thoại" hint="Chuyên viên gọi số này để xác nhận lịch hẹn. Một số là một tài khoản.">
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="0968 112 233"
              />
            </Field>
            <Field label="Email" hint="Dùng để lấy lại mật khẩu khi bạn quên.">
              <input
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ban@email.com"
              />
            </Field>
          </>
        ) : (
          <Field label="Số điện thoại hoặc email">
            <input
              className={inputClass}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="0968 112 233"
            />
          </Field>
        )}

        {mode !== "forgot" && (
          <Field label="Mật khẩu" hint={mode === "signup" ? `Ít nhất ${PASSWORD_MIN} ký tự.` : undefined}>
            <input
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </Field>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-3 text-[13px] text-danger">
            {error}
          </p>
        )}
        {sent && (
          <p role="status" className="rounded-xl bg-blush px-3.5 py-3 text-[13px] text-rose-dark">
            Nếu tài khoản tồn tại, 360dep đã gửi link đặt lại mật khẩu tới email của tài khoản. Link dùng được một lần.
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy || !canSubmit}>
          {busy
            ? "Đang xử lý…"
            : mode === "signin"
              ? "Đăng nhập"
              : mode === "signup"
                ? "Tạo tài khoản"
                : "Gửi link đặt lại"}
        </Button>

        {mode === "signin" && (
          <button type="button" className="mx-auto block py-2 text-sm text-rose hover:text-rose-dark" onClick={() => switchTo("forgot")}>
            Quên mật khẩu?
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" className="mx-auto block py-2 text-sm text-ink-soft hover:text-ink" onClick={() => switchTo("signin")}>
            Quay lại đăng nhập
          </button>
        )}
        {mode === "signup" && (
          <p className="text-center text-xs text-muted">
            Tạo tài khoản nghĩa là bạn đồng ý để 360dep xử lý tên, số điện thoại và email của bạn theo{" "}
            <Link href="/chinh-sach" className="underline">
              chính sách
            </Link>
            .
          </p>
        )}
      </form>
    </div>
  )
}
