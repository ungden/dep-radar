"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FieldError, PasswordField } from "@/components/password-field"
import { Button, Field, Tabs, inputClass } from "@/components/ui"
import { signInWithPassword, signUpWithPassword } from "@/lib/auth/actions"
import { MIN_PASSWORD_LENGTH, parseIdentifier } from "@/lib/auth/identifier"
import { formatPhone } from "@/lib/auth/phone"
import { MESSAGES, type SignUpField, checkSignUp } from "@/lib/auth/password-rules"
import { cn } from "@/lib/utils"

type Mode = "dang-nhap" | "tao-tai-khoan"

/** Phone number or email, and a password. Sign in, or make an account. */
export function PasswordForm({ next, initialMode, googleEnabled }: { next: string; initialMode: Mode; googleEnabled: boolean }) {
  const [mode, setMode] = React.useState<Mode>(initialMode)
  return (
    <section aria-label="Đăng nhập bằng mật khẩu">
      <Tabs
        value={mode}
        onChange={setMode}
        items={[
          { value: "dang-nhap", label: "Đăng nhập" },
          { value: "tao-tai-khoan", label: "Tạo tài khoản" },
        ]}
      />
      {mode === "dang-nhap" ? <SignIn next={next} googleEnabled={googleEnabled} /> : <SignUp next={next} />}
    </section>
  )
}

function SignIn({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const router = useRouter()
  const [identifier, setIdentifier] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  return (
    <form
      className="mt-5 space-y-4"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        if (parseIdentifier(identifier).kind === "invalid") return setError(MESSAGES.invalidIdentifier)
        if (!password) return setError(MESSAGES.noPassword)
        setBusy(true)
        setError(null)
        const result = await signInWithPassword({ identifier, password, next })
        if (!result.ok) {
          setBusy(false)
          return setError(result.error)
        }
        router.replace(result.next)
        router.refresh()
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
        />
      </Field>
      <PasswordField label="Mật khẩu" value={password} onChange={setPassword} autoComplete="current-password" />
      <div className="-mt-1 text-right">
        <Link href="/quen-mat-khau" className="inline-flex min-h-11 items-center text-[14px] font-medium text-accent underline-offset-2 hover:underline">
          Quên mật khẩu?
        </Link>
      </div>
      {error && (
        <div role="alert" className="rounded-xl bg-danger-soft px-3.5 py-3 text-[14px] text-danger">
          {error}
          {error === MESSAGES.wrong && googleEnabled && (
            <span className="mt-1 block text-[13px] text-ink-soft">Nếu bạn từng vào 360dep bằng Google, dùng nút “Tiếp tục với Google” ở trên.</span>
          )}
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
    </form>
  )
}

function SignUp({ next }: { next: string }) {
  const router = useRouter()
  const [fullName, setFullName] = React.useState("")
  const [identifier, setIdentifier] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [problem, setProblem] = React.useState<{ field: SignUpField | null; error: string } | null>(null)
  const [busy, setBusy] = React.useState(false)
  const id = parseIdentifier(identifier)
  const fieldError = (field: SignUpField) => (problem?.field === field ? problem.error : null)

  return (
    <form
      className="mt-5 space-y-4"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        const checked = checkSignUp({ identifier, password, fullName })
        if (!checked.ok) return setProblem({ field: checked.field, error: checked.error })
        setBusy(true)
        setProblem(null)
        const result = await signUpWithPassword({ identifier, password, fullName, next })
        if (!result.ok) {
          setBusy(false)
          return setProblem({ field: null, error: result.error })
        }
        router.replace(result.next)
        router.refresh()
      }}
    >
      <Field label="Họ và tên">
        <input
          className={cn(inputClass, fieldError("fullName") && "border-danger")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          aria-invalid={Boolean(fieldError("fullName"))}
        />
        <FieldError text={fieldError("fullName")} />
      </Field>
      <Field label="Số điện thoại hoặc email">
        <input
          className={cn(inputClass, fieldError("identifier") && "border-danger")}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="0912 345 678 hoặc ten@gmail.com"
          aria-invalid={Boolean(fieldError("identifier"))}
        />
        <FieldError text={fieldError("identifier")} />
        {!fieldError("identifier") && (
          <span className="mt-1 block text-xs text-muted">
            {id.kind === "phone"
              ? `Bạn sẽ đăng nhập bằng số ${formatPhone(id.phone)}. Sau đó nên thêm email để lấy lại mật khẩu khi quên.`
              : id.kind === "email"
                ? "Sau khi tạo tài khoản, 360dep sẽ hỏi số điện thoại của bạn."
                : "Số di động Việt Nam, hoặc email."}
          </span>
        )}
      </Field>
      <PasswordField
        label="Mật khẩu"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự, không chỉ có số.`}
        error={fieldError("password")}
      />
      {problem && !problem.field && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-3 text-[14px] text-danger">
          {problem.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
      </Button>
    </form>
  )
}
