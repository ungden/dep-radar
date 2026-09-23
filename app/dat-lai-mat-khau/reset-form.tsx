"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PasswordField } from "@/components/password-field"
import { Button, ButtonLink, Card, Skeleton } from "@/components/ui"
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/identifier"
import { authErrorKind, newPasswordProblem } from "@/lib/auth/password-rules"
import { supabaseBrowser } from "@/lib/supabase/client"

type Stage = "checking" | "ready" | "expired" | "invalid" | "done"

/** Signs this browser in with the recovery session the link carries, if it carries a usable one. */
async function sessionFromLink(fragment: URLSearchParams): Promise<Stage> {
  if (fragment.get("error_code") || fragment.get("error")) return "expired"
  const accessToken = fragment.get("access_token")
  const refreshToken = fragment.get("refresh_token")
  if (!accessToken || !refreshToken || fragment.get("type") !== "recovery") return "invalid"
  const { error } = await supabaseBrowser().auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
  return error ? "expired" : "ready"
}

/**
 * The reset email's link comes back with the session in the URL fragment
 * (#access_token=…&type=recovery), which only the browser can read. Taking it
 * here rather than through a server callback means the link works in whatever
 * browser opens the email, not only the one that asked for it.
 */
export function ResetForm() {
  const router = useRouter()
  const [stage, setStage] = React.useState<Stage>("checking")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const started = React.useRef(false)

  React.useEffect(() => {
    // Once: the fragment is cleared below, so a second run (Strict Mode) would find nothing.
    if (started.current) return
    started.current = true
    const fragment = new URLSearchParams(window.location.hash.slice(1))
    // The tokens should not stay in the address bar or the history.
    if (window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname)
    void sessionFromLink(fragment).then(setStage)
  }, [])

  if (stage === "checking") return <Skeleton className="mt-6 h-40" />

  if (stage === "expired" || stage === "invalid") {
    return (
      <Card className="mt-6 p-5">
        <p className="font-semibold">{stage === "expired" ? "Link đã hết hạn hoặc đã được dùng" : "Link không hợp lệ"}</p>
        <p className="mt-1.5 text-[14px] text-ink-soft">
          Mỗi link đặt lại mật khẩu chỉ dùng được một lần và có thời hạn. Gửi link mới rồi mở link mới nhất trong email.
        </p>
        <ButtonLink href="/quen-mat-khau" className="mt-4">
          Gửi link mới
        </ButtonLink>
      </Card>
    )
  }

  if (stage === "done") {
    return (
      <Card className="mt-6 p-5">
        <p role="status" className="font-semibold">
          Đã đổi mật khẩu
        </p>
        <p className="mt-1.5 text-[14px] text-ink-soft">Bạn đang đăng nhập. Lần sau dùng mật khẩu mới.</p>
        <Button
          className="mt-4"
          onClick={() => {
            router.replace("/")
            router.refresh()
          }}
        >
          Tiếp tục
        </Button>
      </Card>
    )
  }

  return (
    <form
      className="mt-6 space-y-4"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        const problem = newPasswordProblem(password)
        if (problem) return setError(problem)
        setBusy(true)
        setError(null)
        const { error: updateError } = await supabaseBrowser().auth.updateUser({ password })
        setBusy(false)
        if (!updateError) return setStage("done")
        const kind = authErrorKind(updateError)
        setError(
          kind === "same_password"
            ? "Mật khẩu mới phải khác mật khẩu cũ."
            : kind === "weak_password"
              ? "Mật khẩu này quá dễ đoán. Chọn mật khẩu khác."
              : "Chưa đổi được mật khẩu. Link có thể đã hết hạn; gửi link mới rồi thử lại.",
        )
      }}
    >
      <PasswordField
        label="Mật khẩu mới"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự, không chỉ có số.`}
        error={error}
      />
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Đang lưu…" : "Lưu mật khẩu mới"}
      </Button>
    </form>
  )
}
